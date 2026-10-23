const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const clone = (value) => {
  if (value == null || typeof value !== 'object') return value;
  if (typeof value.toMillis === 'function') return value;
  if (value instanceof Date) return new Date(value);
  if (Array.isArray(value)) return value.map(clone);
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, clone(child)]));
};

// Serial transactions, rollback, merge, dot paths, and the read-before-write constraint.
// This is an offline regression fixture, not a replacement for the Firestore emulator.
function createDb(initial = {}) {
  const docs = new Map(Object.entries(initial).map(([key, value]) => [key, clone(value)]));
  let tail = Promise.resolve();
  const snapshot = (key) => ({ id: key.split('/').at(-1), exists: docs.has(key), data: () => clone(docs.get(key)), ref: reference(key) });
  const merge = (target, patch) => {
    for (const [key, value] of Object.entries(patch)) {
      if (key.includes('.')) {
        const parts = key.split('.'); let parent = target;
        for (const part of parts.slice(0, -1)) parent = parent[part] ||= {};
        merge(parent, { [parts.at(-1)]: value });
      } else if (value?.__op === 'timestamp' || value?.constructor?.name === 'ServerTimestampTransform') target[key] = new Date().toISOString();
      else if (value?.__op === 'increment') target[key] = Number(target[key] || 0) + value.amount;
      else if (value?.__op === 'delete' || value?.constructor?.name === 'DeleteTransform') delete target[key];
      else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) target[key] = merge(target[key] && typeof target[key] === 'object' ? target[key] : {}, value);
      else target[key] = clone(value);
    }
    return target;
  };
  const write = (key, value, preserve) => docs.set(key, merge(preserve ? docs.get(key) || {} : {}, value));
  const reference = (key) => ({ key, id: key.split('/').at(-1), get: async () => snapshot(key), set: async (value, options) => write(key, value, options?.merge), update: async (value) => write(key, value, true) });
  const query = (name, conditions = [], limit = Infinity) => ({
    doc: (id) => reference(`${name}/${id}`),
    where: (key, op, value) => { if (op !== '==') throw new Error(`unsupported fixture operator: ${op}`); return query(name, [...conditions, [key, value]], limit); },
    limit: (count) => query(name, conditions, count),
    get: async () => {
      const keys = [...docs.keys()].filter((key) => key.startsWith(`${name}/`) && conditions.every(([field, value]) => get(docs.get(key), field) === value)).slice(0, limit);
      return { docs: keys.map(snapshot), empty: !keys.length };
    },
  });
  const db = {
    collection: (name) => query(name),
    runTransaction: (callback) => {
      const execute = async () => {
        const writes = []; let hasWrites = false;
        const tx = {
          get: async (ref) => { if (hasWrites) throw new Error('transaction read after write'); return snapshot(ref.key); },
          set: (ref, value, options) => { hasWrites = true; writes.push([ref.key, value, options?.merge]); },
          update: (ref, value) => { hasWrites = true; if (!docs.has(ref.key)) throw new Error('missing update target'); writes.push([ref.key, value, true]); },
        };
        const result = await callback(tx);
        for (const [key, value, preserve] of writes) write(key, value, preserve);
        return result;
      };
      const result = tail.then(execute); tail = result.catch(() => {}); return result;
    },
  };
  const firestore = () => db;
  firestore.FieldValue = { serverTimestamp: () => ({ __op: 'timestamp' }), delete: () => ({ __op: 'delete' }), increment: (amount) => ({ __op: 'increment', amount }) };
  const admin = { apps: [{}], firestore };
  const caller = {
    isAdminUid: async (uid) => uid === 'admin',
    assertApplicationOwner: async (request, id) => {
      const application = docs.get(`twoweeksApplications/${id}`);
      if (!request.auth?.uid || !application || application.uid !== request.auth.uid) throw new Error('not owner');
      return { uid: request.auth.uid, application };
    },
  };
  return { db, docs, admin, caller };
}

function loadModule(filename, mocks = {}) {
  const nativeRequire = createRequire(filename);
  const module = { exports: {} };
  const wrapper = vm.runInThisContext(`(function(require,module,exports){${fs.readFileSync(filename, 'utf8')}\n})`, { filename });
  wrapper((name) => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name), module, module.exports);
  return module.exports;
}
module.exports = { createDb, loadModule };

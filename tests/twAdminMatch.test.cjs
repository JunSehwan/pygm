const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDb } = require('./helpers/twFakeFirestore.cjs');
const policy = require('../functions/twoWeeksSchedulePolicy');

function setup(beforeTransaction = () => {}) {
  const male = { id: 'male', roundId: 'round', basic: { gender: 'male', name: '남성', nickname: '기존 프로필' }, matchingStatus: 'not_started' };
  const female = { id: 'female', roundId: 'round', basic: { gender: 'female', name: '여성' }, matchingStatus: 'not_started' };
  const f = createDb({ 'twoweeksApplications/male': male, 'twoweeksApplications/female': female });
  const snap = (value) => ({ ...value, exists: () => value.exists });
  const filename = path.resolve(__dirname, '../components/TwoWeeksAdmin/adminService.js');
  const source = fs.readFileSync(filename, 'utf8').replace(/^import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, '').replace(/^export\s+/gm, '');
  const module = { exports: {} };
  vm.runInNewContext(`${source}\nmodule.exports = { createTwoWeeksMatch };`, {
    module, db: f.db, console,
    doc: (db, collection, id) => db.collection(collection).doc(id),
    collection: (db, name) => db.collection(name),
    getDoc: async (ref) => snap(await ref.get()),
    getDocs: (query) => query.get(),
    where: (...args) => args,
    query: (collection, ...conditions) => conditions.reduce((query, condition) => query.where(...condition), collection),
    runTransaction: (_db, callback) => { beforeTransaction(f.docs); return f.db.runTransaction((tx) => callback({ ...tx, get: async (ref) => snap(await tx.get(ref)) })); },
    setDoc: (ref, value, options) => ref.set(value, options), updateDoc: (ref, value) => ref.update(value),
    serverTimestamp: f.admin.firestore.FieldValue.serverTimestamp,
    getApplicationName: (app) => app.basic.name, getBasic: (app) => app.basic || {},
    getRoundId: (app) => app.roundId,
    getMatchingAvailabilityBlockReason: () => '', isMatchAvailableApplication: (app) => app.matchingStatus === 'not_started',
    getSameCompanyConflict: () => ({ blocked: false }),
    getPairScore: (left) => ({ complete: left.profileComplete !== false, total: 80, rankingScore: 95, internalAdjustment: 15 }),
    getHardMatchingBlockers: () => [], getAdvisoryMatchingConflicts: () => [], getUnacknowledgedMatchingConflicts: () => [],
    normalizeTimeSlotLabels: (values) => values, normalizePhone: () => '',
    TWOWEEKS_PROPOSAL_RESPONSE_DUE_HOURS: 48, TWOWEEKS_SCHEDULE_TOTAL_DUE_HOURS: 48, TWOWEEKS_SCHEDULE_STAGE_DUE_HOURS: 24,
    addScheduleHoursClient: policy.addHoursClient, buildTwoWeeksSchedulePolicy: policy.buildSchedulePolicy,
  }, { filename });
  return { ...f, create: () => module.exports.createTwoWeeksMatch({ male, female, adminUid: 'admin' }) };
}

test('admin creation revalidates compatibility inside the transaction', async () => {
  const f = setup((docs) => { docs.get('twoweeksApplications/male').profileComplete = false; });
  await assert.rejects(f.create(), /매칭 조건이 변경/);
  assert.equal(f.docs.has('twoweeksMatches/round_male_female'), false);
});
test('admin creation rejects reversed or invalid gender roles', async () => {
  const f = setup((docs) => { docs.get('twoweeksApplications/male').basic.gender = 'female'; });
  await assert.rejects(f.create(), /남성 신청자와 여성 신청자/);
});
test('admin creation snapshots the current profile and keeps internal ranking private', async () => {
  const f = setup((docs) => { docs.get('twoweeksApplications/male').basic.nickname = '변경된 프로필'; });
  const result = await f.create(); assert.equal(result.matchId, 'round_male_female');
  const match = f.docs.get('twoweeksMatches/round_male_female');
  assert.equal(match.candidatePreviews.female.basic.nickname, '변경된 프로필');
  assert.equal(Object.hasOwn(match.matchingCompatibility, 'rankingScore'), false);
  assert.equal(Object.hasOwn(match.matchingCompatibility, 'internalAdjustment'), false);
});

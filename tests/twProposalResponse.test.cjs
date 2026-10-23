// 실행: NODE_PATH=<functions/node_modules> node --test tests/twProposalResponse.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const callerFile = path.resolve(__dirname, '../functions/twoWeeksCallerAuth.js');
const caller = require(callerFile);
const original = caller.assertApplicationOwner;
caller.assertApplicationOwner = async (req, applicationId) => {
  if (req.auth?.uid !== 'viewer-owner' || applicationId !== 'male') {
    throw new Error('not owner');
  }
};
const admin = require('../functions/node_modules/firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'demo-twoweeks-tests' });
const { recordTwoWeeksProposalResponse } = require('../functions/twoWeeksProposalRespond.js');
const FUTURE = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
function fakeDb({ myResponse = null, counterpartResponse = null, status = 'proposed' } = {}) {
  const docs = new Map([
    ['twoweeksMatches/match', {
      maleApplicationId: 'male', femaleApplicationId: 'female', roundId: 'round',
      status, createdAt: FUTURE, scheduleStatus: 'not_started',
    }],
    ['twoweeksApplications/male', { uid: 'viewer-owner', roundId: 'round', status: 'approved', reviewStatus: 'approved',
      matchingStatus: 'proposed', currentProposal: { matchId: 'match', candidateApplicationId: 'female', response: 'pending' },
    }],
    ['twoweeksApplications/female', { uid: 'other-owner', roundId: 'round', status: 'approved', reviewStatus: 'approved',
      matchingStatus: 'proposed', currentProposal: { matchId: 'match', candidateApplicationId: 'male', response: 'pending' },
    }],
  ]);
  if (myResponse) docs.set('twoweeksProposalResponses/male_female', { response: myResponse, responseOrder: 1 });
  if (counterpartResponse) docs.set('twoweeksProposalResponses/female_male', { response: counterpartResponse, responseOrder: 1 });
  const applyUpdate = (obj, changes) => {
    for (const [key, value] of Object.entries(changes)) {
      if (!key.includes('.')) { obj[key] = value; continue; }
      const parts = key.split('.'); let cur = obj;
      for (const part of parts.slice(0,-1)) cur = (cur[part] ||= {});
      cur[parts.at(-1)] = value;
    }
  };
  const db = {
    collection: (collection) => ({ doc: (id) => ({ key: `${collection}/${id}` }) }),
    runTransaction: async (callback) => {
      const writes = [];
      const tx = {
        get: async ({key}) => ({ exists: docs.has(key), id: key.split('/')[1], data: () => docs.get(key) }),
        update: (ref, patch) => writes.push([ref,patch,'update']),
        set: (ref, patch) => writes.push([ref,patch,'set']),
      };
      const result = await callback(tx);
      for (const [ref,patch,type] of writes) {
        const old = type === 'update' ? docs.get(ref.key) : (docs.get(ref.key)||{});
        assert.ok(old || type !== 'update');
        applyUpdate(old,patch);
        docs.set(ref.key,old);
      }
      return result;
    },
  };
  return { db, docs };
}
const request = (response) => ({ auth: {uid: 'viewer-owner'}, data: {viewerApplicationId:'male', candidateApplicationId:'female', matchId:'match', response} });
test('first acceptance atomically updates response and application', async () => {
  const {db,docs} = fakeDb(); const result = await recordTwoWeeksProposalResponse(request('accepted'), db);
  assert.equal(result.bothAccepted,false);
  assert.equal(docs.get('twoweeksApplications/male').currentProposal.response,'accepted');
  assert.equal(docs.get('twoweeksProposalResponses/male_female').response,'accepted');
});
test('prior partial accepted response repairs pending application', async () => {
  const {db,docs} = fakeDb({myResponse:'accepted'});
  const result = await recordTwoWeeksProposalResponse(request('accepted'), db);
  assert.equal(result.alreadySubmitted,true);
  assert.equal(docs.get('twoweeksApplications/male').currentProposal.response,'accepted');
});
test('both accepted opens mutual accepted state for both applications', async () => {
  const {db,docs} = fakeDb({counterpartResponse:'accepted'});
  const result = await recordTwoWeeksProposalResponse(request('accepted'),db);
  assert.equal(result.bothAccepted,true);
  assert.equal(docs.get('twoweeksApplications/male').matchingStatus,'mutualAccepted');
  assert.equal(docs.get('twoweeksApplications/female').matchingStatus,'mutualAccepted');
  assert.equal(docs.get('twoweeksMatches/match').status,'mutualAccepted');
});
test('cannot overwrite accepted response with a decline', async () => {
  const {db}=fakeDb({myResponse:'accepted'});
  await assert.rejects(recordTwoWeeksProposalResponse({...request('declined'),data:{...request('declined').data,declineReason:{code:'personal_timing'}}},db), /이미 다른 응답/);
});
test('terminal match rejects new response', async () => {
  const {db}=fakeDb({status:'expired'});
  await assert.rejects(recordTwoWeeksProposalResponse(request('accepted'),db),/이미 종료된/);
});
test('another member cannot submit the viewers response', async () => {
  const {db}=fakeDb();
  await assert.rejects(recordTwoWeeksProposalResponse({...request('accepted'),auth:{uid:'intruder'}},db), /not owner/);
});
test('declined writes terminal state and preserves decline response', async () => {
  const {db,docs}=fakeDb();
  const result=await recordTwoWeeksProposalResponse({...request('declined'),data:{...request('declined').data,declineReason:{code:'personal_timing'}}},db);
  assert.equal(result.bothAccepted,false);
  assert.equal(docs.get('twoweeksMatches/match').status,'declined');
  assert.equal(docs.get('twoweeksApplications/female').matchingStatus,'declined');
});
test.after(()=>{caller.assertApplicationOwner=original});
test('already accepted old match does not roll back a confirmed appointment', async () => {
  const {db,docs}=fakeDb({myResponse:'accepted', counterpartResponse:'accepted',status:'confirmed'});
  docs.get('twoweeksMatches/match').scheduleStatus='confirmed';
  const result=await recordTwoWeeksProposalResponse(request('accepted'),db);
  assert.equal(result.progressed,true);
  assert.equal(docs.get('twoweeksMatches/match').status,'confirmed');
  assert.equal(docs.get('twoweeksMatches/match').scheduleStatus,'confirmed');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createDb, loadModule } = require('./helpers/twFakeFirestore.cjs');
const { buildSchedulePolicy } = require('../functions/twoWeeksSchedulePolicy');
const root = path.resolve(__dirname, '../functions');

function setup() {
  const policy = buildSchedulePolicy();
  const app = (id, other) => ({ uid: `${id}-owner`, roundId: 'round', status: 'approved', reviewStatus: 'approved', matchingStatus: 'proposed', currentProposal: { matchId: 'match', candidateApplicationId: other, response: 'pending' } });
  const fixture = createDb({
    'twoweeksApplications/male': app('male', 'female'),
    'twoweeksApplications/female': app('female', 'male'),
    'twoweeksMatches/match': { maleApplicationId: 'male', femaleApplicationId: 'female', roundId: 'round', status: 'proposed', scheduleStatus: 'not_started', createdAt: new Date().toISOString(), schedulePolicy: policy },
    ...Object.fromEntries(['one', 'two', 'three', 'four'].map((id) => [`twoweeksCafeCandidates/${id}`, { name: `카페 ${id}`, area: '강남구', status: 'active' }])),
  });
  const mocks = { 'firebase-admin': fixture.admin, './twoWeeksCallerAuth': fixture.caller };
  const schedules = loadModule(path.join(root, 'twoWeeksScheduleSubmission.js'), mocks);
  const proposals = loadModule(path.join(root, 'twoWeeksProposalRespond.js'), { ...mocks, './twoWeeksScheduleSubmission': schedules });
  const sync = loadModule(path.join(root, 'twoWeeksMatchParticipantSync.js'), mocks);
  const request = (id, data) => ({ auth: { uid: `${id}-owner` }, data: { matchId: 'match', viewerApplicationId: id, candidateApplicationId: id === 'male' ? 'female' : 'male', ...data } });
  const respond = (id, response = 'accepted') => proposals.recordTwoWeeksProposalResponse(request(id, { response }), fixture.db);
  const first = (id) => schedules.recordTwoWeeksSchedule(request(id, { mode: 'first', timeIds: policy.allowedTimeOptionIds.slice(0, 3), placeIds: ['one', 'two', 'three'] }), fixture.db);
  const final = (id, data = {}) => schedules.recordTwoWeeksSchedule(request(id, { mode: 'final', timeId: policy.allowedTimeOptionIds[0], placeId: 'one', ...data }), fixture.db);
  const accept = async () => { await respond('male'); await respond('female'); };
  return { ...fixture, ...schedules, ...sync, request, respond, first, final, accept, policy, match: () => fixture.docs.get('twoweeksMatches/match') };
}

for (const firstSelector of ['male', 'female']) test(`${firstSelector} first: accept → 3 choices → counterpart confirmation updates both applications`, async () => {
  const f = setup(); await f.accept();
  assert.equal(f.match().scheduleStatus, 'ready');
  assert.ok(f.match().schedule.serverPolicyInitializedAt);
  await f.first(firstSelector);
  const counterpart = firstSelector === 'male' ? 'female' : 'male';
  const result = await f.final(counterpart);
  assert.equal(result.ok, true);
  assert.equal(f.match().status, 'confirmed');
  assert.equal(f.match().finalMeeting.cafeName, '카페 one');
  for (const id of ['male', 'female']) {
    assert.equal(f.docs.get(`twoweeksApplications/${id}`).matchingStatus, 'confirmed');
    assert.equal(f.docs.get(`twoweeksApplications/${id}`).schedule.finalMeeting.startAtClient, result.finalMeeting.startAtClient);
  }
});

test('a single acceptance cannot start scheduling', async () => { const f = setup(); await f.respond('male'); await assert.rejects(f.first('male'), /양쪽 모두/); });
test('simultaneous first submissions have one winner and preserve that selection', async () => {
  const f = setup(); await f.accept();
  const results = await Promise.allSettled([f.first('male'), f.first('female')]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.equal(f.match().schedule.firstSelectorApplicationId, 'male');
});
test('the first selector cannot finalize their own proposal', async () => { const f = setup(); await f.accept(); await f.first('male'); await assert.rejects(f.final('male'), /상대방이 제출/); });
test('an allowed time outside the proposed three cannot be selected', async () => { const f = setup(); await f.accept(); await f.first('male'); await assert.rejects(f.final('female', { timeId: f.policy.allowedTimeOptionIds[4] }), /상대방이 제안/); });
test('an active cafe outside the proposed three cannot be selected', async () => { const f = setup(); await f.accept(); await f.first('male'); await assert.rejects(f.final('female', { placeId: 'four' }), /상대방이 제안/); });
test('duplicate time choices are rejected without partial writes', async () => {
  const f = setup(); await f.accept();
  await assert.rejects(f.recordTwoWeeksSchedule(f.request('male', { mode: 'first', timeIds: Array(3).fill(f.policy.allowedTimeOptionIds[0]), placeIds: ['one', 'two', 'three'] }), f.db), /서로 다른/);
  assert.equal(f.match().scheduleStatus, 'ready');
});
test('inactive cafes cannot be used for a confirmed meeting', async () => { const f = setup(); await f.accept(); await f.first('male'); f.docs.get('twoweeksCafeCandidates/one').status = 'inactive'; await assert.rejects(f.final('female'), /장소가 현재/); assert.equal(f.match().status, 'mutualAccepted'); });
test('first selection has a 24 hour server deadline', async () => { const f = setup(); await f.accept(); f.match().schedule.serverPolicyInitializedAt = new Date(Date.now() - 25 * 3600000).toISOString(); await assert.rejects(f.first('male'), /기한이 지났/); });
test('final selection has a 24 hour server deadline', async () => { const f = setup(); await f.accept(); await f.first('male'); f.match().schedule.firstSelectedAt = new Date(Date.now() - 25 * 3600000).toISOString(); await assert.rejects(f.final('female'), /기한이 지났/); });
test('retrying a first selection does not reset the deadline', async () => { const f = setup(); await f.accept(); await f.first('male'); const anchor = f.match().schedule.firstSelectedAt; assert.equal((await f.first('male')).alreadySubmitted, true); assert.equal(f.match().schedule.firstSelectedAt, anchor); });
test('retrying final confirmation does not rewrite a confirmed appointment', async () => { const f = setup(); await f.accept(); await f.first('male'); await f.final('female'); const before = JSON.stringify(f.match()); assert.equal((await f.final('female')).alreadySubmitted, true); assert.equal(JSON.stringify(f.match()), before); });
test('an expired or cancelled match cannot be revived by a participant', async () => { for (const status of ['expired', 'cancelled', 'completed']) { const f = setup(); await f.accept(); await f.first('male'); f.match().status = status; await assert.rejects(f.final('female'), /종료된/); assert.equal(f.match().status, status); } });
test('admin confirmation also rejects stale cancelled meetings', async () => { const f = setup(); await f.accept(); await f.first('male'); await f.final('female'); f.match().status = 'cancelled'; await assert.rejects(f.recordTwoWeeksSchedule({ auth: { uid: 'admin' }, data: { mode: 'admin_confirm', matchId: 'match' } }, f.db), /종료된/); });
test('admin confirmation reads the current meeting and updates both participants atomically', async () => { const f = setup(); await f.accept(); await f.first('male'); await f.final('female'); await f.recordTwoWeeksSchedule({ auth: { uid: 'admin' }, data: { mode: 'admin_confirm', matchId: 'match', place: { memo: '운영자 안내' } } }, f.db); assert.equal(f.match().finalMeeting.memo, '운영자 안내'); assert.equal(f.docs.get('twoweeksApplications/male').schedule.finalMeeting.memo, '운영자 안내'); });
test('a participant cannot call the admin confirmation mode', async () => { const f = setup(); await assert.rejects(f.recordTwoWeeksSchedule(f.request('male', { mode: 'admin_confirm' }), f.db), /관리자만/); });
test('another account cannot act as a participant', async () => { const f = setup(); await f.accept(); const request = f.request('male', { mode: 'first' }); request.auth.uid = 'intruder'; await assert.rejects(f.recordTwoWeeksSchedule(request, f.db), /not owner/); });
test('a new current proposal blocks writes from a previous match', async () => { const f = setup(); await f.accept(); await f.first('male'); f.docs.get('twoweeksApplications/female').currentProposal.matchId = 'new-match'; await assert.rejects(f.final('female'), /현재 진행 중인/); });
test('a delayed sync cannot replace a new proposal with an old declined one', async () => { const f = setup(); f.match().status = 'declined'; f.docs.get('twoweeksApplications/male').currentProposal.matchId = 'new-match'; await f.synchronizeMatchParticipants(f.db, 'match'); assert.equal(f.docs.get('twoweeksApplications/male').currentProposal.matchId, 'new-match'); assert.equal(f.docs.get('twoweeksApplications/female').matchingStatus, 'declined'); });
test('sync uses the current confirmed state, regardless of the triggering event', async () => { const f = setup(); await f.accept(); await f.first('male'); await f.final('female'); f.docs.get('twoweeksApplications/male').matchingStatus = 'mutualAccepted'; await f.synchronizeMatchParticipants(f.db, 'match'); assert.equal(f.docs.get('twoweeksApplications/male').matchingStatus, 'confirmed'); });
test('residual confirmed schedule fields cannot revive a cancelled match during sync', async () => { const f = setup(); await f.accept(); await f.first('male'); await f.final('female'); f.match().status = 'cancelled'; f.docs.get('twoweeksApplications/male').matchingStatus = 'cancelled'; await f.synchronizeMatchParticipants(f.db, 'match'); assert.equal(f.docs.get('twoweeksApplications/male').matchingStatus, 'cancelled'); });

function notifications(f) {
  return loadModule(path.join(root, 'twoWeeksMutualAcceptedNotification.js'), {
    'firebase-admin': f.admin, './twoWeeksCallerAuth': f.caller,
    './twoWeeksScheduleSubmission': f,
    './twoWeeksAdminLifecycleNotification': { notifyTwoWeeksAdminLifecycle: async () => ({}) },
    axios: { post: async () => { throw new Error('SMS is disabled in offline tests'); } },
  }).notifyTwoWeeksMutualAccepted;
}
test('a delayed mutual acceptance notification cannot overwrite submitted choices', async () => {
  const f = setup(); await f.accept(); await f.first('male'); const before = JSON.stringify(f.match());
  const result = await notifications(f).run(f.request('male', {}));
  assert.equal(result.status, 'already_progressed'); assert.equal(JSON.stringify(f.match()), before);
});
test('a delayed mutual acceptance notification does not reopen a confirmed meeting', async () => {
  const f = setup(); await f.accept(); await f.first('male'); await f.final('female');
  const before = JSON.stringify(f.match()); await notifications(f).run(f.request('male', {}));
  assert.equal(JSON.stringify(f.match()), before);
});
function expiration(f) {
  return loadModule(path.join(root, 'twoWeeksDeadlineExpirations.js'), { 'firebase-admin': f.admin, axios: { post: async () => { throw new Error('SMS disabled in tests'); } } });
}
test('a stale proposal expiration snapshot cannot undo a mutual acceptance', async () => {
  const f = setup(); const old = { ...f.match(), id: 'match' }; await f.accept();
  const result = await expiration(f).expireProposalMatch({ db: f.db, match: old, nowMs: Date.now() + 49 * 3600000 });
  assert.equal(result, null); assert.equal(f.match().scheduleStatus, 'ready');
});
test('a stale schedule snapshot cannot expire a just-selected next step', async () => {
  const f = setup(); await f.accept(); const old = { ...f.match(), id: 'match' }; await f.first('male');
  const result = await expiration(f).expireScheduleMatch({ db: f.db, match: old, nowMs: Date.now() });
  assert.equal(result, null); assert.equal(f.match().scheduleStatus, 'waiting_counterpart');
});
test('proposal expiry records the first warning exactly once across retries', async () => {
  const f = setup(); f.match().createdAt = new Date(Date.now() - 49 * 3600000).toISOString();
  const process = expiration(f); const args = { db: f.db, match: { id: 'match' }, nowMs: Date.now() };
  assert.ok(await process.expireProposalMatch(args)); assert.equal(await process.expireProposalMatch(args), null);
  for (const id of ['male', 'female']) {
    const app = f.docs.get(`twoweeksApplications/${id}`);
    assert.equal(app.penaltyStats.proposalNoResponseCount, 1);
    assert.equal(app.matchingStatus, 'not_started');
  }
});
test('schedule expiry never clears a replacement proposal', async () => {
  const f = setup(); await f.accept(); await f.first('male');
  f.match().schedule.firstSelectedAt = new Date(Date.now() - 25 * 3600000).toISOString();
  f.docs.get('twoweeksApplications/male').currentProposal.matchId = 'new-match';
  await expiration(f).expireScheduleMatch({ db: f.db, match: { id: 'match' }, nowMs: Date.now() });
  assert.equal(f.docs.get('twoweeksApplications/male').currentProposal.matchId, 'new-match');
  assert.equal(f.match().status, 'schedule_expired');
});

test('legacy first-time no-response review is repaired from current state', async () => {
  const f = setup(); const app = f.docs.get('twoweeksApplications/male');
  Object.assign(app, { matchingStatus: 'paused', nextRoundStatus: 'admin_review', matchingPauseReason: 'proposal_no_response', penaltyStats: { proposalNoResponseCount: 1 }, currentProposal: { candidateApplicationId: 'female', status: 'expired' } });
  const result = await expiration(f).repairExpiredAdminReviewApplications({ db: f.db });
  assert.equal(result.returnedToPool, 1); assert.equal(app.matchingStatus, 'not_started');
});
test('background review repair cannot clear a new proposal created after its scan', async () => {
  const f = setup(); const app = f.docs.get('twoweeksApplications/male');
  Object.assign(app, { matchingStatus: 'paused', nextRoundStatus: 'admin_review', matchingPauseReason: 'proposal_no_response', penaltyStats: { proposalNoResponseCount: 1 } });
  const runTransaction = f.db.runTransaction;
  f.db.runTransaction = (callback) => {
    app.matchingStatus = 'proposed'; app.nextRoundStatus = 'ready'; app.currentProposal.matchId = 'new-match';
    return runTransaction(callback);
  };
  const result = await expiration(f).repairExpiredAdminReviewApplications({ db: f.db });
  assert.equal(result.returnedToPool, 0); assert.equal(app.currentProposal.matchId, 'new-match'); assert.equal(app.matchingStatus, 'proposed');
});

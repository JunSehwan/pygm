const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createDb } = require('./helpers/twFakeFirestore.cjs');

function setup() {
  const f = createDb({ 'twoweeksMatches/match': { status: 'confirmed', scheduleStatus: 'confirmed', maleApplicationId: 'male', femaleApplicationId: 'female', finalMeeting: { startAtClient: new Date().toISOString() } } });
  const filename = path.resolve(__dirname, '../components/TwoWeeksProposal/proposalService.js');
  const source = fs.readFileSync(filename, 'utf8').replace(/^import\s[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, '').replace(/^export\s+/gm, '');
  const module = { exports: {} };
  vm.runInNewContext(`${source}\nmodule.exports = { recordOwnMeetingState };`, {
    module, db: f.db,
    serverTimestamp: f.admin.firestore.FieldValue.serverTimestamp,
    runTransaction: (_db, callback) => f.db.runTransaction((tx) => callback({
      ...tx, get: async (ref) => { const snap = await tx.get(ref); return { ...snap, exists: () => snap.exists }; },
    })),
  }, { filename });
  const submit = (id, field = 'meetingAttendance') => module.exports.recordOwnMeetingState({
    matchRef: f.db.collection('twoweeksMatches').doc('match'),
    viewerApplication: { id }, candidateApplication: { id: id === 'male' ? 'female' : 'male' },
    field, summaryField: field === 'meetingAttendance' ? 'attendanceStatus' : 'arrivalStatus',
    completeStatus: field === 'meetingAttendance' ? 'both_confirmed' : 'both_arrived',
    payload: { applicationId: id, status: field === 'meetingAttendance' ? 'attending' : 'arrived' },
    requireMeetingDay: field === 'meetingArrival',
  });
  return { ...f, submit, match: () => f.docs.get('twoweeksMatches/match') };
}

for (const field of ['meetingAttendance', 'meetingArrival']) {
  test(`simultaneous ${field} submissions preserve both people and a complete summary`, async () => {
    const f = setup(); const results = await Promise.all([f.submit('male', field), f.submit('female', field)]);
    assert.equal(results.filter((result) => result.complete).length, 1);
    assert.equal(Object.keys(f.match()[field]).length, 2);
    assert.equal(f.match()[field === 'meetingAttendance' ? 'attendanceStatus' : 'arrivalStatus'], field === 'meetingAttendance' ? 'both_confirmed' : 'both_arrived');
  });
  test(`${field} cannot be recorded for a cancelled meeting`, async () => { const f = setup(); f.match().status = 'cancelled'; await assert.rejects(f.submit('male', field), /현재 확정된 만남/); });
  test(`${field} retries preserve the original row`, async () => { const f = setup(); await f.submit('male', field); const before = JSON.stringify(f.match()); assert.equal((await f.submit('male', field)).alreadyConfirmed, true); assert.equal(JSON.stringify(f.match()), before); });
}
test('arrival cannot be recorded on a different Seoul calendar day', async () => { const f = setup(); f.match().finalMeeting.startAtClient = new Date(Date.now() + 48 * 3600000).toISOString(); await assert.rejects(f.submit('male', 'meetingArrival'), /당일/); });

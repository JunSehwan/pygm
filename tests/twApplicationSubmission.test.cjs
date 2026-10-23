const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createDb, loadModule } = require('./helpers/twFakeFirestore.cjs');

function setup(gender = 'male') {
  const fixture = createDb({ 'twoweeksIdentityVerifications/verified': {
    ownerUid: 'applicant', phone: '01055550111', name: '인증된 이름', birth: '19900102', gender,
    verified: true, ciHash: 'verified-ci', expiresAt: { toMillis: () => Date.now() + 3600000 },
  } });
  const service = loadModule(path.resolve(__dirname, '../functions/twoWeeksApplicationSubmission.js'), {
    'firebase-admin': fixture.admin,
    './twoWeeksMarketingAttribution': { resolveApplicationMarketingData: async () => ({ marketingAttribution: { firstSource: 'direct' }, referral: { status: 'none' } }) },
  });
  const request = (applicationId = 'application_12345') => {
    const meta = (folder, name) => ({ path: `twoweeksApplications/${applicationId}/applicant/${folder}/${name}.jpg`, url: `https://example.test/${name}.jpg`, type: 'image/jpeg', size: 100 });
    return { auth: { uid: 'applicant' }, data: { applicationId, verificationDocument: meta('verification', 'job'), application: {
      uid: 'applicant', roundId: 'twoweeks_beta_1', basic: { phoneNormalized: '01055550111', phoneVerified: true, phoneVerificationSkipped: false, gender: gender === 'male' ? 'female' : 'male', name: '클라이언트 변조', birthDate: '20000101', birthYear: 2000, height: 175 },
      phoneIdentityVerification: { verified: true, verificationId: 'verified', phone: '01055550111' },
      identity: { schoolName: '테스트대학교', representativePhoto: meta('photos', 'one'), additionalPhotos: [meta('photos', 'two'), meta('photos', 'three')] },
      consents: { privacy: true, profileContact: true, noShowDeposit: true, falseInfo: true, marketing: false },
      currentProposal: { matchId: 'injected' }, withdrawal: { status: 'completed' }, contactOpenStatus: 'open', penaltyStats: { count: -1 },
      status: 'approved', reviewStatus: 'approved', matchingStatus: 'confirmed',
    } } };
  };
  return { ...fixture, request, submit: (req) => service.finalizeTwoWeeksApplicationSubmission.run(req) };
}

for (const gender of ['male', 'female']) test(`${gender}: registration stores verified identity and its matching deposit policy`, async () => {
  const f = setup(gender); const result = await f.submit(f.request());
  assert.equal(result.ok, true);
  const app = f.docs.get('twoweeksApplications/application_12345');
  assert.equal(app.basic.gender, gender);
  assert.equal(app.basic.name, '인증된 이름');
  assert.equal(app.basic.birthDate, '19900102');
  assert.equal(app.basic.birthYear, 1990);
  assert.equal(app.status, 'applied');
  assert.equal(app.reviewStatus, 'pending');
  assert.equal(app.matchingStatus, 'not_ready');
  assert.equal(app.deposit.policy, gender === 'female' ? 'waived' : 'required');
  assert.equal(app.deposit.status, gender === 'female' ? 'waived' : 'pending');
  assert.equal(app.consents.marketing, false);
  assert.equal(app.identity.verificationDocument, null);
  assert.ok(f.docs.get('twoweeksApplicationPrivate/application_12345').verificationDocument);
});
test('client supplied workflow and operational fields are not stored at registration', async () => {
  const f = setup(); await f.submit(f.request()); const app = f.docs.get('twoweeksApplications/application_12345');
  for (const key of ['currentProposal', 'withdrawal', 'contactOpenStatus', 'penaltyStats']) assert.equal(Object.hasOwn(app, key), false, key);
});
test('registration without required consent leaves no partial application', async () => { const f = setup(); const req = f.request(); req.data.application.consents.falseInfo = false; await assert.rejects(f.submit(req), /필수 약관/); assert.equal(f.docs.has('twoweeksApplications/application_12345'), false); });
test('two simultaneous registrations with the same identity create only one application', async () => {
  const f = setup(); const results = await Promise.allSettled([f.submit(f.request('application_first')), f.submit(f.request('application_second'))]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal([...f.docs.keys()].filter((key) => key.startsWith('twoweeksApplications/')).length, 1);
});
test('another account cannot reuse a verified identity', async () => { const f = setup(); const req = f.request(); req.auth.uid = 'intruder'; req.data.application.uid = 'intruder'; await assert.rejects(f.submit(req), /로그인 세션/); });
test('fewer than three profile photos are rejected', async () => { const f = setup(); const req = f.request(); req.data.application.identity.additionalPhotos.pop(); await assert.rejects(f.submit(req), /최소 3장/); });
test('real identity missing gender cannot use a client supplied female exemption', async () => { const f = setup(); f.docs.get('twoweeksIdentityVerifications/verified').gender = ''; await assert.rejects(f.submit(f.request()), /성별과 생년월일/); });

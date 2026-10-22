"use strict";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const { isAdminUid } = require("./twoWeeksCallerAuth");
if (!admin.apps.length) admin.initializeApp();
const REGION = "asia-northeast3";
const clean = (v, max = 150) => String(v || "").trim().slice(0, max);
const firestore = () => admin.firestore();
const stamp = () => admin.firestore.FieldValue.serverTimestamp();
async function requireAdmin(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  if (!await isAdminUid(request.auth.uid)) throw new HttpsError("permission-denied", "관리자 권한이 필요합니다.");
}
const collectionName = (type) => type === "event" ? "twoweeksReferralEvents" : type === "note" ? "twoweeksDatingNotes" : "";
function dateOnly(value) {
  if (!value) return "";
  const candidate = clean(value, 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) throw new HttpsError("invalid-argument", "날짜는 YYYY-MM-DD 형식으로 입력해주세요.");
  return candidate;
}
function publicEventFields(d = {}) {
  const startAt = dateOnly(d.startAt);
  const endAt = dateOnly(d.endAt);
  if (startAt && endAt && startAt > endAt) throw new HttpsError("invalid-argument", "이벤트 종료일은 시작일 이후여야 합니다.");
  const title = clean(d.title, 100);
  if (!title) throw new HttpsError("invalid-argument", "이벤트 제목을 입력해주세요.");
  return {
    title, description: clean(d.description, 500), rewardName: clean(d.rewardName, 120),
    rewardDetails: clean(d.rewardDetails, 600), conditions: clean(d.conditions, 800),
    startAt, endAt, active: d.active === true,
    sortOrder: Math.max(0, Math.min(999, Number(d.sortOrder) || 0)),
  };
}
function publicNoteFields(d = {}, old = {}) {
  const title = clean(d.title, 100);
  const instagramUrl = clean(d.instagramUrl, 500);
  if (!title) throw new HttpsError("invalid-argument", "연애노트 제목을 입력해주세요.");
  let url;
  try { url = new URL(instagramUrl); } catch { throw new HttpsError("invalid-argument", "인스타그램 게시물 URL을 확인해주세요."); }
  if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname) || !/^\/(p|reel|tv)\//.test(url.pathname)) {
    throw new HttpsError("invalid-argument", "인스타그램 게시물 또는 릴스 링크만 등록할 수 있어요.");
  }
  const thumbnailUrl = clean(d.thumbnailUrl || old.thumbnailUrl, 1500);
  const imagePath = clean(d.imagePath || old.imagePath, 250);
  if (thumbnailUrl && (!thumbnailUrl.startsWith("https://firebasestorage.googleapis.com/v0/b/") || !imagePath.startsWith("twoweeksDatingNotes/"))) throw new HttpsError("invalid-argument", "등록한 썸네일을 사용해주세요.");
  if (d.active === true && !thumbnailUrl) throw new HttpsError("failed-precondition", "공개할 콘텐츠는 썸네일을 먼저 업로드해주세요.");
  return { title, instagramUrl: url.toString(), thumbnailUrl, imagePath, active: d.active === true, sortOrder: Math.max(0, Math.min(999, Number(d.sortOrder) || 0)) };
}
const listTwoWeeksHomeAdmin = onCall({ region: REGION }, async (request) => {
  await requireAdmin(request);
  const types = ["twoweeksReferralEvents", "twoweeksDatingNotes"];
  const [events, notes] = await Promise.all(types.map(t => firestore().collection(t).limit(100).get()));
  const toRows = (snap) => snap.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || "", updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || "" }));
  return { events: toRows(events), notes: toRows(notes) };
});
const saveTwoWeeksHomeContent = onCall({ region: REGION }, async (request) => {
  await requireAdmin(request);
  const type = clean(request.data?.type, 20);
  const name = collectionName(type);
  if (!name) throw new HttpsError("invalid-argument", "콘텐츠 종류가 올바르지 않습니다.");
  const id = clean(request.data?.id, 128);
  if (id && !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new HttpsError("invalid-argument", "콘텐츠 ID가 올바르지 않습니다.");
  const ref = id ? firestore().collection(name).doc(id) : firestore().collection(name).doc();
  const current = await ref.get();
  const data = request.data?.value || {};
  const patch = type === "event" ? publicEventFields(data) : publicNoteFields(data, current.data() || {});
  await ref.set({ ...patch, createdAt: current.exists ? (current.data().createdAt || stamp()) : stamp(), updatedAt: stamp() }, { merge: true });
  return { ok: true, id: ref.id };
});
const uploadTwoWeeksDatingNoteImage = onCall({ region: REGION, memory: "512MiB", maxInstances: 5 }, async (request) => {
  await requireAdmin(request);
  const content = String(request.data?.base64 || "");
  const mime = clean(request.data?.contentType, 60).toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) throw new HttpsError("invalid-argument", "JPG, PNG, WEBP 이미지만 업로드할 수 있어요.");
  if (!content || content.length > 3 * 1024 * 1024) throw new HttpsError("invalid-argument", "이미지는 약 2MB 이하로 등록해주세요.");
  const buffer = Buffer.from(content, "base64");
  if (!buffer.length || buffer.length > 2 * 1024 * 1024) throw new HttpsError("invalid-argument", "이미지 파일이 너무 큽니다.");
  // Check magic bytes, not merely the user-provided MIME.
  const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const png = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  if (!(mime === "image/jpeg" && jpeg || mime === "image/png" && png || mime === "image/webp" && webp)) throw new HttpsError("invalid-argument", "이미지 파일 형식을 확인해주세요.");
  const bucket = admin.storage().bucket();
  const suffix = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const path = `twoweeksDatingNotes/${crypto.randomUUID()}.${suffix}`;
  const downloadToken = crypto.randomUUID();
  await bucket.file(path).save(buffer, { resumable: false, contentType: mime, metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken }, cacheControl: "public, max-age=86400" } });
  return { path, thumbnailUrl: `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}` };
});
// Use server-side deletion for content and corresponding thumbnail. Only deletes owned server-controlled folder.
const deleteTwoWeeksHomeContent = onCall({ region: REGION }, async (request) => {
  await requireAdmin(request);
  const name = collectionName(clean(request.data?.type, 20));
  const id = clean(request.data?.id, 128);
  if (!name || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new HttpsError("invalid-argument", "삭제 대상이 올바르지 않습니다.");
  const ref = firestore().collection(name).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: true };
  await ref.delete();
  // Old image remains if referenced elsewhere; garbage collection can be run separately.
  return { ok: true };
});
module.exports = { listTwoWeeksHomeAdmin, saveTwoWeeksHomeContent, uploadTwoWeeksDatingNoteImage, deleteTwoWeeksHomeContent };

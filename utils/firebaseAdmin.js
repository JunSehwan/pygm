export const ADMIN_UIDS = ["9OqbfNZW6lgq5NLB0lAigkYQxME2"];

export function isAllowedAdminUid(uid = "") {
  return ADMIN_UIDS.includes(uid);
}

export async function verifyIdToken() {
  console.warn(
    "[utils/firebaseAdmin] verifyIdToken is not configured in the Next.js app."
  );
  return null;
}
export function normalizeBlockText(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "");
}

export function normalizePhoneLast4(value = "") {
  return String(value || "").replace(/\D/g, "").slice(-4);
}

function normalizeName(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function getBlockedContacts(viewer = {}) {
  return Array.isArray(viewer?.blockedContacts) ? viewer.blockedContacts : [];
}

function getBlockedCompanyKeywords(viewer = {}) {
  return Array.isArray(viewer?.blockedCompanyKeywords)
    ? viewer.blockedCompanyKeywords
    : [];
}

export function getUserPhoneLast4(user = {}) {
  return normalizePhoneLast4(
    user?.phonenumber ||
    user?.phoneNumber ||
    user?.phone ||
    user?.mobile ||
    ""
  );
}

export function getUserNameCandidates(user = {}) {
  const raw = [
    user?.name,
    user?.realName,
    user?.username,
    user?.nickname,
    user?.displayName,
  ];

  return Array.from(
    new Set(
      raw
        .map((item) => normalizeName(item))
        .filter(Boolean)
    )
  );
}

export function getUserCompanyCandidates(user = {}) {
  const raw = [
    user?.company,
    user?.companyName,
    user?.workplace,
    user?.jobCompany,
  ];

  return Array.from(
    new Set(
      raw
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

export function isBlockedByContactRule(viewer = {}, targetUser = {}) {
  const blockedContacts = getBlockedContacts(viewer);
  if (!blockedContacts.length) return false;

  const phoneLast4 = getUserPhoneLast4(targetUser);
  if (!phoneLast4) return false;

  const targetKeys = getUserNameCandidates(targetUser).map((name) => {
    const normalizedName = normalizeBlockText(name);
    return `${normalizedName}_${phoneLast4}`;
  });

  if (!targetKeys.length) return false;

  return blockedContacts.some((rule) => {
    const normalizedKey =
      rule?.normalizedKey ||
      `${normalizeBlockText(rule?.name || "")}_${normalizePhoneLast4(rule?.phoneLast4 || "")}`;

    return !!normalizedKey && targetKeys.includes(normalizedKey);
  });
}

export function isBlockedByCompanyRule(viewer = {}, targetUser = {}) {
  const blockedKeywords = getBlockedCompanyKeywords(viewer);
  if (!blockedKeywords.length) return false;

  const normalizedCompanies = getUserCompanyCandidates(targetUser)
    .map((item) => normalizeBlockText(item))
    .filter(Boolean);

  if (!normalizedCompanies.length) return false;

  return blockedKeywords.some((rule) => {
    const normalizedKeyword =
      rule?.normalizedKeyword || normalizeBlockText(rule?.keyword || "");

    if (!normalizedKeyword || normalizedKeyword.length < 3) return false;

    return normalizedCompanies.some((company) =>
      company.includes(normalizedKeyword)
    );
  });
}

export function isBlockedTargetUser(viewer = {}, targetUser = {}) {
  if (!viewer || !targetUser) return false;

  return (
    isBlockedByContactRule(viewer, targetUser) ||
    isBlockedByCompanyRule(viewer, targetUser)
  );
}

export function filterBlockedUsers(viewer = {}, users = []) {
  if (!Array.isArray(users) || !users.length) return [];
  return users.filter((item) => !isBlockedTargetUser(viewer, item));
}
export function normalizeKoreanText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\w가-힣]/g, "");
}

export function normalizePhoneLast4(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 4);
}

export function normalizeName(value = "") {
  return String(value).trim().replace(/\s+/g, " ");
}

export function formatPhoneLast4(value = "") {
  const digits = normalizePhoneLast4(value);
  if (digits.length !== 4) return digits;
  return `****-${digits}`;
}

export function makeBlockedContact(name = "", phoneLast4 = "") {
  const normalizedName = normalizeName(name);
  const normalizedPhoneLast4 = normalizePhoneLast4(phoneLast4);
  const normalizedKey = `${normalizeKoreanText(normalizedName)}_${normalizedPhoneLast4}`;

  return {
    id: `${normalizedName}_${normalizedPhoneLast4}`,
    name: normalizedName,
    phoneLast4: normalizedPhoneLast4,
    normalizedKey,
    createdAt: Date.now(),
  };
}

export function makeBlockedCompanyKeyword(keyword = "") {
  const cleanedKeyword = String(keyword).trim().replace(/\s+/g, " ");
  const normalizedKeyword = normalizeKoreanText(cleanedKeyword);

  return {
    id: normalizedKeyword,
    keyword: cleanedKeyword,
    normalizedKeyword,
    createdAt: Date.now(),
  };
}

export function isValidBlockedContact(name = "", phoneLast4 = "") {
  const normalizedName = normalizeName(name);
  const normalizedPhone = normalizePhoneLast4(phoneLast4);

  if (!normalizedName || normalizedName.length < 2) {
    return {
      valid: false,
      message: "이름은 2자 이상 입력해주세요.",
    };
  }

  if (normalizedPhone.length !== 4) {
    return {
      valid: false,
      message: "전화번호 뒤 4자리를 입력해주세요.",
    };
  }

  return { valid: true, message: "" };
}

export function isValidBlockedCompany(keyword = "") {
  const cleanedKeyword = String(keyword).trim().replace(/\s+/g, " ");
  const normalizedKeyword = normalizeKoreanText(cleanedKeyword);

  if (!cleanedKeyword) {
    return {
      valid: false,
      message: "회사명을 입력해주세요.",
    };
  }

  if (normalizedKeyword.length < 3) {
    return {
      valid: false,
      message: "회사명은 3자 이상 입력해주세요.",
    };
  }

  return { valid: true, message: "" };
}

export function sortByCreatedAtDesc(list = []) {
  return [...list].sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
}

export function dedupeContacts(list = []) {
  const map = new Map();

  list.forEach((item) => {
    if (!item?.normalizedKey) return;
    if (!map.has(item.normalizedKey)) {
      map.set(item.normalizedKey, item);
    }
  });

  return sortByCreatedAtDesc(Array.from(map.values()));
}

export function dedupeCompanyKeywords(list = []) {
  const map = new Map();

  list.forEach((item) => {
    if (!item?.normalizedKeyword) return;
    if (!map.has(item.normalizedKeyword)) {
      map.set(item.normalizedKeyword, item);
    }
  });

  return sortByCreatedAtDesc(Array.from(map.values()));
}

export function formatCreatedAt(value) {
  if (!value) return "";
  try {
    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  } catch (e) {
    return "";
  }
}
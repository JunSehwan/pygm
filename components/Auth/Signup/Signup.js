import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";

import { signUp } from "slices/user";
import {
  createAccount,
  sendLms,
  saveIdentityVerificationToUser,
  phoneDubCheck,
} from "firebaseConfig";

import { requestPortoneIdentityVerification } from "lib/portoneIdentity";
import {
  clearPendingIdentityVerification,
  createIdentityVerificationId,
  prepareIdentityVerificationPending,
  verifyIdentityResultWithServer,
} from "lib/identityVerificationClient";

import SignupFormCard from "./Signup/SignupFormCard";

const SIGNUP_DRAFT_KEY = "charmingsoup_signup_draft_v6";
const SIGNUP_DRAFT_TTL_MS = 15 * 60 * 1000; // 5분

// 휴대폰 브라우저에 남아있는 예전 draft 강제 폐기용
const LEGACY_SIGNUP_DRAFT_KEYS = [
  "charmingsoup_signup_draft_v3",
  "charmingsoup_signup_draft_v4",
  "charmingsoup_signup_draft_v5",
];

const email_check = (email) =>
  /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i.test(
    email
  );

const initialForm = {
  username: "",
  nickname: "",
  gender: "",
  birth: "",
  email: "",
  tel: "",
  password: "",
  passwordCheck: "",
};

function normalizePhone(value = "") {
  return String(value || "").replace(/[^0-9]/g, "");
}

function normalizeBirth(value = "") {
  return String(value || "").replace(/[^0-9]/g, "").slice(0, 8);
}

function normalizeGender(value = "") {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase();

  if (
    raw === "1" ||
    raw === "3" ||
    lower === "m" ||
    lower === "male" ||
    lower === "man" ||
    raw === "남" ||
    raw === "남자" ||
    raw === "남성"
  ) {
    return "male";
  }

  if (
    raw === "2" ||
    raw === "4" ||
    lower === "f" ||
    lower === "female" ||
    lower === "woman" ||
    raw === "여" ||
    raw === "여자" ||
    raw === "여성"
  ) {
    return "female";
  }

  return "";
}

function isValidBirth(value = "") {
  const birth = normalizeBirth(value);
  if (birth.length !== 8) return false;

  const year = Number(birth.slice(0, 4));
  const month = Number(birth.slice(4, 6));
  const day = Number(birth.slice(6, 8));

  if (!year || !month || !day) return false;
  if (year < 1940 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function buildBirthdayObjectFromBirth(value = "") {
  const onlyNum = normalizeBirth(value);
  if (!isValidBirth(onlyNum)) return null;

  return {
    year: Number(onlyNum.slice(0, 4)),
    month: Number(onlyNum.slice(4, 6)),
    day: Number(onlyNum.slice(6, 8)),
  };
}

function safeSetStorage(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

function safeGetStorage(storage, key) {
  try {
    return storage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeRemoveStorage(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

function clearSignupDraft() {
  if (typeof window === "undefined") return;

  safeRemoveStorage(window.sessionStorage, SIGNUP_DRAFT_KEY);
  safeRemoveStorage(window.localStorage, SIGNUP_DRAFT_KEY);
}

function clearLegacySignupDrafts() {
  if (typeof window === "undefined") return;

  LEGACY_SIGNUP_DRAFT_KEYS.forEach((key) => {
    safeRemoveStorage(window.sessionStorage, key);
    safeRemoveStorage(window.localStorage, key);
  });
}

function isIdentityExpired(draft) {
  const hasVerifiedIdentity = !!draft?.identityVerifiedData?.verified;
  if (!hasVerifiedIdentity) return false;

  const identityVerifiedAt = Number(draft?.identityVerifiedAt || 0);

  if (!identityVerifiedAt) return true;

  return Date.now() - identityVerifiedAt > SIGNUP_DRAFT_TTL_MS;
}

function stripExpiredIdentityFromDraft(draft) {
  if (!draft) return null;

  return {
    ...draft,
    phoneVerified: false,
    identityVerifiedData: null,
    identityVerifiedAt: 0,
    pendingIdentityVerificationId: "",
    requestedCarrier: "",
    // 연락처는 인증이 풀렸으면 다시 수정 가능해야 하므로 남겨두되 인증상태만 제거
    updatedAt: Date.now(),
  };
}

function readSignupDraft() {
  if (typeof window === "undefined") return null;

  try {
    const raw =
      safeGetStorage(window.sessionStorage, SIGNUP_DRAFT_KEY) ||
      safeGetStorage(window.localStorage, SIGNUP_DRAFT_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // 인증완료 상태는 updatedAt이 아니라 identityVerifiedAt 기준으로 만료
    if (isIdentityExpired(parsed)) {
      const expiredDraft = stripExpiredIdentityFromDraft(parsed);
      const value = JSON.stringify(expiredDraft);

      safeSetStorage(window.sessionStorage, SIGNUP_DRAFT_KEY, value);
      safeSetStorage(window.localStorage, SIGNUP_DRAFT_KEY, value);

      return expiredDraft;
    }

    return parsed;
  } catch {
    clearSignupDraft();
    return null;
  }
}

function writeSignupDraft(payload = {}) {
  if (typeof window === "undefined") return;

  try {
    const value = JSON.stringify({
      ...payload,
      updatedAt: Date.now(),
    });

    safeSetStorage(window.sessionStorage, SIGNUP_DRAFT_KEY, value);
    safeSetStorage(window.localStorage, SIGNUP_DRAFT_KEY, value);
  } catch {
    // storage 사용 불가 환경에서는 무시
  }
}

function getInitialSignupForm() {
  const draft = readSignupDraft();

  if (!draft?.form) {
    return initialForm;
  }

  return {
    ...initialForm,
    username: draft.form.username || "",
    nickname: draft.form.nickname || "",
    gender: normalizeGender(draft.form.gender || ""),
    birth: normalizeBirth(draft.form.birth || ""),
    email: draft.form.email || "",
    tel: normalizePhone(draft.form.tel || ""),
    password: "",
    passwordCheck: "",
  };
}

function getInitialIdentityData() {
  const draft = readSignupDraft();
  if (!draft?.identityVerifiedData?.verified) return null;
  return draft.identityVerifiedData;
}

function buildIdentityData(payload = {}, fallbackPhone = "") {
  if (!payload?.verified) {
    return {
      verified: false,
      message: payload?.message || "본인인증 결과가 유효하지 않습니다.",
    };
  }

  const verifiedPhone = normalizePhone(payload?.phone || fallbackPhone || "");
  const normalizedBirth = normalizeBirth(payload?.birth || "");
  const normalizedGender = normalizeGender(payload?.gender || "");

  if (!verifiedPhone) {
    return {
      verified: false,
      message: "본인인증 결과에서 연락처를 확인하지 못했습니다.",
    };
  }

  return {
    verified: true,
    provider: payload?.provider || "PORTONE",
    phone: verifiedPhone,
    name: payload?.name || "",
    birth: normalizedBirth,
    gender: normalizedGender,
    carrier: payload?.carrier || "",
    ci: payload?.ci || "",
    di: payload?.di || "",
  };
}

export default function Signup() {
  const dispatch = useDispatch();
  const router = useRouter();

  const processingIdvRef = useRef("");
  const didHydrateDraftRef = useRef(false);

  const [loading, setLoading] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [identityProcessingMessage, setIdentityProcessingMessage] = useState("");

  const [form, setForm] = useState(getInitialSignupForm);
  const [errors, setErrors] = useState({});

  const [identityVerifiedData, setIdentityVerifiedData] = useState(
    getInitialIdentityData
  );

  const [phoneVerified, setPhoneVerified] = useState(() => {
    const draft = readSignupDraft();
    return !!draft?.identityVerifiedData?.verified;
  });

  const [phoneVerifyError, setPhoneVerifyError] = useState("");

  const isPasswordMatch =
    form.password.length > 0 &&
    form.passwordCheck.length > 0 &&
    form.password === form.passwordCheck;

  const finalName = identityVerifiedData?.name || form.username;
  const finalGender = normalizeGender(identityVerifiedData?.gender || form.gender);
  const finalBirth = normalizeBirth(identityVerifiedData?.birth || form.birth);

  const canSubmit = useMemo(() => {
    return (
      !loading &&
      !phoneVerifyLoading &&
      !!finalName &&
      !!finalGender &&
      isValidBirth(finalBirth) &&
      !!form.email &&
      !!form.password &&
      !!form.passwordCheck &&
      !!form.nickname?.trim() &&
      isPasswordMatch
    );
  }, [
    loading,
    phoneVerifyLoading,
    phoneVerified,
    identityVerifiedData,
    finalName,
    finalGender,
    finalBirth,
    form,
    isPasswordMatch,
  ]);

  const persistDraft = useCallback(
    (override = {}) => {
      const currentDraft = readSignupDraft();

      const currentIdentityVerifiedAt =
        override.identityVerifiedAt !== undefined
          ? override.identityVerifiedAt
          : currentDraft?.identityVerifiedAt || 0;

      const shouldPersistVerified =
        !!identityVerifiedData?.verified &&
        !!currentIdentityVerifiedAt &&
        Date.now() - Number(currentIdentityVerifiedAt) <= SIGNUP_DRAFT_TTL_MS;

      writeSignupDraft({
        form: {
          username: form.username || "",
          nickname: form.nickname || "",
          gender: normalizeGender(form.gender || ""),
          birth: normalizeBirth(form.birth || ""),
          email: form.email || "",
          tel: normalizePhone(form.tel || ""),
        },
        phoneVerified: shouldPersistVerified ? phoneVerified : false,
        identityVerifiedData: shouldPersistVerified ? identityVerifiedData : null,
        identityVerifiedAt: shouldPersistVerified ? currentIdentityVerifiedAt : 0,
        pendingIdentityVerificationId:
          override.pendingIdentityVerificationId !== undefined
            ? override.pendingIdentityVerificationId
            : currentDraft?.pendingIdentityVerificationId || "",
        pendingIdentityStartedAt:
          override.pendingIdentityStartedAt !== undefined
            ? override.pendingIdentityStartedAt
            : currentDraft?.pendingIdentityStartedAt || 0,
        requestedPhone:
          override.requestedPhone !== undefined
            ? normalizePhone(override.requestedPhone || "")
            : normalizePhone(currentDraft?.requestedPhone || form.tel || ""),
        requestedCarrier:
          override.requestedCarrier !== undefined
            ? override.requestedCarrier || ""
            : currentDraft?.requestedCarrier || "",
        ...override,
      });
    },
    [form, phoneVerified, identityVerifiedData]
  );

  useEffect(() => {
    if (didHydrateDraftRef.current) return;

    // 휴대폰에 남아있는 v3/v4/v5 draft 강제 삭제
    clearLegacySignupDrafts();

    const draft = readSignupDraft();

    if (draft?.form) {
      setForm((prev) => ({
        ...prev,
        username: draft.form.username || prev.username,
        nickname: draft.form.nickname || prev.nickname,
        gender: normalizeGender(draft.form.gender || prev.gender),
        birth: normalizeBirth(draft.form.birth || prev.birth),
        email: draft.form.email || prev.email,
        tel: normalizePhone(draft.form.tel || prev.tel),
      }));
    }

    if (draft?.identityVerifiedData?.verified && !isIdentityExpired(draft)) {
      setIdentityVerifiedData(draft.identityVerifiedData);
      setPhoneVerified(true);
    } else {
      setIdentityVerifiedData(null);
      setPhoneVerified(false);
    }

    didHydrateDraftRef.current = true;
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const draft = readSignupDraft();

      if (!draft?.identityVerifiedData?.verified) {
        setPhoneVerified(false);
        setIdentityVerifiedData(null);
      }
    }, 10000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    persistDraft();
  }, [persistDraft]);

  const expireIdentityStateIfNeeded = useCallback(() => {
    const draft = readSignupDraft();

    if (!draft?.identityVerifiedData?.verified) {
      setPhoneVerified(false);
      setIdentityVerifiedData(null);
      setPhoneVerifyError("");

      return true;
    }

    return false;
  }, []);

  const redirectToLoginWithAlert = useCallback(
    async (message = "이미 가입된 번호입니다. 로그인해주세요.") => {
      alert(message);
      await router.replace("/login");
    },
    [router]
  );

  const failIdentityVerification = useCallback(
    (message = "본인인증이 완료되지 않았습니다. 다시 진행해주세요.") => {
      const msg =
        message || "본인인증이 완료되지 않았습니다. 다시 진행해주세요.";

      const currentDraft = readSignupDraft();
      const nextPhone = normalizePhone(
        form.tel || currentDraft?.requestedPhone || currentDraft?.form?.tel || ""
      );

      setIdentityProcessingMessage("");
      setPhoneVerified(false);
      setIdentityVerifiedData(null);
      setPhoneVerifyError(msg);

      setErrors((prev) => ({
        ...prev,
        telVerify: msg,
      }));

      clearPendingIdentityVerification();

      writeSignupDraft({
        form: {
          username: form.username || currentDraft?.form?.username || "",
          nickname: form.nickname || currentDraft?.form?.nickname || "",
          gender: normalizeGender(form.gender || currentDraft?.form?.gender || ""),
          birth: normalizeBirth(form.birth || currentDraft?.form?.birth || ""),
          email: form.email || currentDraft?.form?.email || "",
          tel: nextPhone,
        },
        phoneVerified: false,
        identityVerifiedData: null,
        identityVerifiedAt: 0,
        pendingIdentityVerificationId: "",
        pendingIdentityStartedAt: 0,
        requestedPhone: nextPhone,
        requestedCarrier: "",
      });
    },
    [form]
  );

  const applyVerifiedIdentity = useCallback(
    async (verifiedPayload, fallbackPhone = "") => {
      const nextIdentityData = buildIdentityData(verifiedPayload, fallbackPhone);

      if (!nextIdentityData?.verified) {
        const msg =
          nextIdentityData?.message || "본인인증 결과가 유효하지 않습니다.";

        failIdentityVerification(msg);
        return false;
      }

      const verifiedPhone = normalizePhone(
        nextIdentityData.phone || fallbackPhone
      );

      const alreadyJoined = await phoneDubCheck(verifiedPhone);

      if (alreadyJoined) {
        setPhoneVerified(false);
        setIdentityVerifiedData(null);

        setErrors((prev) => ({
          ...prev,
          telVerify: "이미 가입된 연락처입니다. 로그인해주세요.",
        }));

        setPhoneVerifyError("이미 가입된 연락처입니다. 로그인해주세요.");

        await redirectToLoginWithAlert(
          "이미 가입된 번호입니다.\n로그인 페이지로 이동합니다."
        );

        return false;
      }

      setPhoneVerified(true);
      setIdentityVerifiedData(nextIdentityData);
      setPhoneVerifyError("");

      setErrors((prev) => {
        const next = { ...prev };
        delete next.telVerify;
        delete next.tel;
        delete next.username;
        delete next.gender;
        delete next.birth;
        return next;
      });

      setForm((prev) => ({
        ...prev,
        username: nextIdentityData.name || prev.username,
        gender: nextIdentityData.gender || prev.gender,
        birth: nextIdentityData.birth || prev.birth,
        tel: verifiedPhone || prev.tel,
      }));

      writeSignupDraft({
        form: {
          username: nextIdentityData.name || form.username || "",
          nickname: form.nickname || "",
          gender: nextIdentityData.gender || form.gender || "",
          birth: nextIdentityData.birth || form.birth || "",
          email: form.email || "",
          tel: verifiedPhone || normalizePhone(form.tel || ""),
        },
        phoneVerified: true,
        identityVerifiedData: nextIdentityData,
        identityVerifiedAt: Date.now(),
        pendingIdentityVerificationId: "",
        requestedPhone: verifiedPhone,
        requestedCarrier: "",
      });

      return true;
    },
    [form, redirectToLoginWithAlert, failIdentityVerification]
  );

  useEffect(() => {
    if (!router.isReady) return;

    const queryIdv =
      router.query?.idv ||
      router.query?.identityVerificationId ||
      router.query?.identity_verification_id ||
      router.query?.id ||
      "";

    const identityVerificationId = Array.isArray(queryIdv)
      ? queryIdv[0]
      : String(queryIdv || "");

    if (!identityVerificationId) return;
    if (processingIdvRef.current === identityVerificationId) return;

    processingIdvRef.current = identityVerificationId;

    const draft = readSignupDraft();

    const requestedPhone = normalizePhone(
      draft?.requestedPhone || draft?.form?.tel || form.tel || ""
    );

    if (draft?.form) {
      setForm((prev) => ({
        ...prev,
        username: draft.form.username || prev.username,
        nickname: draft.form.nickname || prev.nickname,
        gender: normalizeGender(draft.form.gender || prev.gender),
        birth: normalizeBirth(draft.form.birth || prev.birth),
        email: draft.form.email || prev.email,
        tel: normalizePhone(draft.form.tel || prev.tel),
      }));
    }

    (async () => {
      try {
        setPhoneVerifyLoading(true);
        setIdentityProcessingMessage(
          "본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요."
        );
        setPhoneVerifyError("");

        const verified = await verifyIdentityResultWithServer({
          identityVerificationId,
          requestedPhone,
          requestedCarrier: draft?.requestedCarrier || "",
        });

        if (!verified?.verified) {
          const msg = verified?.message || "본인인증 검증에 실패했습니다.";

          failIdentityVerification(msg);
          return;
        }
        setIdentityProcessingMessage(
          "인증 정보를 적용하고 있어요.\n거의 완료됐어요."
        );
        const ok = await applyVerifiedIdentity(verified, requestedPhone);

        if (ok) {
          clearPendingIdentityVerification();
        }
      } catch (error) {
        console.error("[Signup] idv redirect verify error:", error);

        const msg =
          error?.message || "본인인증 결과 처리 중 오류가 발생했습니다.";

        failIdentityVerification(msg);
      } finally {
        setPhoneVerifyLoading(false);
        setIdentityProcessingMessage("");

        if (typeof window !== "undefined") {
          router.replace("/signup", undefined, { shallow: true });
        }
      }
    })();

    // form은 fallback 용도라 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query, applyVerifiedIdentity, failIdentityVerification]);

  useEffect(() => {
    if (!router.isReady) return;

    const queryIdv =
      router.query?.idv ||
      router.query?.identityVerificationId ||
      router.query?.identity_verification_id ||
      router.query?.id ||
      "";

    const identityVerificationId = Array.isArray(queryIdv)
      ? queryIdv[0]
      : String(queryIdv || "");

    // idv가 있으면 위 redirect 검증 effect가 처리함
    if (identityVerificationId) return;

    const draft = readSignupDraft();
    if (!draft?.pendingIdentityVerificationId) return;

    const startedAt = Number(
      draft?.pendingIdentityStartedAt || draft?.updatedAt || 0
    );

    // 인증창을 막 띄운 직후 같은 페이지에서 오작동하지 않도록 최소 지연
    if (startedAt && Date.now() - startedAt < 1500) return;

    if (draft?.form) {
      setForm((prev) => ({
        ...prev,
        username: draft.form.username || prev.username,
        nickname: draft.form.nickname || prev.nickname,
        gender: normalizeGender(draft.form.gender || prev.gender),
        birth: normalizeBirth(draft.form.birth || prev.birth),
        email: draft.form.email || prev.email,
        tel: normalizePhone(draft.form.tel || prev.tel),
      }));
    }

    setPhoneVerifyLoading(false);
    failIdentityVerification(
      "본인인증이 완료되지 않았습니다. 다시 진행해주세요."
    );
  }, [router.isReady, router.query, failIdentityVerification]);

  const setField = (key, value) => {
    const nextValue =
      key === "tel"
        ? normalizePhone(value)
        : key === "birth"
          ? normalizeBirth(value)
          : key === "gender"
            ? normalizeGender(value)
            : value;

    setForm((prev) => ({ ...prev, [key]: nextValue }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];

      if (key === "password" || key === "passwordCheck") {
        delete next.passwordLength;
        delete next.passwordMatch;
      }

      if (key === "tel") {
        delete next.tel;
        delete next.telVerify;
      }

      if (key === "gender") {
        delete next.gender;
      }

      if (key === "birth") {
        delete next.birth;
      }

      return next;
    });

    if (key === "tel") {
      setPhoneVerified(false);
      setPhoneVerifyError("");
      setIdentityVerifiedData(null);

      const nextForm = {
        ...form,
        tel: nextValue,
      };

      writeSignupDraft({
        form: {
          username: nextForm.username || "",
          nickname: nextForm.nickname || "",
          gender: normalizeGender(nextForm.gender || ""),
          birth: normalizeBirth(nextForm.birth || ""),
          email: nextForm.email || "",
          tel: normalizePhone(nextValue || ""),
        },
        phoneVerified: false,
        identityVerifiedData: null,
        pendingIdentityVerificationId: "",
        requestedPhone: normalizePhone(nextValue || ""),
        requestedCarrier: "",
      });
    }
  };

  const validateForm = useCallback(() => {
    const nextErrors = {};

    const submitName = identityVerifiedData?.name || form.username;
    const submitGender = normalizeGender(identityVerifiedData?.gender || form.gender);
    const submitBirth = normalizeBirth(identityVerifiedData?.birth || form.birth);

    if (!submitName) nextErrors.username = "이름을 입력해주세요.";

    if (!submitGender) {
      nextErrors.gender = "성별 정보를 확인해주세요.";
    }

    if (!submitBirth) {
      nextErrors.birth = "생년월일을 입력해주세요.";
    } else if (!isValidBirth(submitBirth)) {
      nextErrors.birth = "생년월일 8자리를 정확히 입력해주세요.";
    }

    if (!form.email) nextErrors.email = "이메일을 입력해주세요.";
    else if (!email_check(form.email)) {
      nextErrors.email = "이메일 형식이 올바르지 않습니다.";
    }

    // 본인인증은 가입 후에도 진행할 수 있으므로 가입 단계에서는 필수로 막지 않습니다.

    if (!form.password || form.password.length < 8) {
      nextErrors.passwordLength = "비밀번호를 8자 이상 입력해주세요.";
    }

    if (form.password !== form.passwordCheck) {
      nextErrors.passwordMatch = "비밀번호가 일치하지 않습니다.";
    }

    if (!form.nickname?.trim()) {
      nextErrors.nickname = "닉네임을 입력해주세요.";
    } else if (form.nickname.trim().length > 10) {
      nextErrors.nickname = "닉네임은 10자 이내로 입력해주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form, phoneVerified, identityVerifiedData]);

  const handlePhoneVerify = async () => {
    setPhoneVerifyError("");

    const enteredPhone = normalizePhone(form.tel);

    if (!form.username?.trim()) {
      setErrors((prev) => ({
        ...prev,
        username: "이름을 먼저 입력해주세요.",
      }));
      return;
    }

    if (!enteredPhone) {
      setErrors((prev) => ({
        ...prev,
        tel: "연락처를 먼저 입력해주세요.",
      }));
      return;
    }

    try {
      setPhoneVerifyLoading(true);
      setIdentityProcessingMessage("본인인증 창을 준비하고 있어요.");

      const alreadyJoinedBeforeVerify = await phoneDubCheck(enteredPhone);
      if (alreadyJoinedBeforeVerify) {
        setPhoneVerified(false);
        setIdentityVerifiedData(null);

        setErrors((prev) => ({
          ...prev,
          telVerify: "이미 가입된 연락처입니다. 로그인해주세요.",
        }));

        setPhoneVerifyError("이미 가입된 연락처입니다. 로그인해주세요.");

        await redirectToLoginWithAlert(
          "이미 가입된 번호입니다.\n로그인 페이지로 이동합니다."
        );
        return;
      }

      const identityVerificationId = createIdentityVerificationId("signup");

      const redirectUrl = `${window.location.origin}/signup?idv=${encodeURIComponent(
        identityVerificationId
      )}`;

      const draftPayload = {
        form: {
          username: form.username || "",
          nickname: form.nickname || "",
          gender: normalizeGender(form.gender || ""),
          birth: normalizeBirth(form.birth || ""),
          email: form.email || "",
          tel: enteredPhone,
        },
        phoneVerified: false,
        identityVerifiedData: null,
        pendingIdentityVerificationId: identityVerificationId,
        pendingIdentityStartedAt: Date.now(),
        requestedPhone: enteredPhone,
        requestedCarrier: "",
      };

      writeSignupDraft(draftPayload);

      prepareIdentityVerificationPending({
        source: "signup",
        returnUrl: redirectUrl,
        requestedPhone: enteredPhone,
        requestedCarrier: "",
        identityVerificationId,
      });

      setIdentityProcessingMessage(
        "본인인증을 진행 중이에요.\n인증창을 닫지 말고 기다려주세요."
      );

      const sdkResult = await requestPortoneIdentityVerification({
        phone: enteredPhone,
        name: form.username,
        source: "signup",
        identityVerificationId,
        redirectUrl,
        timeoutMs: 30000,
      });

      if (!sdkResult?.ok) {
        const msg =
          sdkResult?.message ||
          "본인인증이 완료되지 않았습니다. 다시 진행해주세요.";

        failIdentityVerification(msg);
        return;
      }
      setIdentityProcessingMessage(
        "본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요."
      );
      const verified = await verifyIdentityResultWithServer({
        identityVerificationId:
          sdkResult.identityVerificationId || identityVerificationId,
        requestedPhone: enteredPhone,
      });

      if (!verified?.verified) {
        const msg = verified?.message || "본인인증 검증에 실패했습니다.";

        failIdentityVerification(msg);
        return;
      }
      setIdentityProcessingMessage(
        "인증 정보를 적용하고 있어요.\n거의 완료됐어요."
      );
      const ok = await applyVerifiedIdentity(verified, enteredPhone);

      if (ok) {
        clearPendingIdentityVerification();
      }
    } catch (e) {
      console.error("handlePhoneVerify error:", e);

      const msg = e?.message || "본인인증 중 오류가 발생했습니다.";

      failIdentityVerification(msg);
    } finally {
      setPhoneVerifyLoading(false);
      setIdentityProcessingMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const hasVerifiedIdentity = !!identityVerifiedData?.verified;
      const submitPhone = hasVerifiedIdentity
        ? normalizePhone(identityVerifiedData?.phone || form.tel || "")
        : "";
      const submitGender = normalizeGender(identityVerifiedData?.gender || form.gender);
      const submitName = identityVerifiedData?.name || form.username;
      const submitBirth = normalizeBirth(identityVerifiedData?.birth || form.birth);

      if (hasVerifiedIdentity && submitPhone) {
        const phoneDup = await phoneDubCheck(submitPhone);

        if (phoneDup) {
          setPhoneVerified(false);
          setIdentityVerifiedData(null);

          setErrors((prev) => ({
            ...prev,
            telVerify: "이미 가입된 연락처입니다. 로그인해주세요.",
          }));

          await redirectToLoginWithAlert(
            "이미 가입된 번호입니다.\n로그인 페이지로 이동합니다."
          );
          return;
        }
      }

      const nicknameToUse = form.nickname?.trim();
      const birthdayObject = buildBirthdayObjectFromBirth(submitBirth);

      if (!birthdayObject) {
        setErrors((prev) => ({
          ...prev,
          birth: "생년월일 8자리를 정확히 입력해주세요.",
        }));
        return;
      }

      const res = await createAccount(
        form.email,
        form.password,
        submitGender,
        submitName,
        nicknameToUse,
        birthdayObject,
        submitPhone
      );

      if (!res?.uid) {
        alert("회원가입 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
        return;
      }

      if (hasVerifiedIdentity) {
        await saveIdentityVerificationToUser(res.uid, {
          provider: identityVerifiedData?.provider || "PORTONE",
          phone: submitPhone,
          name: identityVerifiedData?.name || "",
          birth: identityVerifiedData?.birth || "",
          gender: identityVerifiedData?.gender || "",
          carrier: identityVerifiedData?.carrier || "",
          ci: identityVerifiedData?.ci || "",
          di: identityVerifiedData?.di || "",
          fallbackName: identityVerifiedData?.name ? "" : submitName,
          fallbackBirth: identityVerifiedData?.birth ? "" : submitBirth,
          fallbackGender: identityVerifiedData?.gender ? "" : submitGender,
        });
      }

      dispatch(
        signUp({
          email: form.email,
          username: submitName,
          nickname: nicknameToUse,
          gender: submitGender,
          birth: submitBirth,
          tel: submitPhone,
          id: res.uid,
          userID: res.uid,
          avatar: res.photoURL || "",
          date_profile_finished: false,
          phone_verified: hasVerifiedIdentity,
          identityVerified: hasVerifiedIdentity,
          identity_provider: hasVerifiedIdentity ? identityVerifiedData?.provider || "PORTONE" : "",
          identity_di: hasVerifiedIdentity ? identityVerifiedData?.di || "" : "",
          identity_ci: hasVerifiedIdentity ? identityVerifiedData?.ci || "" : "",
          identity_birth: hasVerifiedIdentity ? identityVerifiedData?.birth || "" : "",
        })
      );

      if (submitPhone) {
        sendLms(
          submitPhone,
          [
            "[차밍수프]",
            `${submitName}님, 가입이 완료됐어요.`,
            "프로필을 보완하면 검토 후 매칭 이용이 가능해요.",
            "사진/기본정보/성향을 이어서 입력해주세요.",
            "https://charmingsoup.com/profile/setup",
          ].join("\n"),
          "차밍수프 가입 완료",
          { forceLms: true }
        ).catch((smsErr) => {
          console.error("sendLms error:", smsErr);
        });
      }

      clearSignupDraft();
      clearPendingIdentityVerification();

      if (typeof window !== "undefined") {
        sessionStorage.setItem("signupJustCompleted", "1");
      }

      router.replace("/welcome");
      return;
    } catch (err) {
      console.error("[signup] handleSubmit error:", err);

      const message = err?.message || "";

      if (
        message.includes("이미 등록된 이메일입니다") ||
        err?.code === "auth/email-already-in-use"
      ) {
        setErrors((prev) => ({
          ...prev,
          email: "이미 등록된 이메일입니다.",
        }));
        return;
      }

      alert(`회원가입 중 오류가 발생했습니다.\n${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-[100dvh] overflow-hidden bg-white md:bg-[#f6f7fb]">
      <div className="relative h-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/40 blur-3xl" />
          <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex h-full w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section
            className="
              h-full w-full max-w-[420px] overflow-hidden bg-white
              md:h-[720px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80
              md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]
            "
          >
            <SignupFormCard
              form={form}
              errors={errors}
              loading={loading}
              canSubmit={canSubmit}
              phoneVerified={phoneVerified}
              phoneVerifyLoading={phoneVerifyLoading}
              phoneVerifyError={phoneVerifyError}
              identityProcessingMessage={identityProcessingMessage}
              identityVerifiedData={identityVerifiedData}
              isPasswordMatch={isPasswordMatch}
              onFieldChange={setField}
              onPhoneVerify={handlePhoneVerify}
              onSkipIdentity={() => {
                setPhoneVerifyError("");
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.tel;
                  delete next.telVerify;
                  return next;
                });
              }}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
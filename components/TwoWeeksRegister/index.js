import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { signInAnonymously } from "firebase/auth";
import { auth } from "firebaseConfig";
import RegisterLayout from "./RegisterLayout";
import DashboardConfirmModal from "./DashboardConfirmModal";
import ConversationalRegisterFlow, { REGISTER_SCREENS } from "./ConversationalRegisterFlow";
import { INITIAL_FORM, TWOWEEKS_COMPLETE_PATH, TWOWEEKS_DASHBOARD_PATH } from "./constants";
import { focusFirstError, formatPhone, normalizePhone, validateStep1, validateStep2, validateStep3 } from "./helpers";
import { createTwoWeeksApplication, checkExistingTwoWeeksApplication, isTwoWeeksReverificationError } from "./twoweeksApplicationService";
import { buildTwoWeeksTestIdentityData, isTwoWeeksTestPhone } from "../TwoWeeksShared/testAuth";
import { requestPortoneIdentityVerification } from "lib/portoneIdentity";
import {
  clearPendingIdentityVerification,
  createIdentityVerificationId,
  prepareIdentityVerificationPending,
  verifyIdentityResultWithServer,
} from "lib/identityVerificationClient";
import {
  birthYearFromIdentityBirth,
  buildIdentityData,
  clearTwoWeeksDraft,
  normalizeGender,
  readTwoWeeksDraft,
  TWOWEEKS_IDENTITY_SOURCE,
  writeTwoWeeksDraft,
} from "./identityVerification";
import { trackTwoWeeksEvent } from "lib/gtag";
import { getRegistrationAttribution, captureTwoWeeksInvite, clearTwoWeeksInvite } from "lib/twoWeeksAttribution";

const SCREEN_FIELDS = {
  identity: ["phone", "phoneVerify"],
  basic: ["name", "gender", "birthYear", "height", "maritalStatus"],
  profile: ["representativePhoto", "additionalPhotos"],
  introduction: ["nickname", "introduction"],
  job: ["jobCategory", "companyScale"],
  jobProof: ["organizationName", "verificationDocument"],
  education: ["educationLevel", "schoolName"],
  meeting: ["activityAreas", "preferredArea"],
  availability: ["availableTimeSlots"],
  marriage: ["marriagePlan"], children: ["childrenPlan"],
  smoking: ["smoking"], religion: ["religion"],
  drinking: ["drinkingFrequency"], consent: ["consents"],
};

const SCREEN_EVENTS = {
  welcome: "signup_started", meeting: "region_completed", profile: "photo_completed",
  jobProof: "job_completed", drinking: "values_completed", preference: "preference_completed",
};

// 기존 임시저장본은 숫자 단계만 가지고 있다. 화면 추가 후에도 단계가 어긋나지 않도록 변환한다.
const LEGACY_REGISTER_SCREENS = [
  "welcome", "identity", "basic", "profile", "job", "education", "meeting", "midpoint",
  "marriage", "children", "smoking", "religion", "drinking", "traits", "preference",
  "source", "consent", "review",
];

function getSignupEventContext(form = {}) {
  const attribution = getRegistrationAttribution();
  return {
    gender: form.gender || "unknown",
    source: attribution.lastSource || attribution.firstSource || "direct",
    campaign: attribution.lastCampaign || attribution.firstCampaign || "",
    has_referrer: form.hasReferrer === true,
  };
}

function SubmitOverlay({ visible, progress, message, tone = "loading", onDismiss }) {
  if (!visible) return null;

  const isError = tone === "error";
  const isSuccess = tone === "success";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-[14px] border border-[#e0e6ed] bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,42,67,0.18)]">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black ${
            isError ? "bg-red-50 text-red-500" : isSuccess ? "bg-emerald-50 text-emerald-500" : "bg-[#edf4ff] text-white"
          }`}
        >
          {isError ? "!" : isSuccess ? "✓" : (
            <img src="/logo/2weeks_logo.png" alt="투윅스 로고" className="tw-submit-pulse h-14 w-14 object-contain" draggable={false} />
          )}
        </div>

        <div className="mt-5 whitespace-pre-line text-lg font-black tracking-[-0.03em] text-slate-950">{message || "업로드 중입니다."}</div>

        {!isError ? (
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-[#2468d2] transition-all duration-500 ease-out" style={{ width: `${Math.max(0, Math.min(progress || 0, 100))}%` }} />
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-500">{progress || 0}%</div>
          </div>
        ) : null}

        {isError ? (
          <button type="button" onClick={onDismiss} className="mt-6 h-12 w-full rounded-[10px] bg-[#1769d2] text-sm font-bold text-white">
            닫고 다시 시도하기
          </button>
        ) : isSuccess ? null : (
          <p className="mt-4 break-keep text-xs leading-6 text-slate-500">
            {progress >= 85 ? "신청서를 확인하고 있어요. 잠시만 기다려주세요." : "사진과 인증 자료를 안전하게 저장하고 있어요."}
          </p>
        )}
        <style jsx>{`
          .tw-submit-pulse { animation: tw-logo-breathe 1.9s ease-in-out infinite; }
          @keyframes tw-logo-breathe { 0%,100%{transform:scale(0.94);opacity:0.84} 50%{transform:scale(1.12);opacity:1} }
          @media (prefers-reduced-motion:reduce) { .tw-submit-pulse{animation:none} }
        `}</style>
      </div>
    </div>
  );
}

function IdentityProcessingOverlay({ message }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-[14px] border border-[#e0e6ed] bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,42,67,0.18)]">
        <div className="mx-auto flex h-[76px] w-[76px] items-center justify-center rounded-[20px] bg-[#f0f5ff]">
          <img src="/logo/2weeks_logo.png" alt="투윅스" draggable={false}
            className="tw-idv-logo h-14 w-14 object-contain" />
        </div>
        <div className="mt-5 whitespace-pre-line text-lg font-black tracking-[-0.03em] text-slate-950">
          {message}
        </div>
        <div className="mx-auto mt-4 h-1 w-24 overflow-hidden rounded-full bg-[#e3ecfc]">
          <span className="tw-idv-progress block h-full w-[40%] rounded-full bg-[#3268d9]" />
        </div>
        <style jsx>{`
          .tw-idv-logo{animation:tw-idv-pulse 2s ease-in-out infinite}
          .tw-idv-progress{animation:tw-idv-slide 1.8s ease-in-out infinite alternate}
          @keyframes tw-idv-pulse{0%,100%{transform:scale(.94);opacity:.86}50%{transform:scale(1.07);opacity:1}}
          @keyframes tw-idv-slide{0%{transform:translateX(0)}100%{transform:translateX(150%)}}
          @media(prefers-reduced-motion:reduce){.tw-idv-logo,.tw-idv-progress{animation:none}}
        `}</style>
      </div>
    </div>
  );
}

function mergeDraftForm(draftForm = {}, currentForm = INITIAL_FORM) {
  // 이전 버전에서 아직 선택하지 않은 지역·시간은 새 기본값(전체 선택)으로 보완.
  // 최신 버전에서 사용자가 일부 또는 전부 해제한 선택은 그대로 보존합니다.
  const oldDraft = !draftForm.selectionDefaultsVersion;
  const activityAreas = Array.isArray(draftForm.activityAreas) && (draftForm.activityAreas.length || !oldDraft)
    ? draftForm.activityAreas : [...currentForm.activityAreas];
  const availableTimeSlots = Array.isArray(draftForm.availableTimeSlots) && (draftForm.availableTimeSlots.length || !oldDraft)
    ? draftForm.availableTimeSlots : [...currentForm.availableTimeSlots];
  const preferredArea = activityAreas.includes(draftForm.preferredArea) ? draftForm.preferredArea
    : activityAreas.includes(currentForm.preferredArea) ? currentForm.preferredArea : (activityAreas[0] || "");
  return {
    ...currentForm,
    ...draftForm,
    selectionDefaultsVersion: 1,
    activityAreas,
    availableTimeSlots,
    preferredArea,
    representativePhoto: currentForm.representativePhoto,
    additionalPhotos: currentForm.additionalPhotos,
    verificationDocument: currentForm.verificationDocument,
    consents: {
      ...currentForm.consents,
      ...(draftForm.consents || {}),
    },
  };
}

async function ensureIdentityAuth() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export default function TwoWeeksRegister() {
  const router = useRouter();
  const processingIdvRef = useRef("");
  const trackedStepsRef = useRef(new Set());
  const submitLockRef = useRef(false);
  const resumeAfterReverifyRef = useRef(false);
  // SSR과 브라우저의 첫 렌더링은 반드시 동일해야 한다.
  // 로컬 저장 임시작성본은 hydration 이후에만 복원한다.
  const [screenIndex, setScreenIndex] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [draftReady, setDraftReady] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitTone, setSubmitTone] = useState("loading");
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const [identityError, setIdentityError] = useState("");
  const [existingApplicationNotice, setExistingApplicationNotice] = useState(false);
  // 동일인(CI)으로 차단된 경우와 휴대폰 번호 중복을 구분해 잘못된 조회 안내를 막습니다.
  const getExistingApplicationReason = (message = "") => /본인인증 정보|동일한 본인|동일인|연락처가 변경/.test(String(message)) ? "identity" : "phone";
  const [dashboardPromptOpen, setDashboardPromptOpen] = useState(false);

  const screen = REGISTER_SCREENS[screenIndex] || "welcome";

  useEffect(() => {
    if (router.isReady) captureTwoWeeksInvite(window.location.search);
  }, [router.isReady]);

  useEffect(() => {
    const draft = readTwoWeeksDraft();
    if (draft?.form) {
      setForm(mergeDraftForm(draft.form, INITIAL_FORM));
      const saved = Number(draft.screenIndex || 0);
      const savedScreen = REGISTER_SCREENS.includes(draft.screenName)
        ? draft.screenName
        : (Number.isInteger(saved) ? LEGACY_REGISTER_SCREENS[saved] : null);
      const savedIndex = REGISTER_SCREENS.indexOf(savedScreen);
      if (savedIndex >= 0) {
        const identityIndex = REGISTER_SCREENS.indexOf("identity");
        const profileIndex = REGISTER_SCREENS.indexOf("profile");
        const verified = draft.form.identityVerifiedData?.verified === true;
        // 업로드 File 객체는 저장할 수 없으므로 사진 단계부터 재입력하도록 안내한다.
        setScreenIndex(savedIndex > identityIndex && !verified ? identityIndex : Math.min(savedIndex, profileIndex));
      }
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || trackedStepsRef.current.has(screen)) return;
    trackedStepsRef.current.add(screen);
    trackTwoWeeksEvent("twoweeks_register_step_view", {
      step: screenIndex + 1,
      step_name: screen,
      ...getSignupEventContext(form),
    });
  }, [draftReady, screen, screenIndex, form.gender]);

  useEffect(() => {
    // 복원이 끝나기 전에 최초의 빈 폼으로 기존 임시작성본을 덮어쓰지 않는다.
    if (!draftReady) return;
    const timer = setTimeout(() => writeTwoWeeksDraft({ form, screenIndex, screenName: screen }), 250);
    return () => clearTimeout(timer);
  }, [draftReady, form, screenIndex]);

  useEffect(() => {
    if (!draftReady || !router.isReady) return;
    const value = Array.isArray(router.query?.stage) ? router.query.stage[0] : router.query?.stage;
    const requestedIndex = REGISTER_SCREENS.indexOf(String(value || ""));
    if (requestedIndex < 0) return;
    const identityIndex = REGISTER_SCREENS.indexOf("identity");
    // URL만 조작해 본인인증 단계를 건너뛰지 않도록 한다.
    const profileIndex = REGISTER_SCREENS.indexOf("profile");
    const verified = form.identityVerifiedData?.verified === true;
    // URL의 stage는 임시작성본 복원을 앞지를 수 없다. 사진·인증자료는 새로고침 후 재첨부해야 한다.
    const safeIndex = requestedIndex > identityIndex && !verified
      ? identityIndex
      : Math.min(requestedIndex, profileIndex);
    setScreenIndex((prev) => prev === safeIndex ? prev : safeIndex);
    // 최초 진입 시에만 쿼리 단계 동기화. 단계 전환은 goNext/goBack에서 처리한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady, router.isReady]);

  const openIdentityReverification = (message) => {
    // 임시로 입력한 프로필/사진 File 객체는 동일 탭에서 유지합니다.
    // 인증 결과만 무효화하고 신규 신청서 저장은 다시 인증을 통과해야만 진행합니다.
    const identityIndex = REGISTER_SCREENS.indexOf("identity");
    resumeAfterReverifyRef.current = true;
    setForm((prev) => ({
      ...prev,
      phoneVerified: false,
      phoneVerificationSkipped: false,
      identityVerifiedData: null,
    }));
    setIdentityError("");
    setExistingApplicationNotice(false);
    setErrors({});
    setScreenIndex(identityIndex);
    setSubmitTone("loading");
    setSubmitMessage("");
    setUploadProgress(0);
    setSubmitting(false);
    submitLockRef.current = false;
    if (router.isReady) {
      router.replace({ pathname: "/2weeks/register", query: { stage: "identity" } }, undefined,
        { shallow: true, scroll: false }).catch(() => {});
    }
    // 안내는 브라우저 alert가 아닌 본인인증 단계의 짧은 안내로 보여줍니다.
    setIdentityError(message || "본인인증 시간이 지나 다시 인증해야 해요. 작성한 내용은 유지했어요.");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resumeAfterReverification = () => {
    if (!resumeAfterReverifyRef.current) return;
    resumeAfterReverifyRef.current = false;
    // PortOne 모바일 리디렉션으로 페이지가 새로 열렸다면 File 객체는 복원되지 않습니다.
    // 그런 경우엔 사진부터 재첨부하게 하고, 기존 텍스트 작성값은 유지합니다.
    const hasFiles = Boolean(form.representativePhoto) &&
      (form.additionalPhotos || []).filter(Boolean).length >= 2 && Boolean(form.verificationDocument);
    const target = hasFiles ? "review" : "profile";
    setScreenIndex(REGISTER_SCREENS.indexOf(target));
    if (router.isReady) {
      router.replace({ pathname: "/2weeks/register", query: { stage: target } }, undefined,
        { shallow: true, scroll: false }).catch(() => {});
    }
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleErrors = (nextErrors) => {
    setErrors(nextErrors);
    focusFirstError();
  };

  const applyVerifiedIdentity = useCallback((verifiedPayload, fallbackPhone = "") => {
    const nextIdentityData = buildIdentityData(verifiedPayload, fallbackPhone);

    if (!nextIdentityData?.verified) {
      const message = nextIdentityData?.message || "본인인증 결과가 유효하지 않습니다.";
      setIdentityError(message);
      setErrors((prev) => ({ ...prev, phoneVerify: message }));
      return false;
    }

    const verifiedPhone = normalizePhone(nextIdentityData.phone || fallbackPhone || "");
    const verifiedGender = normalizeGender(nextIdentityData.gender || "");
    const verifiedBirthYear = birthYearFromIdentityBirth(nextIdentityData.birth || "");

    setForm((prev) => ({
      ...prev,
      name: nextIdentityData.name || prev.name,
      gender: verifiedGender || prev.gender,
      birthYear: verifiedBirthYear || prev.birthYear,
      phone: verifiedPhone ? formatPhone(verifiedPhone) : prev.phone,
      phoneVerified: true,
      phoneVerificationSkipped: false,
      identityVerifiedData: nextIdentityData,
    }));

    setIdentityError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.phoneVerify;
      delete next.phone;
      delete next.name;
      delete next.gender;
      delete next.birthYear;
      return next;
    });

    trackTwoWeeksEvent("twoweeks_identity_verified", {
      verification_type: isTwoWeeksTestPhone(verifiedPhone) ? "test" : "portone",
    });
    trackTwoWeeksEvent("identity_verified", {
      gender: verifiedGender || "unknown",
      verification_type: isTwoWeeksTestPhone(verifiedPhone) ? "test" : "portone",
    });

    return true;
  }, []);

  const handleIdentityVerify = useCallback(async () => {
    const enteredPhone = normalizePhone(form.phone);

    if (enteredPhone.length < 10 || enteredPhone.length > 11) {
      handleErrors({ phone: "휴대폰 번호를 정확히 입력해주세요." });
      return;
    }

    try {
      setExistingApplicationNotice(false);
      await ensureIdentityAuth();
    } catch (error) {
      console.error("[TwoWeeksRegister] anonymous auth error:", error);
      handleErrors({ phoneVerify: "본인인증을 준비하지 못했습니다. 잠시 후 다시 시도해주세요." });
      return;
    }

    if (isTwoWeeksTestPhone(enteredPhone)) {
      try {
        setIdentityLoading(true);
        setIdentityError("");
        setIdentityMessage("인증 정보를 적용하고 있어요.");

        const testIdentity = {
          ...buildTwoWeeksTestIdentityData({
            phone: enteredPhone,
            name: form.name || "테스트회원",
            gender: form.gender,
            birthYear: form.birthYear,
          }),
          identityVerificationId: `test_${enteredPhone}`,
        };

        const ok = applyVerifiedIdentity(testIdentity, enteredPhone);

        if (ok) {
          resumeAfterReverification();
          clearPendingIdentityVerification();
          writeTwoWeeksDraft({
            form: {
              ...form,
              phoneVerified: true,
              phoneVerificationSkipped: false,
              identityVerifiedData: testIdentity,
            },
            identityVerifiedData: testIdentity,
            screenIndex,
            screenName: screen,
          });
        }
      } catch (error) {
        const message = error?.message || "인증 처리 중 오류가 발생했습니다.";
        setIdentityError(message);
        setErrors((prev) => ({ ...prev, phoneVerify: message }));
      } finally {
        setIdentityLoading(false);
        setIdentityMessage("");
      }

      return;
    }

    try {
      setIdentityLoading(true);
      setIdentityError("");
      setIdentityMessage("본인인증 창을 준비하고 있어요.");

      const identityVerificationId = createIdentityVerificationId("twoweeks");
      const redirectUrl = `${window.location.origin}/2weeks/register?idv=${encodeURIComponent(identityVerificationId)}`;

      writeTwoWeeksDraft({
        form,
        screenIndex,
        screenName: screen,
        pendingIdentityVerificationId: identityVerificationId,
        pendingIdentityStartedAt: Date.now(),
        resumeAfterReverify: resumeAfterReverifyRef.current,
        requestedPhone: enteredPhone,
      });

      prepareIdentityVerificationPending({
        source: TWOWEEKS_IDENTITY_SOURCE,
        returnUrl: redirectUrl,
        requestedPhone: enteredPhone,
        requestedCarrier: "",
        identityVerificationId,
      });

      setIdentityMessage("본인인증을 진행 중이에요.\n인증창을 닫지 말고 기다려주세요.");

      const sdkResult = await requestPortoneIdentityVerification({
        phone: enteredPhone,
        source: TWOWEEKS_IDENTITY_SOURCE,
        identityVerificationId,
        redirectUrl,
        timeoutMs: 30000,
      });

      if (!sdkResult?.ok) {
        const message = sdkResult?.message || "본인인증이 완료되지 않았습니다. 다시 진행해주세요.";
        setIdentityError(message);
        setErrors((prev) => ({ ...prev, phoneVerify: message }));
        clearPendingIdentityVerification();
        return;
      }

      setIdentityMessage("본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요.");

      const verifiedId = sdkResult.identityVerificationId || identityVerificationId;
      const verified = await verifyIdentityResultWithServer({
        identityVerificationId: verifiedId,
        requestedPhone: enteredPhone,
        source: TWOWEEKS_IDENTITY_SOURCE,
      });

      if (verified?.existingApplication) {
        setExistingApplicationNotice("phone");
        setIdentityError("");
        setErrors((prev) => {
          const next = { ...prev };
          delete next.phoneVerify;
          delete next.phone;
          return next;
        });
        clearPendingIdentityVerification();
        return;
      }

      if (!verified?.verified) {
        const message = verified?.message || "본인인증 검증에 실패했습니다.";
        setIdentityError(message);
        setErrors((prev) => ({ ...prev, phoneVerify: message }));
        clearPendingIdentityVerification();
        return;
      }

      setIdentityMessage("인증 정보를 적용하고 있어요.\n거의 완료됐어요.");
      const ok = applyVerifiedIdentity(
        { ...verified, identityVerificationId: verifiedId },
        enteredPhone
      );

      if (ok) {
        clearPendingIdentityVerification();
        writeTwoWeeksDraft({
          form: {
            ...form,
            phoneVerified: true,
            phoneVerificationSkipped: false,
            identityVerifiedData: { ...verified, identityVerificationId: verifiedId },
          },
          identityVerifiedData: verified,
          screenIndex,
          screenName: screen,
        });
        const existingCheck = await checkExistingTwoWeeksApplication({ verifiedIdentity: { ...verified, identityVerificationId: verifiedId }, phone: enteredPhone });
        if (existingCheck.existing) {
          setExistingApplicationNotice(existingCheck.reason || "phone");
        } else {
          resumeAfterReverification();
        }
      }
    } catch (error) {
      const code = String(error?.code || "").toLowerCase();
      const message = String(error?.message || "").replace(/^FirebaseError:\s*/i, "").trim();
      const existing = code.includes("already-exists") || message.includes("이미 가입") || message.includes("기존 신청") || message.includes("등록된 신청");

      if (existing) {
        setScreenIndex(REGISTER_SCREENS.indexOf("identity"));
        setExistingApplicationNotice(getExistingApplicationReason(message));
        setIdentityError("");
        setErrors((prev) => {
          const next = { ...prev };
          delete next.phoneVerify;
          return next;
        });
      } else {
        console.error("[TwoWeeksRegister] identity verify error:", error);
        setIdentityError(message || "본인인증 중 오류가 발생했습니다.");
        setErrors((prev) => ({ ...prev, phoneVerify: message || "본인인증 중 오류가 발생했습니다." }));
      }
      clearPendingIdentityVerification();
    } finally {
      setIdentityLoading(false);
      setIdentityMessage("");
    }
  }, [applyVerifiedIdentity, form, router, screenIndex]);

  useEffect(() => {
    if (!draftReady || !router.isReady) return;

    const queryIdv = router.query?.idv || router.query?.identityVerificationId || router.query?.identity_verification_id || router.query?.id || "";
    const identityVerificationId = Array.isArray(queryIdv) ? queryIdv[0] : String(queryIdv || "");

    if (!identityVerificationId) return;
    if (processingIdvRef.current === identityVerificationId) return;

    processingIdvRef.current = identityVerificationId;

    const draft = readTwoWeeksDraft();
    const requestedPhone = normalizePhone(draft?.requestedPhone || draft?.form?.phone || form.phone || "");

    if (draft?.form) {
      setForm((prev) => mergeDraftForm(draft.form, prev));
    }

    (async () => {
      let redirectedToDashboard = false;
      try {
        setIdentityLoading(true);
        setIdentityMessage("본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요.");
        setIdentityError("");

        await ensureIdentityAuth();
        const verified = await verifyIdentityResultWithServer({
          identityVerificationId,
          requestedPhone,
          source: TWOWEEKS_IDENTITY_SOURCE,
        });

        if (verified?.existingApplication) {
          setExistingApplicationNotice("phone");
          setIdentityError("");
          setErrors((prev) => {
            const next = { ...prev };
            delete next.phoneVerify;
            delete next.phone;
            return next;
          });
          clearPendingIdentityVerification();
          return;
        }

        if (!verified?.verified) {
          const message = verified?.message || "본인인증 검증에 실패했습니다.";
          setIdentityError(message);
          setErrors((prev) => ({ ...prev, phoneVerify: message }));
          clearPendingIdentityVerification();
          return;
        }

        setIdentityMessage("인증 정보를 적용하고 있어요.\n거의 완료됐어요.");
        const ok = applyVerifiedIdentity(
          { ...verified, identityVerificationId },
          requestedPhone
        );

        if (ok) {
          clearPendingIdentityVerification();
          const existingCheck = await checkExistingTwoWeeksApplication({ verifiedIdentity: { ...verified, identityVerificationId }, phone: requestedPhone });
          if (existingCheck.existing) {
            setScreenIndex(REGISTER_SCREENS.indexOf("identity"));
            setExistingApplicationNotice(existingCheck.reason || "phone");
            return;
          }
          // 재인증 중 PortOne이 페이지를 다시 연 경우 이미지 File은 저장소에서 복원 불가합니다.
          // 최초 인증에서는 기존 진행 흐름을 유지합니다.
          if (draft?.resumeAfterReverify === true) {
            setScreenIndex(REGISTER_SCREENS.indexOf("profile"));
          }
        }
      } catch (error) {
        const code = String(error?.code || "").toLowerCase();
        const message = String(error?.message || "").replace(/^FirebaseError:\s*/i, "").trim();
        const existing = code.includes("already-exists") || message.includes("이미 가입") || message.includes("기존 신청") || message.includes("등록된 신청");

        if (existing) {
          setScreenIndex(REGISTER_SCREENS.indexOf("identity"));
          setExistingApplicationNotice(getExistingApplicationReason(message));
          setIdentityError("");
          setErrors((prev) => {
            const next = { ...prev };
            delete next.phoneVerify;
            return next;
          });
        } else {
          console.error("[TwoWeeksRegister] idv redirect verify error:", error);
          setIdentityError(message || "본인인증 결과 처리 중 오류가 발생했습니다.");
          setErrors((prev) => ({ ...prev, phoneVerify: message || "본인인증 결과 처리 중 오류가 발생했습니다." }));
        }
      } finally {
        setIdentityLoading(false);
        setIdentityMessage("");
        if (!redirectedToDashboard) {
          router.replace("/2weeks/register", undefined, { shallow: true });
        }
      }
    })();
    // form은 fallback 용도라 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady, router.isReady, router.query, applyVerifiedIdentity]);

  const resetExistingApplicationNotice = () => {
    setExistingApplicationNotice(false);
    setIdentityError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.phone;
      delete next.phoneVerify;
      return next;
    });
    setForm((prev) => ({
      ...prev,
      phone: "",
      phoneVerified: false,
      phoneVerificationSkipped: false,
      identityVerifiedData: null,
    }));
  };

  const goNext = () => {
    const allErrors = { ...validateStep1(form), ...validateStep2(form), ...validateStep3(form) };
    const nextErrors = (SCREEN_FIELDS[screen] || []).reduce((result, key) => {
      if (allErrors[key]) result[key] = allErrors[key];
      return result;
    }, {});

    if (Object.keys(nextErrors).length) {
      handleErrors(nextErrors);
      return;
    }

    if (SCREEN_EVENTS[screen]) {
      trackTwoWeeksEvent(SCREEN_EVENTS[screen], { ...getSignupEventContext(form), stage: screen });
    }
    if (screen === "availability") {
      trackTwoWeeksEvent("schedule_completed", { ...getSignupEventContext(form), stage: screen });
    }
    const nextIndex = Math.min(screenIndex + 1, REGISTER_SCREENS.length - 1);
    setErrors({});
    setScreenIndex(nextIndex);
    if (router.isReady && !router.query?.idv) {
      router.replace({ pathname: "/2weeks/register", query: { stage: REGISTER_SCREENS[nextIndex] } }, undefined, { shallow: true, scroll: false });
    }
    scrollToTop();
  };

  const goBack = () => {
    const nextIndex = Math.max(0, screenIndex - 1);
    setErrors({});
    setScreenIndex(nextIndex);
    if (router.isReady && !router.query?.idv) {
      router.replace({ pathname: "/2weeks/register", query: { stage: REGISTER_SCREENS[nextIndex] } }, undefined, { shallow: true, scroll: false });
    }
    scrollToTop();
  };

  const submit = async () => {
    // 모바일 중복 터치와 네트워크 재시도로 인한 중복 신청 방지
    if (submitLockRef.current) return;
    const nextErrors = {
      ...validateStep1(form),
      ...validateStep2(form),
      ...validateStep3(form),
    };

    if (Object.keys(nextErrors).length) {
      const invalidScreen = REGISTER_SCREENS.find((item) =>
        (SCREEN_FIELDS[item] || []).some((field) => Boolean(nextErrors[field]))
      );
      if (invalidScreen && invalidScreen !== screen) {
        setScreenIndex(REGISTER_SCREENS.indexOf(invalidScreen));
        if (router.isReady) {
          router.replace({ pathname: "/2weeks/register", query: { stage: invalidScreen } }, undefined, { shallow: true, scroll: false });
        }
        scrollToTop();
      }
      handleErrors(nextErrors);
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setUploadProgress(0);
    setSubmitTone("loading");
    setSubmitMessage("업로드 준비 중입니다.");

    trackTwoWeeksEvent("twoweeks_application_submit_start", {
      step: screenIndex + 1,
    });

    try {
      const result = await createTwoWeeksApplication(form, {
        // 파일 업로드 완료(100%)와 신청서 DB 저장 완료를 구분합니다.
        onUploadProgress: (value) => setUploadProgress(Math.min(82, Math.round(Number(value || 0) * 0.82))),
        onStatusChange: (message) => {
          setSubmitMessage(message);
          if (message?.includes("신청 정보를") || message?.includes("신청 완료 문자를")) setUploadProgress(90);
        },
      });

      setSubmitTone("success");
      setSubmitMessage(
        result.referralStatus === "verified"
          ? "신청 저장 완료\n추천인 확인 완료"
          : ["needs_review", "not_found"].includes(result.referralStatus)
            ? "신청 저장 완료\n추천인 정보는 운영자가 확인할게요."
            : "신청 저장 완료"
      );
      setUploadProgress(100);
      clearTwoWeeksDraft();
      clearTwoWeeksInvite();
      // 동일 기기에 이전 신청현황 조회 세션이 남아 있더라도 새 신청자의
      // 대시보드로 착각하지 않도록 조회 세션을 초기화합니다. 새 조회는 문자 6자리 인증으로 시작합니다.
      if (typeof window !== "undefined") {
        try { window.localStorage.removeItem("twoweeks_proposal_verified_session_v1"); } catch { /* private mode */ }
      }

      try {
        trackTwoWeeksEvent("twoweeks_application_submit_success", {
          step: screenIndex + 1,
          ...getSignupEventContext(form),
        });
        trackTwoWeeksEvent("signup_completed", getSignupEventContext(form));
      } catch (analyticsError) {
        console.warn("[TwoWeeksRegister] Analytics error after saved application:", analyticsError);
      }
      console.info("[TwoWeeksRegister] Firebase 신청 저장 완료:", {
        applicationId: result.applicationId,
        browserProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID || "unknown",
        serverProjectId: result.firestoreProjectId || "unknown",
      });

      // 신청서 저장이 끝나면 심사 안내 완료 화면을 먼저 보여줍니다.
      // 대시보드 조회는 완료 화면의 버튼을 누른 뒤 문자 6자리 OTP로 진행합니다.
      // 개인 식별 정보나 조회 토큰은 URL에 전달하지 않습니다.
      await new Promise((resolve) => setTimeout(resolve, 850));
      try {
        const moved = await router.replace(TWOWEEKS_COMPLETE_PATH);
        if (moved === false && typeof window !== "undefined") {
          window.location.assign(TWOWEEKS_COMPLETE_PATH);
        }
      } catch (navigationError) {
        console.warn("[TwoWeeksRegister] saved, navigation fallback:", navigationError);
        if (typeof window !== "undefined") window.location.assign(TWOWEEKS_COMPLETE_PATH);
      }
      return;
    } catch (error) {
      // 만료는 예측 가능한 상태이며 페이지를 새로고침하거나 사진 단계로 돌려보내지 않습니다.
      if (isTwoWeeksReverificationError(error)) {
        openIdentityReverification("본인인증 유효시간이 지났어요. 작성한 내용은 유지했으니 인증만 다시 진행해주세요.");
        return;
      }
      console.error("[TwoWeeksRegister] submit error:", error);
      trackTwoWeeksEvent("twoweeks_application_submit_error", {
        step: screenIndex + 1,
      });
      const message = String(error?.message || "").replace(/^FirebaseError:\s*/i, "").trim();
      setSubmitTone("error");
      setSubmitMessage(message || "신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
      setUploadProgress(0);
      submitLockRef.current = false;
    }
  };

  return (
    <RegisterLayout>
      <ConversationalRegisterFlow
        screen={screen}
        form={form}
        setForm={setForm}
        errors={errors}
        onBack={goBack}
        onNext={goNext}
        onIdentityVerify={handleIdentityVerify}
        identityLoading={identityLoading}
        identityError={identityError}
        existingApplication={Boolean(existingApplicationNotice)}
        existingApplicationReason={existingApplicationNotice}
        onOpenDashboard={() => setDashboardPromptOpen(true)}
        onResetIdentity={resetExistingApplicationNotice}
        onSubmit={submit}
        submitting={submitting}
      />

      <SubmitOverlay
        visible={submitting || Boolean(submitMessage)}
        progress={uploadProgress}
        message={submitMessage}
        tone={submitTone}
        onDismiss={() => { setSubmitting(false); setSubmitMessage(""); setSubmitTone("loading"); }}
      />
      <IdentityProcessingOverlay message={identityMessage} />
      <DashboardConfirmModal
        open={dashboardPromptOpen}
        onClose={() => setDashboardPromptOpen(false)}
        onConfirm={async () => {
          setDashboardPromptOpen(false);
          try {
            const moved = await router.push(TWOWEEKS_DASHBOARD_PATH);
            if (moved === false && typeof window !== "undefined") window.location.assign(TWOWEEKS_DASHBOARD_PATH);
          } catch (error) {
            if (typeof window !== "undefined") window.location.assign(TWOWEEKS_DASHBOARD_PATH);
          }
        }}
      />
    </RegisterLayout>
  );
}

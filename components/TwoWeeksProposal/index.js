import { Component, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "firebaseConfig";
import { getFunctions, httpsCallable } from "firebase/functions";
import ProposalHeader from "./ProposalHeader";
import IdentityGate from "./IdentityGate";
import IdentityUpgradeGate from "./IdentityUpgradeGate";
import ProposalDashboard from "./ProposalDashboard";
import { safeDashboardTargetQuery } from "./dashboardNavigation";
import {
  PROPOSAL_IDENTITY_UPGRADE_SOURCE,
  PROPOSAL_MAGIC_SESSION_METHOD,
  PROPOSAL_SESSION_KEY,
  PROPOSAL_SESSION_TTL_MS,
  PROPOSAL_SMS_SESSION_METHOD,
  TWOWEEKS_DASHBOARD_PATH,
} from "./constants";
import {
  loadApplicationByAccessToken,
  loadApplicationByVerifiedPhone,
  saveProposalResponse,
  saveScheduleChoices,
  saveScheduleFinalChoice,
  savePreMeetingNote,
  saveMeetingAttendance,
  saveMeetingArrival,
  sendMissingArrivalAlert,
  saveMeetingProofPhoto,
  sendDashboardLookupCode,
  verifyDashboardLookupCode,
  updateApplicationProfile,
  submitVerificationDocumentReplacement,
  requestDepositRefund,
  getWithdrawalPreview,
  requestWithdrawal,
  loadMutualContact,
  ensureFeedbackAccess,
  ensureReviewAccess,
  cancelCurrentMatch,
  setMatchingAvailability,
  completeDashboardIdentityUpgrade,
} from "./proposalService";
import { normalizePhone } from "./helpers";
import LoadingSpinner from "../TwoWeeksShared/LoadingSpinner";
import {
  isTwoWeeksTestPhone,
  TWOWEEKS_TEST_CODE,
} from "../TwoWeeksShared/testAuth";
import { requestPortoneIdentityVerification } from "lib/portoneIdentity";
import {
  clearPendingIdentityVerification,
  createIdentityVerificationId,
  prepareIdentityVerificationPending,
  verifyIdentityResultWithServer,
} from "lib/identityVerificationClient";

class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("[TwoWeeksProposal] dashboard render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-[calc(100svh-64px)] bg-[#f6f3ef] px-5 py-8 md:min-h-[calc(100svh-80px)] md:px-8">
          <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-zinc-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-zinc-950">
              화면을 불러오지 못했습니다.
            </h1>
            <button
              type="button"
              onClick={this.props.onReset}
              className="mt-6 h-12 rounded-full bg-zinc-950 px-6 text-sm font-bold text-white"
            >
              다시 조회하기
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

function ProcessingOverlay({ message }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-[28px] bg-white p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <LoadingSpinner size="lg" tone="dark" className="mx-auto" />
        <div className="mt-5 whitespace-pre-line text-lg font-bold tracking-[-0.03em] text-slate-950">
          {message}
        </div>
      </div>
    </div>
  );
}

function DashboardBootLoading({ message = "신청 현황을 불러오는 중입니다." }) {
  return (
    <section className="flex min-h-[calc(100svh-64px)] items-center justify-center bg-[#f7f8fb] px-5 py-10 text-[#142c46] md:min-h-[calc(100svh-80px)]">
      <div className="w-full max-w-[420px] rounded-[24px] border border-[#e4eaf2] bg-white p-7 text-center shadow-[0_12px_36px_rgba(26,60,96,0.06)]">
        <LoadingSpinner size="lg" tone="blue" className="mx-auto" />
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">
          {message}
        </h1>
        <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#70859c]">
          후보, 일정, 신청 상태를 최신 정보로 확인하고 있습니다.
        </p>
        <div className="mx-auto mt-6 grid max-w-xs gap-3">
          <div className="h-3 animate-pulse rounded-full bg-[#eaf0f8]" />
          <div className="h-3 animate-pulse rounded-full bg-[#f0f4fa]" />
          <div className="h-3 animate-pulse rounded-full bg-[#f0f4fa]" />
        </div>
      </div>
    </section>
  );
}

async function loadActiveCafeCandidatesSafe() {
  try {
    const snap = await getDocs(
      query(collection(db, "twoweeksCafeCandidates"), where("status", "==", "active"))
    );

    return snap.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => item?.name && item?.area)
      .sort((a, b) => {
        const areaCompare = String(a.area || "").localeCompare(String(b.area || ""), "ko");
        if (areaCompare) return areaCompare;

        const sortCompare = Number(a.sortOrder || 999) - Number(b.sortOrder || 999);
        if (sortCompare) return sortCompare;

        return String(a.name || "").localeCompare(String(b.name || ""), "ko");
      });
  } catch (error) {
    console.warn("[TwoWeeksProposal] cafe candidates fallback:", error?.code || error?.message || error);
    return [];
  }
}

function getFirstQueryValue(value) {
  if (Array.isArray(value)) return value[0] || "";
  return value ? String(value) : "";
}

function cleanDashboardLink(router) {
  return router.replace({ pathname: TWOWEEKS_DASHBOARD_PATH, query: safeDashboardTargetQuery(router.query) }, undefined, { shallow: true });
}

function getDashboardLinkParams(query = {}) {
  return {
    applicationId:
      getFirstQueryValue(query.aid) ||
      getFirstQueryValue(query.applicationId) ||
      getFirstQueryValue(query.id),
    token:
      getFirstQueryValue(query.token) ||
      getFirstQueryValue(query.accessToken) ||
      getFirstQueryValue(query.dashboardToken),
  };
}

function readStoredSessionState() {
  if (typeof window === "undefined") return { profile: null, expired: false };

  try {
    const raw = window.localStorage.getItem(PROPOSAL_SESSION_KEY);
    if (!raw) return { profile: null, expired: false };

    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);

    if (!savedAt || Date.now() - savedAt > PROPOSAL_SESSION_TTL_MS) {
      window.localStorage.removeItem(PROPOSAL_SESSION_KEY);
      return { profile: null, expired: true };
    }

    return { profile: parsed?.profile || null, expired: false };
  } catch {
    return { profile: null, expired: true };
  }
}

function readStoredSession() {
  return readStoredSessionState().profile;
}

function writeStoredSession(profile) {
  if (typeof window === "undefined" || !profile?.verified) return;

  try {
    // magic-link 원문 token은 localStorage에 장기 보관하지 않는다.
    // 서버가 현재 Firebase Auth UID에 연결한 dashboard session이 실제 접근권한을 담당하며,
    // 세션이 끊기거나 만료되면 휴대폰 OTP로 다시 인증한다.
    const { token: _discardedToken, ...safeProfile } = profile || {};
    window.localStorage.setItem(
      PROPOSAL_SESSION_KEY,
      JSON.stringify({
        profile: {
          ...safeProfile,
          method: PROPOSAL_SMS_SESSION_METHOD,
        },
        savedAt: Date.now(),
      })
    );
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

function clearStoredSession() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(PROPOSAL_SESSION_KEY);
  } catch {
    // localStorage 사용 불가 시 무시
  }
}

function buildSmsCodeProfile(phone, applicationId = "") {
  return {
    verified: true,
    method: PROPOSAL_SMS_SESSION_METHOD,
    phone: normalizePhone(phone),
    applicationId,
    verifiedAtClient: new Date().toISOString(),
  };
}

function buildMagicLinkProfile({ applicationId, token, application }) {
  return {
    verified: true,
    method: PROPOSAL_MAGIC_SESSION_METHOD,
    applicationId,
    token,
    phone: application?.basic?.phoneNormalized || application?.phoneIdentityVerification?.phone || "",
    name: application?.basic?.name || "",
    verifiedAtClient: new Date().toISOString(),
  };
}

function getFriendlyMessage(error, fallback = "잠시 후 다시 시도해주세요.") {
  const raw = String(error?.code || error?.message || "");

  if (
    raw.includes("admin-restricted-operation") ||
    raw.includes("permission-denied") ||
    raw.includes("Missing or insufficient permissions")
  ) {
    return fallback;
  }

  if (raw.includes("신청내역이 없습니다")) return "신청내역이 없습니다.";

  return fallback || error?.message || "잠시 후 다시 시도해주세요.";
}

function needsDashboardIdentityUpgrade(application = {}) {
  const phone = normalizePhone(
    application?.basic?.phoneNormalized ||
      application?.basic?.phone ||
      application?.phoneIdentityVerification?.phone ||
      ""
  );
  if (isTwoWeeksTestPhone(phone)) return false;

  return !(
    application?.basic?.phoneVerified === true &&
    application?.basic?.phoneVerificationSkipped !== true &&
    application?.phoneIdentityVerification?.verified === true
  );
}

function hasMutualInterestInMatch(match = {}) {
  const participantIds = [match?.maleApplicationId, match?.femaleApplicationId].filter(Boolean);
  if (participantIds.length !== 2) return false;

  if (
    String(match?.connectionOutcome?.status || "") === "mutual_connected" ||
    match?.connectionOutcome?.mutualContactConsent === true ||
    match?.feedbackSummary?.mutualContactConsent === true ||
    match?.feedbackSummary?.mutualInterest === true ||
    String(match?.contactOpenStatus || "") === "mutual_open"
  ) {
    return true;
  }

  const feedbacks = match?.feedbacks || {};
  return participantIds.every((applicationId) => {
    const feedback = feedbacks?.[applicationId] || {};
    if (feedback.meetingResult !== "met") return false;
    const intent = String(feedback.continueMeetingIntent || feedback.meetAgainIntent || "");
    if (typeof feedback.contactShareConsent === "boolean") {
      return intent === "yes" && feedback.contactShareConsent;
    }
    return intent === "yes";
  });
}

export default function TwoWeeksProposalDashboard() {
  const router = useRouter();
  const bootRef = useRef(false);
  const identityUpgradeRedirectRef = useRef("");

  const [bootstrapped, setBootstrapped] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");

  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [lookupChallenge, setLookupChallenge] = useState(null);
  const [lookupSending, setLookupSending] = useState(false);
  const [lookupVerifying, setLookupVerifying] = useState(false);
  const [identityError, setIdentityError] = useState("");
  const [lookupNotice, setLookupNotice] = useState("");

  const [verifiedProfile, setVerifiedProfile] = useState(null);
  const [application, setApplication] = useState(null);
  const [bestMatch, setBestMatch] = useState(null);
  const [cafeCandidates, setCafeCandidates] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [responseStatus, setResponseStatus] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingPreMeetingNote, setSavingPreMeetingNote] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [sendingMissingArrivalAlert, setSendingMissingArrivalAlert] = useState(false);
  const [savingProofPhoto, setSavingProofPhoto] = useState(false);
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [requestingDepositRefund, setRequestingDepositRefund] = useState(false);
  const [mutualContact, setMutualContact] = useState(null);
  const [cancellingMatch, setCancellingMatch] = useState(false);
  const [openingFeedback, setOpeningFeedback] = useState(false);
  const [openingReview, setOpeningReview] = useState(false);
  const [updatingMatchingAvailability, setUpdatingMatchingAvailability] = useState(false);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [identityUpgradeRequired, setIdentityUpgradeRequired] = useState(false);
  const [identityUpgradeLoading, setIdentityUpgradeLoading] = useState(false);
  const [identityUpgradeError, setIdentityUpgradeError] = useState("");
  const [identityUpgradeNotice, setIdentityUpgradeNotice] = useState("");

  const applyDashboardResult = useCallback((result) => {
    setApplication(result?.viewerApplication || null);
    setBestMatch(result?.bestMatch || null);
    setResponseStatus(result?.viewerApplication?.currentProposal?.response || "");
  }, []);

  const resetDashboardState = useCallback(() => {
    setVerifiedProfile(null);
    setApplication(null);
    setBestMatch(null);
    setCafeCandidates([]);
    setResponseStatus("");
    setMutualContact(null);
    setIdentityUpgradeRequired(false);
    setIdentityUpgradeLoading(false);
    setIdentityUpgradeError("");
    setIdentityUpgradeNotice("");
    clearStoredSession();
  }, []);

  const loadDashboard = useCallback(
    async (profile) => {
      if (!profile?.verified) return;

      setLoadingData(true);
      setIdentityError("");

      try {
        let result = null;

        if (profile.method === PROPOSAL_MAGIC_SESSION_METHOD && profile.applicationId && profile.token) {
          result = await loadApplicationByAccessToken({
            applicationId: profile.applicationId,
            token: profile.token,
          });
        } else if (profile.phone) {
          result = await loadApplicationByVerifiedPhone(profile.phone, {
            preferredApplicationId: profile.applicationId || "",
          });
        }

        if (result?.authRequired || !result?.viewerApplication) {
          const fallbackPhone = profile.phone || "";
          resetDashboardState();
          setLookupPhone(fallbackPhone);
          setLookupNotice("기존 신청현황 링크의 인증이 만료되었습니다. 휴대폰 번호 인증으로 안전하게 다시 확인해주세요.");
          setIdentityError("");
          return;
        }

        const nextProfile = {
          ...profile,
          applicationId: profile.applicationId || result?.viewerApplication?.id || "",
        };

        setVerifiedProfile(nextProfile);
        writeStoredSession(nextProfile);
        applyDashboardResult(result);
        setMutualContact(null);

        if (needsDashboardIdentityUpgrade(result.viewerApplication)) {
          setIdentityUpgradeRequired(true);
          setIdentityUpgradeError("");
          setIdentityUpgradeNotice("기존 신청정보는 그대로 유지됩니다. 본인인증만 한 번 완료해주세요.");
          setCafeCandidates([]);
          return;
        }
        setIdentityUpgradeRequired(false);

        if (hasMutualInterestInMatch(result?.bestMatch?.match)) {
          const contact = await loadMutualContact({
            viewerApplication: result.viewerApplication,
            match: result.bestMatch.match,
          });
          setMutualContact(contact);
        }

        const cafes = await loadActiveCafeCandidatesSafe();
        setCafeCandidates(Array.isArray(cafes) ? cafes : []);
      } catch (error) {
        console.error("[TwoWeeksProposal] load dashboard error:", error);
        const fallbackPhone = profile.phone || "";
        resetDashboardState();
        setLookupPhone(fallbackPhone);
        setLookupNotice("세션이 끊어졌거나 조회 정보가 변경되었습니다. 휴대폰 번호 인증으로 다시 확인해주세요.");
        setIdentityError("");
      } finally {
        setLoadingData(false);
      }
    },
    [applyDashboardResult, resetDashboardState]
  );

  const loadDashboardByMagicLink = useCallback(
    async ({ applicationId, token }) => {
      if (!applicationId || !token) return false;

      setLoadingData(true);
      setIdentityMessage("신청 현황을 불러오고 있습니다.");

      try {
        const result = await loadApplicationByAccessToken({ applicationId, token });

        if (result?.authRequired || !result?.viewerApplication) {
          resetDashboardState();
          setLookupNotice("기존 신청현황 링크의 인증이 만료되었습니다. 휴대폰 번호 인증으로 다시 확인해주세요.");
          setIdentityError("");
          await cleanDashboardLink(router);
          return false;
        }

        const profile = buildMagicLinkProfile({
          applicationId,
          token,
          application: result.viewerApplication,
        });

        const nextProfile = {
          ...profile,
          applicationId: profile.applicationId || result?.viewerApplication?.id || "",
        };

        setVerifiedProfile(nextProfile);
        writeStoredSession(nextProfile);
        applyDashboardResult(result);
        setMutualContact(null);

        if (needsDashboardIdentityUpgrade(result.viewerApplication)) {
          setIdentityUpgradeRequired(true);
          setIdentityUpgradeError("");
          setIdentityUpgradeNotice("기존 신청정보는 그대로 유지됩니다. 본인인증만 한 번 완료해주세요.");
          setCafeCandidates([]);
          await cleanDashboardLink(router);
          return true;
        }
        setIdentityUpgradeRequired(false);

        if (hasMutualInterestInMatch(result?.bestMatch?.match)) {
          const contact = await loadMutualContact({
            viewerApplication: result.viewerApplication,
            match: result.bestMatch.match,
          });
          setMutualContact(contact);
        }

        const cafes = await loadActiveCafeCandidatesSafe();
        setCafeCandidates(Array.isArray(cafes) ? cafes : []);
        cleanDashboardLink(router);
        return true;
      } catch (error) {
        console.error("[TwoWeeksProposal] magic link error:", error);
        resetDashboardState();
        setLookupNotice("조회 링크가 만료되었거나 세션이 끊어졌습니다. 휴대폰 번호 인증으로 다시 확인해주세요.");
        setIdentityError("");
        return false;
      } finally {
        setLoadingData(false);
        setIdentityMessage("");
      }
    },
    [applyDashboardResult, resetDashboardState, router]
  );

  useEffect(() => {
    if (!router.isReady || bootRef.current) return;
    bootRef.current = true;

    const linkParams = getDashboardLinkParams(router.query);

    if (linkParams.applicationId && linkParams.token) {
      setBootstrapped(true);
      loadDashboardByMagicLink(linkParams);
      return;
    }

    const storedSession = readStoredSessionState();
    const stored = storedSession.profile;

    if (stored?.verified) {
      setVerifiedProfile(stored);
      loadDashboard(stored);
    } else if (storedSession.expired) {
      setLookupNotice("저장된 조회 세션이 만료되었습니다. 휴대폰 번호 인증으로 다시 확인해주세요.");
    }

    setBootstrapped(true);
  }, [loadDashboard, loadDashboardByMagicLink, router.isReady, router.query]);

  const handleSendLookupCode = useCallback(async () => {
    const phoneNormalized = normalizePhone(lookupPhone);

    if (!phoneNormalized || phoneNormalized.length < 10) {
      setIdentityError("휴대폰 번호를 확인해주세요.");
      setLookupNotice("");
      return;
    }

    try {
      setLookupSending(true);
      setIdentityError("");
      setLookupNotice("");
      setLookupCode("");

      const challenge = await sendDashboardLookupCode(phoneNormalized);

      if (!challenge?.ok) {
        setIdentityError(challenge?.message || "신청내역이 없습니다.");
        setLookupChallenge(null);
        return;
      }

      setLookupChallenge(challenge);
      if (challenge.testMode === true) {
        setLookupCode(TWOWEEKS_TEST_CODE);
        setLookupNotice("테스트 번호가 확인되었습니다. 신청 현황 확인하기를 눌러주세요.");
      } else {
        setLookupNotice("인증번호를 보냈습니다.");
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] lookup code send error:", error);
      setIdentityError(getFriendlyMessage(error, "잠시 후 다시 시도해주세요."));
      setLookupChallenge(null);
    } finally {
      setLookupSending(false);
    }
  }, [lookupPhone]);

  const handleVerifyLookupCode = useCallback(async () => {
    const phoneNormalized = normalizePhone(lookupPhone);
    const cleanCode = String(lookupCode || "").replace(/[^0-9]/g, "");

    if (!lookupChallenge?.ok || !lookupChallenge?.challengeId) {
      setIdentityError("인증번호를 먼저 받아주세요.");
      return;
    }

    if (!cleanCode || cleanCode.length !== 6) {
      setIdentityError("인증번호 6자리를 입력해주세요.");
      return;
    }

    if (lookupChallenge.expiresAt && Date.now() > Number(lookupChallenge.expiresAt || 0)) {
      setIdentityError("인증번호가 만료되었습니다. 다시 요청해주세요.");
      setLookupChallenge(null);
      setLookupCode("");
      return;
    }

    try {
      setLookupVerifying(true);
      setIdentityError("");
      setLookupNotice("");

      const verified = await verifyDashboardLookupCode({
        phone: phoneNormalized,
        code: cleanCode,
        challengeId: lookupChallenge.challengeId,
        preferredApplicationId: lookupChallenge.applicationId || "",
      });

      if (!verified?.ok) {
        setIdentityError(verified?.message || "인증번호를 확인하지 못했습니다. 다시 요청해주세요.");
        if (["OTP_EXPIRED", "OTP_ATTEMPTS_EXCEEDED", "OTP_CONSUMED", "VERIFY_FAILED", "SESSION_CREATE_FAILED"].includes(verified?.code)) {
          setLookupChallenge(null);
          setLookupCode("");
        }
        return;
      }

      const profile = {
        ...buildSmsCodeProfile(phoneNormalized, verified.applicationId || ""),
        name: verified.name || "",
      };

      await loadDashboard(profile);
      setLookupChallenge(null);
      setLookupCode("");
    } catch (error) {
      console.error("[TwoWeeksProposal] lookup verify error:", error);
      setIdentityError(error?.message || getFriendlyMessage(error));
    } finally {
      setLookupVerifying(false);
    }
  }, [loadDashboard, lookupChallenge, lookupCode, lookupPhone]);

  const handleResetIdentity = () => {
    clearStoredSession();
    setVerifiedProfile(null);
    setApplication(null);
    setBestMatch(null);
    setCafeCandidates([]);
    setResponseStatus("");
    setMutualContact(null);
    setLookupPhone("");
    setLookupCode("");
    setLookupChallenge(null);
    setLookupNotice("");
    setIdentityError("");
    setIdentityUpgradeRequired(false);
    setIdentityUpgradeLoading(false);
    setIdentityUpgradeError("");
    setIdentityUpgradeNotice("");
  };

  // Logout revokes the current OTP dashboard session on the server before clearing local state.
  // Do not sign out the Firebase user globally: that may affect other services.
  const handleDashboardLogout = async () => {
    try {
      const logout = httpsCallable(getFunctions(undefined, "asia-northeast3"), "logoutMyTwoWeeksDashboardSession");
      await logout();
      handleResetIdentity();
    } catch (error) {
      console.error("[TwoWeeksProposal] dashboard logout failed:", error?.code || "unknown");
      alert("신청현황 인증 세션을 종료하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const finishDashboardIdentityUpgrade = useCallback(
    async (identityVerificationId) => {
      if (!application?.id || !verifiedProfile?.verified) {
        throw new Error("신청현황 인증 세션이 만료되었습니다. 휴대폰 번호 인증부터 다시 진행해주세요.");
      }

      const phone = normalizePhone(
        application?.basic?.phoneNormalized ||
          application?.basic?.phone ||
          application?.phoneIdentityVerification?.phone ||
          verifiedProfile?.phone ||
          ""
      );

      const verified = await verifyIdentityResultWithServer({
        identityVerificationId,
        requestedPhone: phone,
        source: PROPOSAL_IDENTITY_UPGRADE_SOURCE,
      });

      if (!verified?.verified) {
        throw new Error(verified?.message || "본인인증 검증에 실패했습니다.");
      }

      await completeDashboardIdentityUpgrade({
        applicationId: application.id,
        identityVerificationId,
      });

      clearPendingIdentityVerification();
      setIdentityUpgradeRequired(false);
      setIdentityUpgradeError("");
      setIdentityUpgradeNotice("본인인증이 완료되었습니다. 신청현황을 불러오고 있어요.");
      await cleanDashboardLink(router);
      await loadDashboard(verifiedProfile);
    },
    [application, loadDashboard, router, verifiedProfile]
  );

  const handleDashboardIdentityUpgrade = useCallback(async () => {
    if (!application?.id) return;

    const phone = normalizePhone(
      application?.basic?.phoneNormalized ||
        application?.basic?.phone ||
        application?.phoneIdentityVerification?.phone ||
        verifiedProfile?.phone ||
        ""
    );
    const name = String(application?.basic?.name || verifiedProfile?.name || "").trim();

    if (!phone || !name) {
      setIdentityUpgradeError("기존 신청정보의 이름 또는 연락처를 확인할 수 없습니다. 관리자에게 문의해주세요.");
      return;
    }

    try {
      setIdentityUpgradeLoading(true);
      setIdentityUpgradeError("");
      setIdentityUpgradeNotice("");
      setIdentityMessage("본인인증 창을 준비하고 있어요.");

      const identityVerificationId = createIdentityVerificationId("twoweeks_dashboard");
      const redirectUrl = `${window.location.origin}${TWOWEEKS_DASHBOARD_PATH}?identityUpgrade=1&idv=${encodeURIComponent(identityVerificationId)}`;

      prepareIdentityVerificationPending({
        source: PROPOSAL_IDENTITY_UPGRADE_SOURCE,
        returnUrl: redirectUrl,
        requestedPhone: phone,
        requestedCarrier: "",
        identityVerificationId,
      });

      setIdentityMessage("본인인증을 진행 중이에요.\n인증창을 닫지 말고 기다려주세요.");
      const sdkResult = await requestPortoneIdentityVerification({
        phone,
        name,
        source: PROPOSAL_IDENTITY_UPGRADE_SOURCE,
        identityVerificationId,
        redirectUrl,
        timeoutMs: 30000,
      });

      if (!sdkResult?.ok) {
        throw new Error(sdkResult?.message || "본인인증이 완료되지 않았습니다. 다시 진행해주세요.");
      }

      if (!sdkResult?.redirected) {
        const verifiedId = sdkResult.identityVerificationId || identityVerificationId;
        setIdentityMessage("본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요.");
        await finishDashboardIdentityUpgrade(verifiedId);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] identity upgrade error:", error);
      setIdentityUpgradeError(error?.message || "본인인증 중 오류가 발생했습니다. 다시 시도해주세요.");
      clearPendingIdentityVerification();
    } finally {
      setIdentityUpgradeLoading(false);
      setIdentityMessage("");
    }
  }, [application, finishDashboardIdentityUpgrade, verifiedProfile]);

  useEffect(() => {
    if (!router.isReady || !identityUpgradeRequired || !application?.id || !verifiedProfile?.verified) return;
    const upgrade = Array.isArray(router.query.identityUpgrade) ? router.query.identityUpgrade[0] : router.query.identityUpgrade;
    const rawIdv = router.query.idv || router.query.identityVerificationId || router.query.identity_verification_id || "";
    const identityVerificationId = Array.isArray(rawIdv) ? rawIdv[0] : String(rawIdv || "");
    if (String(upgrade || "") !== "1" || !identityVerificationId) return;
    if (identityUpgradeRedirectRef.current === identityVerificationId) return;
    identityUpgradeRedirectRef.current = identityVerificationId;

    (async () => {
      try {
        setIdentityUpgradeLoading(true);
        setIdentityUpgradeError("");
        setIdentityMessage("본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요.");
        await finishDashboardIdentityUpgrade(identityVerificationId);
      } catch (error) {
        console.error("[TwoWeeksProposal] identity upgrade redirect error:", error);
        setIdentityUpgradeError(error?.message || "본인인증 결과를 반영하지 못했습니다. 다시 시도해주세요.");
        await cleanDashboardLink(router);
      } finally {
        setIdentityUpgradeLoading(false);
        setIdentityMessage("");
      }
    })();
  }, [application, finishDashboardIdentityUpgrade, identityUpgradeRequired, router, router.isReady, router.query, verifiedProfile]);

  const handleReload = () => {
    if (!verifiedProfile) return;
    loadDashboard(verifiedProfile);
  };


  const handleSaveProfile = async (profileForm) => {
    if (!application?.id) return;

    setSavingProfile(true);
    setProfileUploadProgress(0);

    let saved = false;
    try {
      const updatedApplication = await updateApplicationProfile({
        application,
        form: profileForm,
        onUploadProgress: setProfileUploadProgress,
      });

      setApplication(updatedApplication);
      setProfileUploadProgress(100);
      saved = true;
      alert(updatedApplication?.profileUpdateResult?.reviewRequired
        ? "저장되었습니다. 사진·직업정보 변경은 운영자 재검토 후 다음 매칭부터 반영됩니다."
        : "프로필이 저장되었습니다.");

      if (verifiedProfile) {
        try {
          await loadDashboard(verifiedProfile);
        } catch (reloadError) {
          console.error("[TwoWeeksProposal] profile reload error:", reloadError);
          alert("저장은 완료됐지만 화면 갱신에 실패했습니다. 페이지를 새로고침해주세요.");
        }
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] profile update error:", error);
      if (!saved) alert(error?.message || "프로필 저장 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setSavingProfile(false);
      setProfileUploadProgress(0);
    }
  };

  const handleSubmitVerificationDocument = async (file) => {
    if (!application?.id) return false;
    setSavingProfile(true);
    setProfileUploadProgress(0);
    try {
      await submitVerificationDocumentReplacement({
        application,
        file,
        onUploadProgress: setProfileUploadProgress,
      });
      alert("새 직업 인증자료가 제출되었습니다. 운영자 재검토 후 다음 매칭부터 반영됩니다.");
      if (verifiedProfile) await loadDashboard(verifiedProfile).catch(() => {
        alert("제출은 완료됐지만 화면 갱신에 실패했습니다. 페이지를 새로고침해주세요.");
      });
      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] verification replacement error:", error);
      alert(error?.message || "직업 인증자료 제출 중 오류가 발생했습니다.");
      return false;
    } finally {
      setSavingProfile(false);
      setProfileUploadProgress(0);
    }
  };

  const handleRequestDepositRefund = async (refundForm) => {
    if (!application?.id) return false;

    setRequestingDepositRefund(true);

    try {
      const result = await requestDepositRefund({
        application,
        verifiedProfile,
        bankName: refundForm?.bankName,
        accountNumber: refundForm?.accountNumber,
        accountHolder: refundForm?.accountHolder,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }

      return result || { ok: true };
    } catch (error) {
      console.error("[TwoWeeksProposal] deposit refund request error:", error);
      alert(error?.message || "예치금 반환 요청 중 오류가 발생했습니다.");
      return false;
    } finally {
      setRequestingDepositRefund(false);
    }
  };

  const handleLoadWithdrawalPreview = useCallback(async () => {
    if (!application?.id) {
      throw new Error("탈퇴할 신청 정보를 확인할 수 없습니다.");
    }
    return getWithdrawalPreview({ application });
  }, [application]);

  const handleRequestWithdrawal = async (withdrawalForm) => {
    if (!application?.id) return false;

    setSubmittingWithdrawal(true);
    try {
      const result = await requestWithdrawal({
        application,
        mode: withdrawalForm?.mode,
        reasonCode: withdrawalForm?.reasonCode,
        reasonDetail: withdrawalForm?.reasonDetail,
        bankName: withdrawalForm?.bankName,
        accountNumber: withdrawalForm?.accountNumber,
        accountHolder: withdrawalForm?.accountHolder,
      });

      if (result?.status === "scheduled_after_match") {
        alert(
          "현재 만남 후 탈퇴가 예약되었습니다.\n현재 만남과 일정은 그대로 진행되며, 다음 매칭은 지금부터 중단됩니다."
        );
        if (verifiedProfile) await loadDashboard(verifiedProfile);
        return result;
      }

      const refundMessage = result?.refundStatus === "requested" && Number(result?.refundAmount || 0) > 0
        ? `\n예치금 ${Number(result.refundAmount).toLocaleString("ko-KR")}원은 접수 후 3일 이내 입력한 계좌로 반환됩니다.`
        : result?.refundStatus === "pending_admin_review"
          ? "\n예치금은 운영자 확인 후 반환 가능 금액을 별도로 안내드립니다."
          : "";
      const deductionMessage = Number(result?.deductionAmount || 0) > 0
        ? `\n취소 정책에 따라 ${Number(result.deductionAmount).toLocaleString("ko-KR")}원이 차감되었습니다.`
        : "";

      alert(`투윅스 탈퇴가 완료되었습니다.${deductionMessage}${refundMessage}`);
      handleResetIdentity();
      return result || { ok: true };
    } catch (error) {
      console.error("[TwoWeeksProposal] withdrawal error:", error);
      throw error;
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleRespond = async (response, declineReason = null) => {
    if (!application || !bestMatch?.candidate) return;

    setSavingResponse(true);

    try {
      const result = await saveProposalResponse({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        response,
        declineReason,
      });

      setResponseStatus(response);

      if (result?.bothAccepted) {
        await router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query, section: "intro", tab: "schedule" },
          },
          undefined,
          { shallow: true }
        );
      }

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }

      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] response save error:", error);
      alert(error?.message || "응답 저장 중 오류가 발생했습니다.");

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile).catch(() => {});
      }

      return false;
    } finally {
      setSavingResponse(false);
    }
  };


  const handleSaveScheduleChoices = async (choices) => {
    if (!application || !bestMatch?.candidate) return;

    setSavingSchedule(true);

    try {
      await saveScheduleChoices({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        choices,
        noShowPolicyAccepted: choices?.noShowPolicyAccepted === true,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] schedule choices save error:", error);
      alert(error?.message || "일정 후보 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveFinalScheduleChoice = async (choice) => {
    if (!application || !bestMatch?.candidate) return;

    setSavingSchedule(true);

    try {
      await saveScheduleFinalChoice({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        choice,
        noShowPolicyAccepted: choice?.noShowPolicyAccepted === true,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] final schedule save error:", error);
      alert(error?.message || "일정 선택 중 오류가 발생했습니다.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSavePreMeetingNote = async (note) => {
    if (!application || !bestMatch?.candidate) return;

    setSavingPreMeetingNote(true);

    try {
      await savePreMeetingNote({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        note,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] pre meeting note save error:", error);
      alert(error?.message || "만남 전 한마디 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingPreMeetingNote(false);
    }
  };

  const handleSaveMeetingAttendance = async () => {
    if (!application || !bestMatch?.candidate) return;

    setSavingAttendance(true);

    try {
      await saveMeetingAttendance({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        status: "attending",
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] attendance save error:", error);
      alert(error?.message || "참석 확인 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleSendMissingArrivalAlert = async () => {
    if (!application || !bestMatch?.candidate) return;

    setSendingMissingArrivalAlert(true);

    try {
      const result = await sendMissingArrivalAlert({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
      });

      if (result?.status === "sent") {
        alert("상대방에게 현재 기다리고 있다는 안내 문자를 보냈습니다.");
      }

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] missing arrival alert error:", error);
      alert(error?.message || "상대 미도착 알림 발송 중 오류가 발생했습니다.");

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile).catch(() => {});
      }
    } finally {
      setSendingMissingArrivalAlert(false);
    }
  };


  const handleSaveMeetingProofPhoto = async ({ file }) => {
    if (!application || !bestMatch?.candidate) return false;

    setSavingProofPhoto(true);
    setProofUploadProgress(0);
    let proofSaved = false;

    try {
      await saveMeetingProofPhoto({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        file,
        onProgress: setProofUploadProgress,
      });
      proofSaved = true;

      await saveMeetingArrival({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }

      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] proof photo / arrival save error:", error);
      alert(
        error?.message ||
          (proofSaved
            ? "현장사진은 업로드되었지만 도착 확인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            : "현장사진 업로드 중 오류가 발생했습니다.")
      );

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile).catch(() => {});
      }

      return false;
    } finally {
      setSavingProofPhoto(false);
      setProofUploadProgress(0);
    }
  };

  const handleCancelMatch = async () => {
    if (!application?.id || !bestMatch?.match?.id) return false;

    setCancellingMatch(true);
    try {
      const result = await cancelCurrentMatch({
        viewerApplication: application,
        match: bestMatch.match,
      });

      if (result?.ok) {
        alert(
          `만남 취소가 처리되었습니다.\n예치금 ${Number(result.deductionAmount || 0).toLocaleString()}원이 차감되었습니다.`
        );
      }

      if (verifiedProfile) await loadDashboard(verifiedProfile);
      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] match cancellation error:", error);
      alert(error?.message || "만남 취소 처리 중 오류가 발생했습니다.");
      if (verifiedProfile) await loadDashboard(verifiedProfile).catch(() => {});
      return false;
    } finally {
      setCancellingMatch(false);
    }
  };


  const handleOpenFeedback = async () => {
    if (!application?.id || !bestMatch?.match?.id) {
      alert("피드백을 작성할 만남 정보를 확인할 수 없습니다.");
      return false;
    }

    setOpeningFeedback(true);

    try {
      const result = await ensureFeedbackAccess({
        viewerApplication: application,
        match: bestMatch.match,
      });

      if (!result?.feedbackPath && !result?.feedbackUrl) {
        throw new Error("피드백 링크를 만들지 못했습니다.");
      }

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile).catch(() => {});
      }

      if (typeof window !== "undefined") {
        let feedbackTarget = String(result.feedbackPath || "").trim();

        // 구버전 Function이 절대주소만 반환하더라도 현재 브라우저 origin을 유지한다.
        // matchId/roundId(beta 등)는 고객 URL에 노출하지 않고 token만 전달한다.
        if (!feedbackTarget && result.feedbackUrl) {
          const parsed = new URL(result.feedbackUrl, window.location.origin);
          const feedbackToken = parsed.searchParams.get("token") || "";
          feedbackTarget = feedbackToken
            ? `/2weeks/feedback?token=${encodeURIComponent(feedbackToken)}`
            : `${parsed.pathname}${parsed.search}`;
        }

        window.location.assign(feedbackTarget);
      }

      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] feedback open error:", error);
      alert(error?.message || "피드백 화면을 여는 중 오류가 발생했습니다.");
      return false;
    } finally {
      setOpeningFeedback(false);
    }
  };


  const handleOpenReview = async () => {
    if (!application?.id || !bestMatch?.match?.id) {
      alert("후기를 작성할 만남 정보를 확인할 수 없습니다.");
      return false;
    }

    setOpeningReview(true);
    try {
      const result = await ensureReviewAccess({
        viewerApplication: application,
        match: bestMatch.match,
      });

      if (result?.alreadySubmitted) {
        alert("이미 이용 후기를 남겨주셨습니다. 감사합니다.");
        return true;
      }

      if (!result?.path) {
        throw new Error("후기 페이지를 열 수 없습니다.");
      }

      if (typeof window !== "undefined") {
        window.location.assign(result.path);
      }
      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] review open error:", error);
      alert(error?.message || "후기 화면을 여는 중 오류가 발생했습니다.");
      return false;
    } finally {
      setOpeningReview(false);
    }
  };


  const handleSetMatchingAvailability = async (action) => {
    if (!application?.id) return false;

    setUpdatingMatchingAvailability(true);
    try {
      const result = await setMatchingAvailability({
        viewerApplication: application,
        action,
      });

      if (result?.ok) {
        alert(action === "pause" ? "매칭을 잠시 쉬는 상태로 변경했습니다." : "매칭을 다시 시작했습니다. 다음 매칭 후보로 안내될 수 있습니다.");
      }

      if (verifiedProfile) await loadDashboard(verifiedProfile);
      return true;
    } catch (error) {
      console.error("[TwoWeeksProposal] matching availability error:", error);
      alert(error?.message || "매칭 상태 변경 중 오류가 발생했습니다.");
      if (verifiedProfile) await loadDashboard(verifiedProfile).catch(() => {});
      return false;
    } finally {
      setUpdatingMatchingAvailability(false);
    }
  };

  const DashboardComponent = ProposalDashboard;

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <ProposalHeader />

      {!bootstrapped ? (
        <div className="flex min-h-[calc(100svh-80px)] items-center justify-center px-5 text-[#326bda]">
          <div className="text-center">
<LoadingSpinner size="lg" tone="blue" className="mx-auto" />
          </div>
        </div>
      ) : loadingData && !verifiedProfile ? (
        <DashboardBootLoading />
      ) : !verifiedProfile ? (
        <IdentityGate
          loading={loadingData}
          error={identityError}
          notice={lookupNotice}
          phone={lookupPhone}
          code={lookupCode}
          codeSent={Boolean(lookupChallenge?.ok)}
          sendingCode={lookupSending}
          verifyingCode={lookupVerifying}
          onPhoneChange={(value) => {
            setLookupPhone(value);
            setIdentityError("");
            setLookupNotice("");
            if (lookupChallenge) {
              setLookupChallenge(null);
              setLookupCode("");
            }
          }}
          onCodeChange={setLookupCode}
          onSendCode={handleSendLookupCode}
          onVerifyCode={handleVerifyLookupCode}
        />
      ) : identityUpgradeRequired && application ? (
        <IdentityUpgradeGate
          application={application}
          loading={identityUpgradeLoading}
          error={identityUpgradeError}
          notice={identityUpgradeNotice}
          onVerify={handleDashboardIdentityUpgrade}
          onUsePhoneLookup={handleResetIdentity}
        />
      ) : typeof DashboardComponent === "function" ? (
        <DashboardErrorBoundary onReset={handleResetIdentity}>
          <DashboardComponent
            requestedTab={Array.isArray(router.query.tab) ? router.query.tab[0] : router.query.tab || ""}
            requestedSection={Array.isArray(router.query.section) ? router.query.section[0] : router.query.section || ""}
            verifiedProfile={verifiedProfile}
            application={application}
            bestMatch={bestMatch}
            cafeCandidates={cafeCandidates}
            loading={loadingData}
            responseStatus={responseStatus}
            savingResponse={savingResponse}
            savingSchedule={savingSchedule}
            savingPreMeetingNote={savingPreMeetingNote}
            savingAttendance={savingAttendance}
            sendingMissingArrivalAlert={sendingMissingArrivalAlert}
            savingProofPhoto={savingProofPhoto}
            proofUploadProgress={proofUploadProgress}
            savingProfile={savingProfile}
            profileUploadProgress={profileUploadProgress}
            requestingDepositRefund={requestingDepositRefund}
            mutualContact={mutualContact}
            cancellingMatch={cancellingMatch}
            openingFeedback={openingFeedback}
            openingReview={openingReview}
            updatingMatchingAvailability={updatingMatchingAvailability}
            submittingWithdrawal={submittingWithdrawal}
            onRespond={handleRespond}
            onSaveScheduleChoices={handleSaveScheduleChoices}
            onSaveFinalScheduleChoice={handleSaveFinalScheduleChoice}
            onSavePreMeetingNote={handleSavePreMeetingNote}
            onSaveMeetingAttendance={handleSaveMeetingAttendance}
            onSendMissingArrivalAlert={handleSendMissingArrivalAlert}
            onSaveMeetingProofPhoto={handleSaveMeetingProofPhoto}
            onSaveProfile={handleSaveProfile}
            onSubmitVerificationDocument={handleSubmitVerificationDocument}
            onRequestDepositRefund={handleRequestDepositRefund}
            onCancelMatch={handleCancelMatch}
            onOpenFeedback={handleOpenFeedback}
            onOpenReview={handleOpenReview}
            onSetMatchingAvailability={handleSetMatchingAvailability}
            onLoadWithdrawalPreview={handleLoadWithdrawalPreview}
            onRequestWithdrawal={handleRequestWithdrawal}
            onResetIdentity={handleResetIdentity}
            onDashboardLogout={handleDashboardLogout}
            onReload={handleReload}
          />
        </DashboardErrorBoundary>
      ) : (
        <main className="min-h-[calc(100svh-64px)] bg-[#f6f3ef] px-5 py-8 md:min-h-[calc(100svh-80px)] md:px-8">
          <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-zinc-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold tracking-[-0.04em] text-zinc-950">
              화면을 불러오지 못했습니다.
            </h1>
            <button
              type="button"
              onClick={handleResetIdentity}
              className="mt-6 h-12 rounded-full bg-zinc-950 px-6 text-sm font-bold text-white"
            >
              다시 조회하기
            </button>
          </div>
        </main>
      )}

      <ProcessingOverlay message={identityMessage} />
    </div>
  );
}

import { Component, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "firebaseConfig";
import ProposalHeader from "./ProposalHeader";
import IdentityGate from "./IdentityGate";
import ProposalDashboard from "./ProposalDashboard";
import {
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
  saveMeetingProofPhoto,
  sendDashboardLookupCode,
  updateApplicationProfile,
} from "./proposalService";
import { normalizePhone } from "./helpers";
import LoadingSpinner from "../TwoWeeksShared/LoadingSpinner";

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
    <section className="flex min-h-[calc(100svh-64px)] items-center justify-center px-5 py-10 text-white md:min-h-[calc(100svh-80px)]">
      <div className="w-full max-w-[420px] rounded-[32px] border border-white/10 bg-white/[0.07] p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl">
                    <LoadingSpinner size="lg" tone="light" className="mx-auto" />
        <h1 className="mt-5 text-2xl font-bold tracking-[-0.04em]">
          {message}
        </h1>
        <p className="mt-2 break-keep text-sm font-semibold leading-6 text-zinc-300">
          후보, 일정, 신청 상태를 최신 정보로 확인하고 있습니다.
        </p>
        <div className="mx-auto mt-6 grid max-w-xs gap-3">
          <div className="h-3 animate-pulse rounded-full bg-white/15" />
          <div className="h-3 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 animate-pulse rounded-full bg-white/10" />
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

function readStoredSession() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROPOSAL_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);

    if (!savedAt || Date.now() - savedAt > PROPOSAL_SESSION_TTL_MS) {
      window.localStorage.removeItem(PROPOSAL_SESSION_KEY);
      return null;
    }

    return parsed?.profile || null;
  } catch {
    return null;
  }
}

function writeStoredSession(profile) {
  if (typeof window === "undefined" || !profile?.verified) return;

  try {
    window.localStorage.setItem(
      PROPOSAL_SESSION_KEY,
      JSON.stringify({
        profile,
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

  return error?.message || fallback;
}

export default function TwoWeeksProposalDashboard() {
  const router = useRouter();
  const bootRef = useRef(false);

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
  const [savingArrival, setSavingArrival] = useState(false);
  const [savingProofPhoto, setSavingProofPhoto] = useState(false);
  const [proofUploadProgress, setProofUploadProgress] = useState(0);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);

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

        if (!result?.viewerApplication) {
          resetDashboardState();
          setIdentityError("신청내역이 없습니다.");
          return;
        }

        const nextProfile = {
          ...profile,
          applicationId: profile.applicationId || result?.viewerApplication?.id || "",
        };

        setVerifiedProfile(nextProfile);
        writeStoredSession(nextProfile);
        applyDashboardResult(result);

        const cafes = await loadActiveCafeCandidatesSafe();
        setCafeCandidates(Array.isArray(cafes) ? cafes : []);
      } catch (error) {
        console.error("[TwoWeeksProposal] load dashboard error:", error);
        resetDashboardState();
        setIdentityError(getFriendlyMessage(error));
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

        if (!result?.viewerApplication) {
          setIdentityError("신청내역이 없습니다.");
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

        const cafes = await loadActiveCafeCandidatesSafe();
        setCafeCandidates(Array.isArray(cafes) ? cafes : []);
        router.replace(TWOWEEKS_DASHBOARD_PATH, undefined, { shallow: true });
        return true;
      } catch (error) {
        console.error("[TwoWeeksProposal] magic link error:", error);
        resetDashboardState();
        setIdentityError(getFriendlyMessage(error));
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

    const stored = readStoredSession();

    if (stored?.verified) {
      setVerifiedProfile(stored);
      loadDashboard(stored);
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
      setLookupNotice("인증번호를 보냈습니다.");
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

    if (!lookupChallenge?.ok || !lookupChallenge?.code || !lookupChallenge?.phoneNormalized) {
      setIdentityError("인증번호를 먼저 받아주세요.");
      return;
    }

    if (!cleanCode || cleanCode.length !== 6) {
      setIdentityError("인증번호 6자리를 입력해주세요.");
      return;
    }

    if (Date.now() > Number(lookupChallenge.expiresAt || 0)) {
      setIdentityError("인증번호가 만료되었습니다.");
      setLookupChallenge(null);
      setLookupCode("");
      return;
    }

    if (phoneNormalized !== lookupChallenge.phoneNormalized) {
      setIdentityError("휴대폰 번호가 다릅니다.");
      return;
    }

    if (cleanCode !== String(lookupChallenge.code)) {
      setIdentityError("인증번호가 일치하지 않습니다.");
      return;
    }

    try {
      setLookupVerifying(true);
      setIdentityError("");
      setLookupNotice("");

      const profile = buildSmsCodeProfile(phoneNormalized, lookupChallenge.applicationId || "");
      await loadDashboard(profile);
      setLookupChallenge(null);
      setLookupCode("");
    } catch (error) {
      console.error("[TwoWeeksProposal] lookup verify error:", error);
      setIdentityError(getFriendlyMessage(error));
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
    setLookupPhone("");
    setLookupCode("");
    setLookupChallenge(null);
    setLookupNotice("");
    setIdentityError("");
  };

  const handleReload = () => {
    if (!verifiedProfile) return;
    loadDashboard(verifiedProfile);
  };


  const handleSaveProfile = async (profileForm) => {
    if (!application?.id) return;

    setSavingProfile(true);
    setProfileUploadProgress(0);

    try {
      const updatedApplication = await updateApplicationProfile({
        application,
        form: profileForm,
        onUploadProgress: setProfileUploadProgress,
      });

      setApplication(updatedApplication);
      setProfileUploadProgress(100);

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] profile update error:", error);
      alert(error?.message || "프로필 저장 중 오류가 발생했습니다.");
      throw error;
    } finally {
      setSavingProfile(false);
      setProfileUploadProgress(0);
    }
  };

  const handleRespond = async (response) => {
    if (!application || !bestMatch?.candidate) return;

    setSavingResponse(true);

    try {
      await saveProposalResponse({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        response,
      });

      setResponseStatus(response);

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] response save error:", error);
      alert(error?.message || "응답 저장 중 오류가 발생했습니다.");
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

  const handleSaveMeetingArrival = async () => {
    if (!application || !bestMatch?.candidate) return;

    setSavingArrival(true);

    try {
      await saveMeetingArrival({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] arrival save error:", error);
      alert(error?.message || "도착 확인 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingArrival(false);
    }
  };


  const handleSaveMeetingProofPhoto = async ({ file, note }) => {
    if (!application || !bestMatch?.candidate) return;

    setSavingProofPhoto(true);
    setProofUploadProgress(0);

    try {
      await saveMeetingProofPhoto({
        viewerApplication: application,
        candidateApplication: bestMatch.candidate,
        file,
        note,
        onProgress: setProofUploadProgress,
      });

      if (verifiedProfile) {
        await loadDashboard(verifiedProfile);
      }
    } catch (error) {
      console.error("[TwoWeeksProposal] proof photo save error:", error);
      alert(error?.message || "현장 인증 사진 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingProofPhoto(false);
      setProofUploadProgress(0);
    }
  };

  const DashboardComponent = ProposalDashboard;

  return (
    <div className="min-h-screen bg-black">
      <ProposalHeader />

      {!bootstrapped ? (
        <div className="flex min-h-[calc(100svh-80px)] items-center justify-center px-5 text-white">
          <div className="text-center">
<LoadingSpinner size="lg" tone="light" className="mx-auto" />
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
      ) : typeof DashboardComponent === "function" ? (
        <DashboardErrorBoundary onReset={handleResetIdentity}>
          <DashboardComponent
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
            savingArrival={savingArrival}
            savingProofPhoto={savingProofPhoto}
            proofUploadProgress={proofUploadProgress}
            savingProfile={savingProfile}
            profileUploadProgress={profileUploadProgress}
            onRespond={handleRespond}
            onSaveScheduleChoices={handleSaveScheduleChoices}
            onSaveFinalScheduleChoice={handleSaveFinalScheduleChoice}
            onSavePreMeetingNote={handleSavePreMeetingNote}
            onSaveMeetingAttendance={handleSaveMeetingAttendance}
            onSaveMeetingArrival={handleSaveMeetingArrival}
            onSaveMeetingProofPhoto={handleSaveMeetingProofPhoto}
            onSaveProfile={handleSaveProfile}
            onResetIdentity={handleResetIdentity}
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

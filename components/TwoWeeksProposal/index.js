import { Component, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
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
  sendDashboardLookupCode,
  updateApplicationProfile,
} from "./proposalService";
import { normalizePhone } from "./helpers";

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
            <h1 className="text-2xl font-black tracking-[-0.04em] text-zinc-950">
              화면을 불러오지 못했습니다.
            </h1>
            <button
              type="button"
              onClick={this.props.onReset}
              className="mt-6 h-12 rounded-full bg-zinc-950 px-6 text-sm font-black text-white"
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
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-950" />
        <div className="mt-5 whitespace-pre-line text-lg font-black tracking-[-0.03em] text-slate-950">
          {message}
        </div>
      </div>
    </div>
  );
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

function buildSmsCodeProfile(phone) {
  return {
    verified: true,
    method: PROPOSAL_SMS_SESSION_METHOD,
    phone: normalizePhone(phone),
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
  const [loadingData, setLoadingData] = useState(false);

  const [responseStatus, setResponseStatus] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);
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
          result = await loadApplicationByVerifiedPhone(profile.phone);
        }

        if (!result?.viewerApplication) {
          resetDashboardState();
          setIdentityError("신청내역이 없습니다.");
          return;
        }

        setVerifiedProfile(profile);
        writeStoredSession(profile);
        applyDashboardResult(result);
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

        setVerifiedProfile(profile);
        writeStoredSession(profile);
        applyDashboardResult(result);
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

      const profile = buildSmsCodeProfile(phoneNormalized);
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
    } catch (error) {
      console.error("[TwoWeeksProposal] response save error:", error);
      alert(error?.message || "응답 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingResponse(false);
    }
  };

  const DashboardComponent = ProposalDashboard;

  return (
    <div className="min-h-screen bg-black">
      <ProposalHeader />

      {!bootstrapped ? (
        <div className="flex min-h-[calc(100svh-80px)] items-center justify-center px-5 text-white">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <div className="mt-5 text-sm font-bold text-white/70">불러오는 중입니다.</div>
          </div>
        </div>
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
            loading={loadingData}
            responseStatus={responseStatus}
            savingResponse={savingResponse}
            savingProfile={savingProfile}
            profileUploadProgress={profileUploadProgress}
            onRespond={handleRespond}
            onSaveProfile={handleSaveProfile}
            onResetIdentity={handleResetIdentity}
            onReload={handleReload}
          />
        </DashboardErrorBoundary>
      ) : (
        <main className="min-h-[calc(100svh-64px)] bg-[#f6f3ef] px-5 py-8 md:min-h-[calc(100svh-80px)] md:px-8">
          <div className="mx-auto w-full max-w-3xl rounded-[32px] border border-zinc-200 bg-white p-8 text-center">
            <h1 className="text-2xl font-black tracking-[-0.04em] text-zinc-950">
              화면을 불러오지 못했습니다.
            </h1>
            <button
              type="button"
              onClick={handleResetIdentity}
              className="mt-6 h-12 rounded-full bg-zinc-950 px-6 text-sm font-black text-white"
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

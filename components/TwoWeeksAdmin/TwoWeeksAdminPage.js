import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "firebaseConfig";
import { isAllowedAdminUid } from "utils/firebaseAdmin";
import AdminHeader from "./AdminHeader";
import ApplicationsTab from "./ApplicationsTab";
import FilterBar from "./FilterBar";
import MatchingTab from "./MatchingTab";
import OverviewTab from "./OverviewTab";
import ResultsTab from "./ResultsTab";
import ReviewTab from "./ReviewTab";
import RoundManagementTab from "./RoundManagementTab";
import ScheduleTab from "./ScheduleTab";
import CafeManagementTab from "./CafeManagementTab";
import DepositManagementTab from "./DepositManagementTab";
import MarketingStoriesTab from "./MarketingStoriesTab";
import MarketingAttributionTab from "./MarketingAttributionTab";
import HomeContentManagementTab from "./HomeContentManagementTab";
import ReferralRewardsTab from "./ReferralRewardsTab";
import LoadingSpinner from "../TwoWeeksShared/LoadingSpinner";
import { TWOWEEKS_MIN_PROFILE_PHOTOS } from "../TwoWeeksShared/profilePhotoPolicy";
import {
  formatWon,
  getDepositRequiredBalance,
  isDepositWaived,
} from "../TwoWeeksShared/depositPolicy";
import {
  approveApplicationWithSms,
  approveApplicationsWithSms,
  approveApplicationsWithoutSms,
  completeApplicationWithSms,
  completeApplicationsWithSms,
  completeApplicationsWithoutSms,
  confirmDepositApplications,
  confirmMeetingSchedule,
  createBulkTwoWeeksMatches,
  prepareNextRoundApplication,
  resolveNoShowReview,
  sendInitialDepositReminderSms,
  sendDepositTopUpReminderSms,
  confirmDepositTopUp,
  completeDepositRefund,
  createDummyApplications,
  createTwoWeeksMatch,
  deleteDummyApplications,
  sendIncompleteApplicationSms,
  sendScheduleReminderSms,
  subscribeTwoWeeksAdminData,
  subscribeCafeCandidates,
  seedDefaultCafeCandidates,
  createCafeCandidate,
  updateCafeCandidate,
  deleteCafeCandidate,
  markAllCafeCandidatesNeedCheck,
  subscribeTwoWeeksRounds,
  seedDefaultTwoWeeksRound,
  createTwoWeeksRound,
  updateTwoWeeksRound,
  updateTwoWeeksApplication,
  updateTwoWeeksAdminMatchingMeta,
  subscribeTwoWeeksMarketingStories,
  moderateTwoWeeksMarketingContent,
  manageMemberSanction,
  getMemberSanctionHistory,
} from "./adminService";
import {
  getAdvisoryMatchingConflicts,
  getBasic,
  getNoResponseReviewState,
  getRoundId,
  getSearchText,
  hasPenaltyRecord,
  hasMatchingEligibleProfilePhotos,
  isIdentityVerifiedApplication,
} from "./utils";

// Isolate tab render crashes so other admin tools remain accessible.
// Errors are logged and shown, never silently swallowed.
class AdminTabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    console.error("[TwoWeeksAdmin] Tab rendering failed:", this.props.tab, error, info?.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="rounded-xl border border-solid border-rose-300 bg-white p-5">
        <h2 className="text-lg font-black text-rose-800">이 관리 메뉴를 표시하는 중 오류가 발생했어요.</h2>
        <p className="mt-2 break-keep text-sm text-zinc-700">다른 관리자 메뉴는 계속 이용할 수 있습니다. 콘솔 오류를 확인해주세요.</p>
        <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md bg-rose-50 p-3 text-xs text-rose-800">{String(this.state.error?.message || "알 수 없는 오류")}</pre>
        <button type="button" onClick={() => this.setState({ error: null })} className="mt-4 rounded-lg border border-solid border-zinc-300 bg-white px-4 py-2 text-sm font-bold text-zinc-800 hover:bg-zinc-50">화면 다시 시도</button>
      </div>
    );
  }
}

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1eb] px-5">
      <div className="border border-zinc-200 bg-white px-7 py-6">
        <LoadingSpinner size="lg" tone="dark" className="mx-auto" />
      </div>
    </div>
  );
}

function AdminAccessDenied({ firebaseUser }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f1eb] px-5">
      <div className="w-full max-w-xl border border-rose-200 bg-white p-6">
        <h1 className="text-2xl font-black tracking-[-0.04em] text-zinc-950">접근 권한이 없습니다.</h1>
        <p className="mt-3 break-keep text-sm leading-6 text-zinc-500">
          adminConfig/access 문서의 allowedUids 또는 superAdmins에 현재 계정 UID를 추가해주세요.
        </p>
        <div className="mt-4 bg-zinc-50 p-3 text-xs font-semibold text-zinc-500">
          현재 UID: {firebaseUser?.uid || "로그인 필요"}
        </div>
      </div>
    </div>
  );
}


function summarizeMatchSmsResults(results = []) {
  const list = Array.isArray(results) ? results : [results];
  const flat = [];

  list.forEach((item) => {
    if (item?.smsResults?.male) flat.push(item.smsResults.male);
    if (item?.smsResults?.female) flat.push(item.smsResults.female);
  });

  return {
    sent: flat.filter((item) => item?.status === "sent").length,
    failed: flat.filter((item) => item?.status === "failed").length,
    skipped: flat.filter((item) => item?.status === "skipped").length,
  };
}

export default function TwoWeeksAdminPage() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [adminStreamError, setAdminStreamError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [applications, setApplications] = useState([]);
  const [responses, setResponses] = useState([]);
  const [declineReasons, setDeclineReasons] = useState([]);
  const [matches, setMatches] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [managedRounds, setManagedRounds] = useState([]);
  const [marketingReviews, setMarketingReviews] = useState([]);
  const [successStories, setSuccessStories] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [roundFilter, setRoundFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [operationFilter, setOperationFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [creatingDummy, setCreatingDummy] = useState(false);
  const [deletingDummy, setDeletingDummy] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user || null);

      if (!user?.uid) {
        setIsAdmin(false);
        return;
      }

      try {
        const accessSnap = await getDoc(doc(db, "adminConfig", "access"));
        const accessData = accessSnap.data() || {};
        const allowedUids = Array.isArray(accessData.allowedUids) ? accessData.allowedUids : [];
        const superAdmins = Array.isArray(accessData.superAdmins) ? accessData.superAdmins : [];

        setIsAdmin(
          isAllowedAdminUid(user.uid) ||
            allowedUids.includes(user.uid) ||
            superAdmins.includes(user.uid)
        );
      } catch (error) {
        console.error("[TwoWeeksAdmin] access load error:", error);
        setIsAdmin(isAllowedAdminUid(user.uid));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;

    return subscribeTwoWeeksAdminData({
      onApplications: setApplications,
      onResponses: setResponses,
      onMatches: setMatches,
      onDeclineReasons: setDeclineReasons,
      onError: setAdminStreamError,
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    return subscribeCafeCandidates(setCafes);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    return subscribeTwoWeeksRounds(setManagedRounds);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    return subscribeTwoWeeksMarketingStories({
      onReviews: setMarketingReviews,
      onStories: setSuccessStories,
    });
  }, [isAdmin]);

  const rounds = useMemo(() => {
    const applicationRoundIds = applications.map((item) => getRoundId(item)).filter(Boolean);
    const managedRoundIds = managedRounds.map((item) => item.id).filter(Boolean);
    return Array.from(new Set([...managedRoundIds, ...applicationRoundIds])).sort();
  }, [applications, managedRounds]);



  const handleSendScheduleReminder = async (match) => {
    if (!match?.id) return;

    if (!confirm("일정 선택 리마인드 문자를 발송할까요?")) return;

    setBusyId(`scheduleReminder:${match.id}`);

    try {
      const results = await sendScheduleReminderSms({
        match,
        adminUid: firebaseUser?.uid || "",
      });

      const sent = results.filter((item) => item.status === "sent").length;
      const failed = results.filter((item) => item.status === "failed").length;
      const skipped = results.filter((item) => item.status === "skipped").length;

      alert(`리마인드 문자 발송 ${sent}건 / 실패 ${failed}건 / 제외 ${skipped}건`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] schedule reminder error:", error);
      alert(error?.message || "리마인드 문자 발송 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmSchedule = async (match, place) => {
    if (!match?.id) return;

    const placeName = String(place?.placeName || "").trim();
    if (!placeName) {
      alert("장소명을 입력해주세요.");
      return;
    }

    if (!confirm("일정·장소를 확정하고 안내문자를 발송할까요?")) return;

    setBusyId(`confirmSchedule:${match.id}`);

    try {
      const result = await confirmMeetingSchedule({
        match,
        place,
        adminUid: firebaseUser?.uid || "",
      });

      const smsList = [result?.smsResults?.male, result?.smsResults?.female].filter(Boolean);
      const sent = smsList.filter((item) => item.status === "sent").length;
      const failed = smsList.filter((item) => item.status === "failed").length;
      const skipped = smsList.filter((item) => item.status === "skipped").length;

      alert(`일정·장소를 확정했습니다. 문자 발송 ${sent}건 / 실패 ${failed}건 / 제외 ${skipped}건`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] confirm schedule error:", error);
      alert(error?.message || "일정·장소 확정 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handlePrepareNextRound = async ({ match, applicationId, mode = "ready" }) => {
    if (!match?.id || !applicationId) return;

    const message =
      mode === "ready"
        ? "해당 회원을 매칭 가능 상태로 전환할까요? 기존 제안/일정 정보는 초기화됩니다."
        : "해당 회원의 매칭을 일시정지할까요? 다시 재개하기 전까지 매칭풀에서 제외됩니다.";

    if (!confirm(message)) return;

    setBusyId(`nextRound:${match.id}:${applicationId}:${mode}`);

    try {
      await prepareNextRoundApplication({
        applicationId,
        match,
        mode,
        adminUid: firebaseUser?.uid || "",
      });

      alert(mode === "ready" ? "매칭 가능 상태로 전환했습니다." : "매칭 일시정지 상태로 처리했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] next round action error:", error);
      alert(error?.message || "매칭 상태 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleResolveNoShow = async ({ match, reporterApplicationId, accusedApplicationId, status }) => {
    if (!match?.id || !reporterApplicationId) return;

    const memo = prompt("관리자 처리 메모를 남겨주세요. 고객에게 직접 공개되지는 않습니다.", "");
    if (memo === null) return;

    const penaltyApplicationId = status === "self_no_show_confirmed"
      ? reporterApplicationId
      : accusedApplicationId || reporterApplicationId;
    const penaltyApplication = applications.find((item) => item.id === penaltyApplicationId);
    const penaltyDepositAmount = getDepositRequiredBalance(penaltyApplication?.deposit || {});
    const penaltyDepositWaived = isDepositWaived(penaltyApplication?.deposit || {});
    const messageMap = {
      no_show_confirmed: penaltyDepositWaived
        ? "노쇼로 확정할까요? 예치금 차감은 없고 다음 1회차 매칭 제한이 적용됩니다."
        : `노쇼로 확정할까요? 대상 회원에게 설정된 예치금 ${formatWon(penaltyDepositAmount)}이 전액 차감되고, 다음 매칭 전 같은 금액의 추가 예치가 필요 상태로 전환됩니다.`,
      self_no_show_confirmed: penaltyDepositWaived
        ? "본인 불참으로 확정할까요? 예치금 차감은 없고 다음 1회차 매칭 제한이 적용됩니다."
        : `본인 불참으로 확정할까요? 설정된 예치금 ${formatWon(penaltyDepositAmount)}이 전액 차감되고, 다음 매칭 전 같은 금액의 추가 예치가 필요 상태로 전환됩니다.`,
      evidence_requested: "추가 확인 필요 상태로 표시할까요?",
      no_show_dismissed: "노쇼 아님으로 기각 처리할까요?",
      no_penalty_rematch: "신고자를 불이익 없이 재매칭 가능 상태로 전환할까요?",
    };

    if (!confirm(messageMap[status] || "노쇼/불참 검토 상태를 저장할까요?")) return;

    const isConfirmedNoShow = status === "no_show_confirmed" || status === "self_no_show_confirmed";
    const requireDepositAfterNoShow = isConfirmedNoShow && penaltyDepositWaived
      ? confirm("이 면제회원을 다음 이용부터 예치금 필수회원으로 전환할까요?\n취소하면 면제 상태는 유지하고 계정 제재만 적용합니다.")
      : false;

    setBusyId(`noShow:${match.id}:${reporterApplicationId}:${status}`);

    try {
      await resolveNoShowReview({
        match,
        reporterApplicationId,
        accusedApplicationId,
        status,
        memo,
        adminUid: firebaseUser?.uid || "",
        requireDepositAfterNoShow,
      });

      alert(isConfirmedNoShow
        ? penaltyDepositWaived
          ? `노쇼/불참 제재를 저장했습니다.${requireDepositAfterNoShow ? " 예치금 필수회원으로 전환했습니다." : " 예치금 면제는 유지됩니다."}`
          : "노쇼/불참 확정 처리와 예치금 차감·추가 예치 안내를 저장했습니다."
        : "노쇼/불참 검토 상태를 저장했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] no-show review error:", error);
      alert(error?.message || "노쇼/불참 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleManageSanction = async (payload = {}) => {
    if (!payload.applicationId) return null;
    setBusyId(`sanction:${payload.applicationId}`);
    try {
      return await manageMemberSanction(payload);
    } finally {
      setBusyId("");
    }
  };

  const handleSendDepositTopUpReminder = async (application) => {
    if (!application?.id) return;
    if (!confirm("다음 매칭 전 추가 예치 안내 문자를 발송할까요?")) return;

    setBusyId(application.id);
    try {
      const result = await sendDepositTopUpReminderSms(application, firebaseUser?.uid || "");
      const statusText = result?.sms?.status === "sent" ? "문자를 발송했습니다." : "문자 발송 상태를 확인해주세요.";
      alert(`추가 예치 ${Number(result?.requiredAmount || 0).toLocaleString()}원 안내를 저장했습니다. ${statusText}`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] top-up reminder error:", error);
      alert(error?.message || "추가 예치 안내 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleSendInitialDepositReminder = async (application) => {
    if (!application?.id) return;
    const requiredBalance = getDepositRequiredBalance(application?.deposit || {});
    if (!confirm(`프로필 승인 완료 회원에게 예치금 ${formatWon(requiredBalance)} 입금 재안내 문자를 발송할까요?`)) return;

    setBusyId(application.id);
    try {
      const result = await sendInitialDepositReminderSms(application, firebaseUser?.uid || "");
      if (result?.sms?.status === "sent") {
        alert(`예치금 재안내 문자를 발송했습니다. 누적 발송 ${Number(result?.reminderCount || 0)}회`);
      } else {
        alert(`문자가 발송되지 않았습니다. 상태: ${result?.sms?.reason || result?.sms?.errorMessage || "확인 필요"}`);
      }
    } catch (error) {
      console.error("[TwoWeeksAdmin] initial deposit reminder error:", error);
      alert(error?.message || "예치금 재안내 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleConfirmDepositTopUp = async (application) => {
    if (!application?.id) return;
    if (!confirm("추가 예치금 입금을 확인하고 다음 매칭 가능 상태로 전환할까요?")) return;

    setBusyId(application.id);
    try {
      const result = await confirmDepositTopUp(application, firebaseUser?.uid || "");
      alert(`추가 예치 ${Number(result?.requiredAmount || 0).toLocaleString()}원 확인 완료. 다음 매칭 참여 가능 상태로 전환했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] top-up confirm error:", error);
      alert(error?.message || "추가 예치금 확인 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleCompleteDepositRefund = async (application) => {
    if (!application?.id) return;

    const request = application?.deposit?.refundRequest || {};
    const amount = Number(request.requestedAmount || application?.deposit?.balance || 0);
    const bankLine = [request.bankName, request.accountNumber, request.accountHolder].filter(Boolean).join(" / ");

    if (!confirm(`실제 계좌 송금을 완료했나요?\n\n반환액: ${amount.toLocaleString()}원\n계좌: ${bankLine || "계좌정보 확인 필요"}\n\n확인 후 예치금 잔액이 0원으로 처리되고 고객에게 완료 문자가 발송됩니다.`)) return;

    setBusyId(`depositRefund:${application.id}`);
    try {
      const result = await completeDepositRefund(application);
      const statusText = result?.smsStatus === "sent" ? "고객에게 완료 문자도 발송했습니다." : "완료 문자 발송 상태는 신청자 상세에서 확인해주세요.";
      alert(`예치금 ${Number(result?.refundAmount || amount).toLocaleString()}원 반환 완료로 처리했습니다. ${statusText}`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] deposit refund complete error:", error);
      alert(error?.message || "예치금 반환 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleSeedDefaultRound = async () => {
    if (!confirm("기본 회차 문서를 생성/갱신할까요?")) return;
    setBusyId("seedRound");

    try {
      await seedDefaultTwoWeeksRound(firebaseUser?.uid || "");
      alert("기본 회차를 생성/갱신했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] seed round error:", error);
      alert(error?.message || "기본 회차 생성 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleCreateRound = async (payload) => {
    setBusyId("createRound");

    try {
      await createTwoWeeksRound({ payload, adminUid: firebaseUser?.uid || "" });
      alert("회차를 생성했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] create round error:", error);
      alert(error?.message || "회차 생성 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleUpdateRound = async (roundId, patch) => {
    if (!roundId || !patch) return;
    setBusyId(`round:${roundId}:${patch.status || "update"}`);

    try {
      await updateTwoWeeksRound(roundId, patch, firebaseUser?.uid || "");
    } catch (error) {
      console.error("[TwoWeeksAdmin] update round error:", error);
      alert(error?.message || "회차 수정 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const filteredApplications = useMemo(() => {
    const lowered = keyword.trim().toLowerCase();

    return applications.filter((item) => {
      const basic = getBasic(item);

      if (roundFilter !== "all" && getRoundId(item) !== roundFilter) return false;
      if (genderFilter !== "all" && basic.gender !== genderFilter) return false;
      if (reviewFilter !== "all" && String(item.reviewStatus || "pending") !== reviewFilter) return false;
      if (operationFilter !== "all") {
        const operationState = getNoResponseReviewState(item);
        if (operationFilter === "no_response_review" && !operationState.isCurrentAdminReview) return false;
        if (operationFilter === "other_paused" && (!operationState.isCurrentlyPaused || operationState.isCurrentAdminReview)) return false;
        if (operationFilter === "pool_ready" && !(item.matchingStatus === "not_started" && item.nextRoundStatus === "ready")) return false;
        if (operationFilter === "penalty_history" && (!hasPenaltyRecord(item) || operationState.isCurrentAdminReview)) return false;
      }
      if (lowered && !getSearchText(item).includes(lowered)) return false;

      return true;
    });
  }, [applications, genderFilter, keyword, operationFilter, reviewFilter, roundFilter]);

  const handleUpdateApplication = async (applicationId, patch) => {
    if (!applicationId || !patch) return false;

    const targetApplication = applications.find((item) => item.id === applicationId);
    const requiresIdentity =
      patch.reviewStatus === "approved" ||
      patch.status === "approved" ||
      ["confirmed", "waived"].includes(patch["deposit.status"]) ||
      patch["deposit.participationEligible"] === true;

    if (requiresIdentity && !isIdentityVerifiedApplication(targetApplication || {})) {
      alert("본인인증이 완료되지 않은 회원은 승인 또는 예치금 확인 처리할 수 없습니다.");
      return false;
    }

    const requiresProfilePhotos =
      patch.reviewStatus === "approved" ||
      patch.status === "approved" ||
      ["not_started", "proposed", "confirmed"].includes(patch.matchingStatus);
    if (requiresProfilePhotos && !hasMatchingEligibleProfilePhotos(targetApplication || {})) {
      alert(`프로필 사진이 최소 ${TWOWEEKS_MIN_PROFILE_PHOTOS}장 등록되어야 승인·매칭 처리할 수 있습니다. 기존 승인 1~2장 회원은 예외입니다.`);
      return false;
    }

    setBusyId(applicationId);

    try {
      let auditedPatch = patch["penaltyStats.lastAdminDecision"]
        ? { ...patch, "penaltyStats.lastAdminDecisionByUid": firebaseUser?.uid || "" }
        : { ...patch };
      if (patch["profileReview.status"] || patch["verificationReview.status"]) {
        auditedPatch = {
          ...auditedPatch,
          "profileReview.reviewedByUid": firebaseUser?.uid || "",
          "verificationReview.reviewedByUid": firebaseUser?.uid || "",
        };
      }

      // 최초 예치금 단건 확인도 일괄 확인과 동일한 서비스 경로를 사용해
      // 잔액·누적 입금액·히스토리·처리자 기록과 매칭대기 전환을 빠짐없이 맞춘다.
      if (["confirmed", "waived"].includes(auditedPatch["deposit.status"]) && targetApplication) {
        const amountOverride = auditedPatch["deposit.requiredBalance"] ?? auditedPatch["deposit.balance"] ?? null;
        await confirmDepositApplications([targetApplication], firebaseUser?.uid || "", amountOverride);
      } else {
        await updateTwoWeeksApplication(applicationId, auditedPatch);
      }
      return true;
    } catch (error) {
      console.error("[TwoWeeksAdmin] update application error:", error);
      alert(error?.message || "저장 중 오류가 발생했습니다.");
      return false;
    } finally {
      setBusyId("");
    }
  };

  const handleApproveWithSms = async (application, depositAmount = null) => {
    if (!application?.id) return;

    setBusyId(application.id);

    try {
      await approveApplicationWithSms(application, firebaseUser?.uid || "", depositAmount);
      alert("승인 처리와 문자 발송을 완료했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] approve sms error:", error);
      alert(error?.message || "승인 문자 발송 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };


  const handleCompleteWithSms = async (application, depositAmount = null) => {
    if (!application?.id) return;
    const requiredBalance = depositAmount ?? getDepositRequiredBalance(application?.deposit || {});
    const confirmationText = requiredBalance === 0
      ? "예치금 면제와 프로필 검토가 모두 완료된 신청자로 처리하고 신청 완료 문자를 발송할까요?"
      : `예치금 ${formatWon(requiredBalance)} 입금 확인과 프로필 검토가 모두 완료된 신청자로 처리하고 신청 완료 문자를 발송할까요?`;
    if (!confirm(confirmationText)) return;

    setBusyId(application.id);

    try {
      const result = await completeApplicationWithSms(application, firebaseUser?.uid || "", depositAmount);

      if (result?.skipped) {
        alert("이미 신청완료 처리된 회원입니다. 신청완료 문자는 다시 발송하지 않았습니다.");
        return;
      }

      alert("신청 완료 처리와 문자 발송을 완료했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] complete sms error:", error);
      alert(error?.message || "신청 완료 문자 발송 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const buildBulkCompletionMessage = (result = {}, { withSms = true } = {}) => {
    const completedCount = result?.completed?.length || 0;
    const skipped = Array.isArray(result?.skipped) ? result.skipped : [];
    const failed = Array.isArray(result?.failed) ? result.failed : [];
    const reasonCounts = skipped.reduce((acc, item) => {
      const reason = item?.reason || "처리 제외";
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    const lines = [
      withSms
        ? `${completedCount}명 신청완료 처리와 문자 발송을 완료했습니다.`
        : `${completedCount}명 신청완료 처리했습니다.`,
    ];

    const skippedCount = skipped.length;
    if (skippedCount) {
      lines.push(`처리 제외 ${skippedCount}명`);
      Object.entries(reasonCounts).forEach(([reason, count]) => {
        lines.push(`- ${reason}: ${count}명`);
      });
    }

    if (failed.length) {
      lines.push(`오류 ${failed.length}명`);
      failed.slice(0, 5).forEach((item) => {
        lines.push(`- ${item?.name || item?.applicationId || "신청자"}: ${item?.reason || "처리 실패"}`);
      });
    }

    return lines.join("\n");
  };

  const handleBulkCompleteWithSms = async (selectedApplications = []) => {
    if (!selectedApplications.length) return;
    if (!confirm(`${selectedApplications.length}명을 신청완료 처리하고 문자를 발송할까요? 본인인증과 프로필 검토가 끝난 신청자만 처리됩니다.`)) return;

    setBusyId("bulkComplete");

    try {
      const result = await completeApplicationsWithSms(selectedApplications, firebaseUser?.uid || "");
      alert(buildBulkCompletionMessage(result, { withSms: true }));
    } catch (error) {
      console.error("[TwoWeeksAdmin] bulk complete sms error:", error);
      alert(error?.message || "일괄 신청 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleBulkCompleteWithoutSms = async (selectedApplications = []) => {
    if (!selectedApplications.length) return;
    if (!confirm(`${selectedApplications.length}명을 문자 없이 신청완료 처리할까요? 테스트용으로만 사용해주세요.`)) return;

    setBusyId("bulkCompleteNoSms");

    try {
      const result = await completeApplicationsWithoutSms(selectedApplications, firebaseUser?.uid || "");
      alert(buildBulkCompletionMessage(result, { withSms: false }));
    } catch (error) {
      console.error("[TwoWeeksAdmin] bulk complete no sms error:", error);
      alert(error?.message || "문자 없는 신청 완료 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleBulkApproveWithSms = async (selectedApplications = []) => {
    if (!selectedApplications.length) return;
    if (!confirm(`${selectedApplications.length}명을 승인하고 예치금 안내 문자를 발송할까요?`)) return;

    setBusyId("bulkApprove");

    try {
      const result = await approveApplicationsWithSms(selectedApplications, firebaseUser?.uid || "");
      alert(`${result.length}명 승인 처리와 문자 발송을 완료했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] bulk approve sms error:", error);
      alert(error?.message || "일괄 승인 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleBulkApproveWithoutSms = async (selectedApplications = []) => {
    if (!selectedApplications.length) return;
    if (!confirm(`${selectedApplications.length}명을 문자 없이 테스트 승인 처리할까요?`)) return;

    setBusyId("bulkApproveNoSms");

    try {
      const result = await approveApplicationsWithoutSms(selectedApplications, firebaseUser?.uid || "");
      alert(`${result.length}명 테스트 승인 처리했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] bulk approve no sms error:", error);
      alert(error?.message || "문자 없는 일괄 승인 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleBulkConfirmDeposit = async (selectedApplications = []) => {
    if (!selectedApplications.length) return;
    if (!confirm(`${selectedApplications.length}명을 입금확인 처리할까요?`)) return;

    setBusyId("bulkDeposit");

    try {
      const count = await confirmDepositApplications(selectedApplications, firebaseUser?.uid || "");
      alert(`${count}명 입금확인 처리했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] bulk deposit error:", error);
      alert(error?.message || "입금확인 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleSendIncompleteSms = async (application, reasonText) => {
    if (!application?.id) return;

    setBusyId(application.id);

    try {
      await sendIncompleteApplicationSms(application, reasonText, firebaseUser?.uid || "");
      alert("정보 보완 문자를 발송했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] incomplete sms error:", error);
      alert(error?.message || "보완 문자 발송 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleUpdateAdminMatchingMeta = async (applicationId, payload) => {
    return updateTwoWeeksAdminMatchingMeta(applicationId, payload, firebaseUser?.uid || "");
  };

  const handleCreateMatch = async (male, female, score) => {
    const compatibilityConflicts = getAdvisoryMatchingConflicts(score);
    const acknowledgedConflictCodes = compatibilityConflicts.map((item) => item.code).filter(Boolean);

    if (compatibilityConflicts.length) {
      const conflictLabels = compatibilityConflicts.map((item) => `• ${item.label}`).join("\n");
      const confirmed = window.confirm(
        `핵심 조건 충돌이 있습니다.\n\n${conflictLabels}\n\n충돌 내용을 확인했습니다. 그래도 후보 제안을 저장하고 양쪽에 문자를 발송할까요?`
      );

      if (!confirmed) return;
    }

    setBusyId("match");

    try {
      const result = await createTwoWeeksMatch({
        male,
        female,
        acknowledgedConflictCodes,
        adminUid: firebaseUser?.uid || "",
      });

      const sms = summarizeMatchSmsResults(result);
      const conflictNotice = compatibilityConflicts.length ? ` 핵심 조건 충돌 ${compatibilityConflicts.length}건을 확인했습니다.` : "";
      alert(`후보 제안을 저장했습니다.${conflictNotice} 문자 발송 ${sms.sent}건${sms.failed ? ` / 실패 ${sms.failed}건` : ""}${sms.skipped ? ` / 건너뜀 ${sms.skipped}건` : ""}`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] create match error:", error);
      alert(error?.message || "매칭 저장 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleBulkCreateMatches = async (pairs) => {
    if (!pairs?.length) return;
    if (!confirm(`${pairs.length}쌍을 고득점 순으로 일괄 매칭할까요?`)) return;

    setBusyId("bulkMatch");

    try {
      const result = await createBulkTwoWeeksMatches({
        pairs,
        adminUid: firebaseUser?.uid || "",
      });

      const sms = summarizeMatchSmsResults(result);
      alert(`${result.length}쌍 매칭을 저장했습니다. 문자 발송 ${sms.sent}건${sms.failed ? ` / 실패 ${sms.failed}건` : ""}${sms.skipped ? ` / 건너뜀 ${sms.skipped}건` : ""}`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] bulk match error:", error);
      alert(error?.message || "일괄 매칭 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleCreateDummy = async () => {
    setCreatingDummy(true);

    try {
      await createDummyApplications({
        count: 5,
        existingCount: applications.length,
        adminUid: firebaseUser?.uid || "",
      });
    } catch (error) {
      console.error("[TwoWeeksAdmin] dummy create error:", error);
      alert(error?.message || "더미 신청자 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingDummy(false);
    }
  };

  const handleSeedDefaultCafes = async () => {
    if (!confirm("기본 카페 후보를 불러올까요? 이미 등록된 동일 지역/카페명은 건너뜁니다.")) return;

    setBusyId("cafe:seed");

    try {
      const result = await seedDefaultCafeCandidates(firebaseUser?.uid || "");
      alert(`기본 카페 후보 ${result?.created || 0}개를 추가했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] seed cafes error:", error);
      alert(error?.message || "기본 카페 후보 추가 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleCreateCafe = async (payload) => {
    setBusyId("cafe:create");

    try {
      await createCafeCandidate(payload, firebaseUser?.uid || "");
      alert("카페 후보를 추가했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] create cafe error:", error);
      alert(error?.message || "카페 후보 추가 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleUpdateCafe = async (cafeId, payload) => {
    setBusyId(`cafe:update:${cafeId}`);

    try {
      await updateCafeCandidate(cafeId, payload, firebaseUser?.uid || "");
    } catch (error) {
      console.error("[TwoWeeksAdmin] update cafe error:", error);
      alert(error?.message || "카페 후보 수정 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleDeleteCafe = async (cafeId) => {
    if (!confirm("이 카페 후보를 삭제할까요? 고객 화면에서 바로 제외됩니다.")) return;

    setBusyId(`cafe:delete:${cafeId}`);

    try {
      await deleteCafeCandidate(cafeId);
      alert("카페 후보를 삭제했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] delete cafe error:", error);
      alert(error?.message || "카페 후보 삭제 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleMarkAllCafeNeedCheck = async () => {
    if (!confirm("전체 카페 후보를 확인 필요 상태로 바꿀까요?")) return;

    setBusyId("cafe:needCheck");

    try {
      const result = await markAllCafeCandidatesNeedCheck(firebaseUser?.uid || "");
      alert(`${result?.count || 0}개 카페 후보를 확인 필요 상태로 변경했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] mark cafe need check error:", error);
      alert(error?.message || "전체 확인 필요 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleDeleteDummy = async () => {
    const dummyCount = applications.filter((item) => item.isDummy || item.source === "twoweeks_admin_dummy").length;

    if (!dummyCount) return;
    if (!confirm(`더미 신청자 ${dummyCount}명을 삭제할까요?`)) return;

    setDeletingDummy(true);

    try {
      const deletedCount = await deleteDummyApplications(applications);
      alert(`더미 신청자 ${deletedCount}명을 삭제했습니다.`);
    } catch (error) {
      console.error("[TwoWeeksAdmin] dummy delete error:", error);
      alert(error?.message || "더미데이터 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingDummy(false);
    }
  };

  const handleModerateMarketingContent = async ({ type, item, action, publicContent = "" }) => {
    if (!item?.id) return;
    const label = action === "publish" ? "익명 공개" : "공개 내리기";
    if (action === "publish" && String(publicContent).trim().length < 10) {
      return alert("공개용 문구를 10자 이상 입력해주세요.");
    }
    if (!confirm(`${label} 처리할까요?`)) return;
    setBusyId(`marketing:${type}:${item.id}`);
    try {
      await moderateTwoWeeksMarketingContent({ type, contentId: item.id, action, publicContent });
      alert(action === "publish" ? "익명 공개했습니다." : "공개를 내렸습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] marketing content moderation error:", error);
      alert(error?.message?.replace(/^FirebaseError:\s*/i, "") || "후기 처리 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  if (isAdmin === null) return <AdminLoading />;
  if (!isAdmin) return <AdminAccessDenied firebaseUser={firebaseUser} />;

  return (
    <div className="tw-admin min-h-screen bg-[#f4f1eb] text-zinc-950">
      <AdminHeader activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="mx-auto grid w-full max-w-[1440px] gap-4 px-3 py-4 sm:px-5 lg:px-8">
        {adminStreamError ? (
          <div role="alert" className="rounded-lg border border-solid border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>관리자 데이터 일부를 불러오지 못했어요.</strong>
            <span className="ml-2">{adminStreamError.source} · {adminStreamError.code}</span>
            <p className="mt-1 break-keep text-xs">목록이 비어 보여도 데이터가 삭제된 것은 아닐 수 있습니다. 접속 권한과 네트워크를 확인해주세요.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-2 rounded-md border border-solid border-amber-500 bg-white px-3 py-1.5 text-xs font-bold">다시 연결하기</button>
          </div>
        ) : null}
        <AdminTabErrorBoundary key={activeTab} tab={activeTab}>
        {activeTab !== "marketingAttribution" ? (
          <FilterBar
            keyword={keyword}
            setKeyword={setKeyword}
            roundFilter={roundFilter}
            setRoundFilter={setRoundFilter}
            genderFilter={genderFilter}
            setGenderFilter={setGenderFilter}
            reviewFilter={reviewFilter}
            setReviewFilter={setReviewFilter}
            operationFilter={operationFilter}
            setOperationFilter={setOperationFilter}
            rounds={rounds}
          />
        ) : null}

        {activeTab === "overview" ? (
          <OverviewTab
            applications={filteredApplications}
            responses={responses}
            matches={matches}
            onCreateDummy={handleCreateDummy}
            onDeleteDummy={handleDeleteDummy}
            creatingDummy={creatingDummy}
            deletingDummy={deletingDummy}
          />
        ) : null}

        {activeTab === "applications" ? (
          <ApplicationsTab
            applications={filteredApplications}
            selectedApplication={selectedApplication}
            setSelectedApplication={setSelectedApplication}
            onUpdate={handleUpdateApplication}
            onUpdateAdminMatchingMeta={handleUpdateAdminMatchingMeta}
            onApproveWithSms={handleApproveWithSms}
            onCompleteWithSms={handleCompleteWithSms}
            onSendIncompleteSms={handleSendIncompleteSms}
            onSendInitialDepositReminder={handleSendInitialDepositReminder}
            onSendDepositTopUpReminder={handleSendDepositTopUpReminder}
            onConfirmDepositTopUp={handleConfirmDepositTopUp}
            onCompleteDepositRefund={handleCompleteDepositRefund}
            onManageSanction={handleManageSanction}
            onLoadSanctionHistory={getMemberSanctionHistory}
            onBulkApproveWithSms={handleBulkApproveWithSms}
            onBulkApproveWithoutSms={handleBulkApproveWithoutSms}
            onBulkCompleteWithSms={handleBulkCompleteWithSms}
            onBulkCompleteWithoutSms={handleBulkCompleteWithoutSms}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "review" ? (
          <ReviewTab
            applications={filteredApplications}
            selectedApplication={selectedApplication}
            setSelectedApplication={setSelectedApplication}
            onUpdate={handleUpdateApplication}
            onUpdateAdminMatchingMeta={handleUpdateAdminMatchingMeta}
            onApproveWithSms={handleApproveWithSms}
            onCompleteWithSms={handleCompleteWithSms}
            onSendIncompleteSms={handleSendIncompleteSms}
            onSendInitialDepositReminder={handleSendInitialDepositReminder}
            onSendDepositTopUpReminder={handleSendDepositTopUpReminder}
            onConfirmDepositTopUp={handleConfirmDepositTopUp}
            onCompleteDepositRefund={handleCompleteDepositRefund}
            onManageSanction={handleManageSanction}
            onLoadSanctionHistory={getMemberSanctionHistory}
            onBulkConfirmDeposit={handleBulkConfirmDeposit}
            onBulkCompleteWithSms={handleBulkCompleteWithSms}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "matching" ? (
          <MatchingTab
            applications={filteredApplications}
            matches={matches}
            onCreateMatch={handleCreateMatch}
            onBulkCreateMatches={handleBulkCreateMatches}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "marketingAttribution" ? <MarketingAttributionTab /> : null}
        {activeTab === "homeContent" ? <HomeContentManagementTab /> : null}
        {activeTab === "referralRewards" ? <ReferralRewardsTab /> : null}

        {activeTab === "schedule" ? (
          <ScheduleTab
            matches={matches}
            onConfirmSchedule={handleConfirmSchedule}
            onSendReminder={handleSendScheduleReminder}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "results" ? (
          <ResultsTab
            applications={applications}
            responses={responses}
            declineReasons={declineReasons}
            matches={matches}
            onPrepareNextRound={handlePrepareNextRound}
            onResolveNoShow={handleResolveNoShow}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "marketingStories" ? (
          <MarketingStoriesTab
            reviews={marketingReviews}
            stories={successStories}
            onModerate={handleModerateMarketingContent}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "deposit" ? (
          <DepositManagementTab
            applications={applications}
            onSendInitialDepositReminder={handleSendInitialDepositReminder}
            onCompleteDepositRefund={handleCompleteDepositRefund}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "rounds" ? (
          <RoundManagementTab
            rounds={managedRounds}
            applications={applications}
            matches={matches}
            onSeedDefaultRound={handleSeedDefaultRound}
            onCreateRound={handleCreateRound}
            onUpdateRound={handleUpdateRound}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "cafes" ? (
          <CafeManagementTab
            cafes={cafes}
            onSeedDefaultCafes={handleSeedDefaultCafes}
            onCreateCafe={handleCreateCafe}
            onUpdateCafe={handleUpdateCafe}
            onDeleteCafe={handleDeleteCafe}
            onMarkAllNeedCheck={handleMarkAllCafeNeedCheck}
            busyId={busyId}
          />
        ) : null}
        </AdminTabErrorBoundary>
      </main>
      <style jsx global>{`
        .tw-admin :is(input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea) {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background-color: #fff;
        }
        .tw-admin :is(input, select, textarea):focus-visible { outline: 2px solid #60a5fa; outline-offset: 1px; }
        .tw-admin button[class*="bg-white"],
        .tw-admin button[class*="bg-zinc-100"],
        .tw-admin button[class*="bg-zinc-50"] {
          border-width: 1px;
          border-style: solid;
          border-color: #cbd5e1;
        }
        .tw-admin :is(table th, table td) { border-bottom: 1px solid #e2e8f0; }
        .tw-admin table thead th { background-color: #f8fafc; }
      `}</style>
    </div>
  );
}

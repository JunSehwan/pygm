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
import ScheduleTab from "./ScheduleTab";
import LoadingSpinner from "../TwoWeeksShared/LoadingSpinner";
import {
  approveApplicationWithSms,
  approveApplicationsWithSms,
  approveApplicationsWithoutSms,
  confirmDepositApplications,
  confirmMeetingSchedule,
  createBulkTwoWeeksMatches,
  createDummyApplications,
  createTwoWeeksMatch,
  deleteDummyApplications,
  sendIncompleteApplicationSms,
  sendScheduleReminderSms,
  subscribeTwoWeeksAdminData,
  updateTwoWeeksApplication,
} from "./adminService";
import {
  getBasic,
  getRoundId,
  getSearchText,
} from "./utils";

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
  const [activeTab, setActiveTab] = useState("overview");

  const [applications, setApplications] = useState([]);
  const [responses, setResponses] = useState([]);
  const [matches, setMatches] = useState([]);

  const [keyword, setKeyword] = useState("");
  const [roundFilter, setRoundFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [reviewFilter, setReviewFilter] = useState("all");
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
    });
  }, [isAdmin]);

  const rounds = useMemo(() => {
    return Array.from(new Set(applications.map((item) => getRoundId(item)).filter(Boolean))).sort();
  }, [applications]);



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

    if (!confirm("일정·장소를 확정하고 사진 공개 및 안내문자를 발송할까요?")) return;

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

  const filteredApplications = useMemo(() => {
    const lowered = keyword.trim().toLowerCase();

    return applications.filter((item) => {
      const basic = getBasic(item);

      if (roundFilter !== "all" && getRoundId(item) !== roundFilter) return false;
      if (genderFilter !== "all" && basic.gender !== genderFilter) return false;
      if (reviewFilter !== "all" && String(item.reviewStatus || "pending") !== reviewFilter) return false;
      if (lowered && !getSearchText(item).includes(lowered)) return false;

      return true;
    });
  }, [applications, genderFilter, keyword, reviewFilter, roundFilter]);

  const handleUpdateApplication = async (applicationId, patch) => {
    if (!applicationId || !patch) return;

    setBusyId(applicationId);

    try {
      await updateTwoWeeksApplication(applicationId, patch);
    } catch (error) {
      console.error("[TwoWeeksAdmin] update application error:", error);
      alert(error?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setBusyId("");
    }
  };

  const handleApproveWithSms = async (application) => {
    if (!application?.id) return;

    setBusyId(application.id);

    try {
      await approveApplicationWithSms(application, firebaseUser?.uid || "");
      alert("승인 처리와 문자 발송을 완료했습니다.");
    } catch (error) {
      console.error("[TwoWeeksAdmin] approve sms error:", error);
      alert(error?.message || "승인 문자 발송 중 오류가 발생했습니다.");
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

  const handleCreateMatch = async (male, female, score) => {
    setBusyId("match");

    try {
      const result = await createTwoWeeksMatch({
        male,
        female,
        score,
        adminUid: firebaseUser?.uid || "",
      });

      const sms = summarizeMatchSmsResults(result);
      alert(`후보 제안을 저장했습니다. 문자 발송 ${sms.sent}건${sms.failed ? ` / 실패 ${sms.failed}건` : ""}${sms.skipped ? ` / 건너뜀 ${sms.skipped}건` : ""}`);
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

  if (isAdmin === null) return <AdminLoading />;
  if (!isAdmin) return <AdminAccessDenied firebaseUser={firebaseUser} />;

  return (
    <div className="min-h-screen bg-[#f4f1eb] text-zinc-950">
      <AdminHeader activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="mx-auto grid w-full max-w-[1440px] gap-4 px-3 py-4 sm:px-5 lg:px-8">
        <FilterBar
          keyword={keyword}
          setKeyword={setKeyword}
          roundFilter={roundFilter}
          setRoundFilter={setRoundFilter}
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          reviewFilter={reviewFilter}
          setReviewFilter={setReviewFilter}
          rounds={rounds}
        />

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
            onApproveWithSms={handleApproveWithSms}
            onSendIncompleteSms={handleSendIncompleteSms}
            onBulkApproveWithSms={handleBulkApproveWithSms}
            onBulkApproveWithoutSms={handleBulkApproveWithoutSms}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "review" ? (
          <ReviewTab
            applications={filteredApplications}
            selectedApplication={selectedApplication}
            setSelectedApplication={setSelectedApplication}
            onUpdate={handleUpdateApplication}
            onApproveWithSms={handleApproveWithSms}
            onSendIncompleteSms={handleSendIncompleteSms}
            onBulkConfirmDeposit={handleBulkConfirmDeposit}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "matching" ? (
          <MatchingTab
            applications={filteredApplications}
            onCreateMatch={handleCreateMatch}
            onBulkCreateMatches={handleBulkCreateMatches}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "schedule" ? (
          <ScheduleTab
            matches={matches}
            onConfirmSchedule={handleConfirmSchedule}
            onSendReminder={handleSendScheduleReminder}
            busyId={busyId}
          />
        ) : null}

        {activeTab === "results" ? (
          <ResultsTab applications={filteredApplications} responses={responses} matches={matches} />
        ) : null}
      </main>
    </div>
  );
}

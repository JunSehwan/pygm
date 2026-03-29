import React, { useEffect, useMemo, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
} from "firebase/firestore";
import { db, sendLms } from "firebaseConfig";
import AdminFrame from "./AdminFrame";
import AdminTabs from "./AdminTabs";
import UserDetailModal from "./UserDetailModal";
import AdminOverviewTab from "./adminTabs/AdminOverviewTab";
import UserApprovalTab from "./adminTabs/UserApprovalTab";
import CardApprovalTab from "./adminTabs/CardApprovalTab";
import ReportReviewTab from "./adminTabs/ReportReviewTab";
import PaymentTab from "./adminTabs/PaymentTab";
import MatchTab from "./adminTabs/MatchTab";
import {
  approveCard,
  approveUser,
  bulkApproveLegacyUsers,
  confirmPayment,
  getDisplayName,
  getUserApprovalState,
  getUserDocId,
  isPendingCard,
  normalizeQuestionType,
  rejectCard,
  resolveReportAction,
  saveGeneratedCards,
  toMillis,
} from "./adminUtils";
import { ActionButton } from "./AdminCommon";

function AdminAccessDenied() {
  return (
    <AdminFrame title="관리자 페이지" subtitle="접근 권한 확인">
      <section className="rounded-md border border-rose-200 bg-rose-50 px-4 py-4">
        <div className="text-[16px] font-bold text-rose-700">
          접근 권한이 없어요
        </div>
        <p className="mt-2 break-keep text-[13px] leading-5 text-rose-600">
          adminConfig/access 문서의 allowedUids 또는 superAdmins에
          현재 사용자 UID를 추가해주세요.
        </p>
      </section>
    </AdminFrame>
  );
}

export default function AdminDashboardPage() {
  const auth = getAuth();

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [arenaReports, setArenaReports] = useState([]);
  const [cardReports, setCardReports] = useState([]);
  const [payments, setPayments] = useState([]);
  const [matches, setMatches] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [busyUserId, setBusyUserId] = useState("");
  const [bulkApproving, setBulkApproving] = useState(false);
  const [busyApproveCardId, setBusyApproveCardId] = useState("");
  const [busyRejectCardId, setBusyRejectCardId] = useState("");
  const [generatedCards, setGeneratedCards] = useState([]);
  const [savingGeneratedCards, setSavingGeneratedCards] = useState(false);
  const [busyReportKey, setBusyReportKey] = useState("");
  const [busyPaymentId, setBusyPaymentId] = useState("");

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
        const allowedUids = Array.isArray(accessData.allowedUids)
          ? accessData.allowedUids
          : [];
        const superAdmins = Array.isArray(accessData.superAdmins)
          ? accessData.superAdmins
          : [];

        setIsAdmin(
          allowedUids.includes(user.uid) || superAdmins.includes(user.uid)
        );
      } catch (error) {
        console.error("[admin] access load error:", error);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubUsers = onSnapshot(
      query(collection(db, "users"), limit(200)),
      (snapshot) => {
        setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        console.error("[admin] users snapshot error:", error);
      }
    );

    const unsubCards = onSnapshot(
      query(collection(db, "charmingCards"), limit(200)),
      (snapshot) => {
        setCards(
          snapshot.docs.map((item) => {
            const data = item.data() || {};
            return {
              id: item.id,
              ...data,
              questionType: normalizeQuestionType(data.questionType),
            };
          })
        );
      },
      (error) => {
        console.error("[admin] cards snapshot error:", error);
      }
    );

    const unsubArenaReports = onSnapshot(
      query(collection(db, "arenaReports"), limit(200)),
      (snapshot) => {
        setArenaReports(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            sourceType: "arena",
          }))
        );
      },
      (error) => {
        console.error("[admin] arenaReports snapshot error:", error);
      }
    );

    const unsubCardReports = onSnapshot(
      query(collection(db, "charmingCardAnswerReports"), limit(200)),
      (snapshot) => {
        setCardReports(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
            sourceType: "card_answer",
          }))
        );
      },
      (error) => {
        console.error("[admin] charmingCardAnswerReports snapshot error:", error);
      }
    );

    const unsubPayments = onSnapshot(
      query(collection(db, "spoonDepositRequests"), limit(200)),
      (snapshot) => {
        setPayments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        console.error("[admin] spoonDepositRequests snapshot error:", error);
      }
    );

    const unsubMatches = onSnapshot(
      query(collection(db, "arenaMatches"), limit(200)),
      (snapshot) => {
        setMatches(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      },
      (error) => {
        console.error("[admin] arenaMatches snapshot error:", error);
      }
    );

    return () => {
      unsubUsers();
      unsubCards();
      unsubArenaReports();
      unsubCardReports();
      unsubPayments();
      unsubMatches();
    };
  }, [isAdmin]);

  const usersById = useMemo(() => {
    const next = {};
    users.forEach((item) => {
      const id = getUserDocId(item);
      if (id) next[id] = item;
    });
    return next;
  }, [users]);

  const pendingUsers = useMemo(() => {
    return [...users]
      .filter((item) => getUserApprovalState(item) === "pending")
      .sort(
        (a, b) =>
          toMillis(b.createdAt || b.updatedAt) -
          toMillis(a.createdAt || a.updatedAt)
      );
  }, [users]);

  const legacyUsers = useMemo(() => {
    return [...users]
      .filter((item) => getUserApprovalState(item) === "legacy")
      .sort(
        (a, b) =>
          toMillis(b.createdAt || b.updatedAt || b.timestamp) -
          toMillis(a.createdAt || a.updatedAt || a.timestamp)
      );
  }, [users]);

  const approvalTabUsers = useMemo(() => {
    return [...pendingUsers, ...legacyUsers].sort(
      (a, b) =>
        toMillis(b.createdAt || b.updatedAt || b.timestamp) -
        toMillis(a.createdAt || a.updatedAt || a.timestamp)
    );
  }, [pendingUsers, legacyUsers]);

  const pendingCards = useMemo(() => {
    return [...cards]
      .filter((item) => isPendingCard(item))
      .sort(
        (a, b) =>
          toMillis(b.createdAt || b.updatedAt) -
          toMillis(a.createdAt || a.updatedAt)
      );
  }, [cards]);

  const reportItems = useMemo(() => {
    return [...arenaReports, ...cardReports].sort(
      (a, b) =>
        toMillis(b.createdAt || b.updatedAt) -
        toMillis(a.createdAt || a.updatedAt)
    );
  }, [arenaReports, cardReports]);

  const pendingPayments = useMemo(() => {
    return [...payments]
      .filter((item) => ["requested", "paid"].includes(item?.status || "requested"))
      .sort(
        (a, b) =>
          toMillis(b.createdAt || b.updatedAt) -
          toMillis(a.createdAt || a.updatedAt)
      );
  }, [payments]);

  const successMatches = useMemo(() => {
    return [...matches]
      .filter(
        (item) =>
          item?.status === "matched" ||
          item?.status === "success" ||
          item?.status === "accepted"
      )
      .sort(
        (a, b) =>
          toMillis(b.createdAt || b.updatedAt) -
          toMillis(a.createdAt || a.updatedAt)
      );
  }, [matches]);

  const counts = useMemo(
    () => ({
      pendingUsers: pendingUsers.length,
      legacyUsers: legacyUsers.length,
      pendingCards: pendingCards.length,
      pendingReports: reportItems.length,
      pendingPayments: pendingPayments.length,
      successMatches: successMatches.length,
    }),
    [
      pendingUsers.length,
      legacyUsers.length,
      pendingCards.length,
      reportItems.length,
      pendingPayments.length,
      successMatches.length,
    ]
  );

  const subtitle = firebaseUser?.uid
    ? `관리자 UID: ${firebaseUser.uid}`
    : "관리자 확인 중";

  const handleApproveUser = async (item) => {
    try {
      setBusyUserId(getUserDocId(item));
      await approveUser({
        db,
        item,
        adminUid: firebaseUser?.uid || "",
        sendLms,
      });
      alert(`${getDisplayName(item)} 회원을 승인했어요.`);
      setSelectedUser(null);
    } catch (error) {
      console.error("[admin] approve user error:", error);
      alert("회원 승인 처리 중 문제가 발생했어요.");
    } finally {
      setBusyUserId("");
    }
  };

  const handleBulkApproveLegacy = async () => {
    try {
      setBulkApproving(true);
      const count = await bulkApproveLegacyUsers({
        db,
        users: legacyUsers,
        adminUid: firebaseUser?.uid || "",
      });
      alert(`기존 가입자 ${count}명을 일괄 승인했어요.`);
    } catch (error) {
      console.error("[admin] bulk approve legacy users error:", error);
      alert("기존 가입자 일괄 승인 중 문제가 발생했어요.");
    } finally {
      setBulkApproving(false);
    }
  };

  const handleApproveCard = async (card) => {
    try {
      setBusyApproveCardId(card.id);
      await approveCard({
        db,
        card,
        adminUid: firebaseUser?.uid || "",
        sendLms,
        creatorUser: usersById[card.creatorUid] || null,
      });
      alert("차밍카드를 승인했어요.");
    } catch (error) {
      console.error("[admin] approve card error:", error);
      alert("카드 승인 처리 중 문제가 발생했어요.");
    } finally {
      setBusyApproveCardId("");
    }
  };

  const handleRejectCard = async (card) => {
    try {
      setBusyRejectCardId(card.id);
      await rejectCard({
        db,
        card,
        adminUid: firebaseUser?.uid || "",
      });
      alert("차밍카드를 반려했어요.");
    } catch (error) {
      console.error("[admin] reject card error:", error);
      alert("카드 반려 처리 중 문제가 발생했어요.");
    } finally {
      setBusyRejectCardId("");
    }
  };

  const handleSaveGeneratedCards = async () => {
    try {
      setSavingGeneratedCards(true);
      await saveGeneratedCards({
        db,
        cards: generatedCards,
        adminUid: firebaseUser?.uid || "",
      });
      setGeneratedCards([]);
      alert("차밍카드 초안을 저장했어요.");
    } catch (error) {
      console.error("[admin] save generated cards error:", error);
      alert("차밍카드 저장 중 문제가 발생했어요.");
    } finally {
      setSavingGeneratedCards(false);
    }
  };

  const handleReportAction = async (item, action) => {
    try {
      setBusyReportKey(`${item.id}:${action}`);
      await resolveReportAction({
        db,
        report: item,
        adminUid: firebaseUser?.uid || "",
        action,
        users,
        sendLms,
      });
      alert("신고 처리 상태를 업데이트했어요.");
    } catch (error) {
      console.error("[admin] report action error:", error);
      alert("신고 처리 중 문제가 발생했어요.");
    } finally {
      setBusyReportKey("");
    }
  };

  const handleConfirmPayment = async (item) => {
    try {
      setBusyPaymentId(item.id);
      await confirmPayment({
        db,
        item,
        adminUid: firebaseUser?.uid || "",
        sendLms,
      });
      alert(`스푼 ${item.spoonAmount}개 충전과 문자 발송을 완료했어요.`);
    } catch (error) {
      console.error("[admin] confirm payment error:", error);
      alert("결제 확인 처리 중 문제가 발생했어요.");
    } finally {
      setBusyPaymentId("");
    }
  };

  const renderTab = () => {
    if (activeTab === "users") {
      return (
        <UserApprovalTab
          users={[...pendingUsers, ...legacyUsers]}
          onApproveUser={handleApproveUser}
          onBulkApproveLegacyUsers={handleBulkApproveLegacy}
          onOpenUserDetail={(item) => setSelectedUser(item)}
          approvingUserId={busyUserId}
          bulkApproving={bulkApproving}
        />
      );
    }

    if (activeTab === "cards") {
      return (
        <CardApprovalTab
          pendingCards={pendingCards}
          existingCards={cards}
          onApproveCard={handleApproveCard}
          onRejectCard={handleRejectCard}
          busyApproveCardId={busyApproveCardId}
          busyRejectCardId={busyRejectCardId}
          generatedCards={generatedCards}
          setGeneratedCards={setGeneratedCards}
          onSaveGeneratedCards={handleSaveGeneratedCards}
          savingGeneratedCards={savingGeneratedCards}
        />
      );
    }

    if (activeTab === "reports") {
      return (
        <ReportReviewTab
          reports={reportItems}
          onAction={handleReportAction}
          busyReportKey={busyReportKey}
        />
      );
    }

    if (activeTab === "payments") {
      return (
        <PaymentTab
          payments={pendingPayments}
          onConfirm={handleConfirmPayment}
          busyPaymentId={busyPaymentId}
        />
      );
    }

    if (activeTab === "matches") {
      return <MatchTab matches={successMatches} usersById={usersById} />;
    }

    return <AdminOverviewTab counts={counts} />;
  };

  if (isAdmin === false) {
    return <AdminAccessDenied />;
  }

  return (
    <>
      <AdminFrame
        title="관리자 페이지"
        subtitle={subtitle}
        rightSlot={
          activeTab !== "overview" ? (
            <ActionButton tone="bg" onClick={() => setActiveTab("overview")}>
              요약 보기
            </ActionButton>
          ) : null
        }
      >
        <AdminTabs activeTab={activeTab} onChange={setActiveTab} counts={counts} />
        {renderTab()}
      </AdminFrame>

      <UserDetailModal
        open={!!selectedUser}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onApprove={selectedUser ? () => handleApproveUser(selectedUser) : null}
        approving={busyUserId === getUserDocId(selectedUser || {})}
      />
    </>
  );
}
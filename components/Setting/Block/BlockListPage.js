import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  PiUsersThreeDuotone,
  PiBuildingOfficeDuotone,
  PiTrashDuotone,
  PiCheckCircleFill,
  PiShieldSlashDuotone,
} from "react-icons/pi";

import { auth, db } from "firebaseConfig";
import BlockPageFrame from "./BlockPageFrame";
import {
  formatCreatedAt,
  formatPhoneLast4,
  sortByCreatedAtDesc,
} from "./blockUtils";

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-[12px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-[20px] font-bold tracking-[-0.02em] text-slate-900">
        {value}
      </div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, count, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
          <Icon className="text-[20px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-slate-900">{title}</div>
          <div className="mt-1 text-[13px] text-slate-500">{count}개 등록됨</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">{children}</div>
    </section>
  );
}

function Row({ title, desc, dateText, onRemove }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-slate-900">{title}</div>
        {desc ? (
          <div className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
            {desc}
          </div>
        ) : null}
        {dateText ? (
          <div className="mt-1 text-[12px] text-slate-400">{dateText}</div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={{ cursor: "pointer" }}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        <PiTrashDuotone className="text-[15px]" />
        해제
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <PiShieldSlashDuotone className="text-[28px] text-slate-500" />
      </div>

      <div className="mt-4 text-[18px] font-bold tracking-[-0.02em] text-slate-900">
        등록된 항목이 없어요
      </div>

      <p className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
        지인 차단 화면에서
        <br />
        차단 대상을 추가해보세요.
      </p>

      <Link
        href="/setting/block"
        className="mx-auto mt-5 flex h-11 w-full max-w-[220px] items-center justify-center rounded-md bg-violet-600 text-[14px] font-semibold text-white transition hover:bg-violet-700"
        style={{ cursor: "pointer" }}
      >
        차단 추가하기
      </Link>
    </section>
  );
}

function ConfirmModal({ open, title, description, onClose, onConfirm, loading }) {
  if (!open) return null;

  return (
    <div
      className="absolute inset-0 z-[120] flex items-center justify-center bg-black/45 px-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] rounded-[22px] bg-white px-5 pb-5 pt-5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[22px] font-bold tracking-[-0.02em] text-slate-900">
          {title}
        </div>

        <p className="mt-3 break-keep text-[15px] leading-6 text-slate-500">
          {description}
        </p>

        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          style={{ cursor: loading ? "default" : "pointer" }}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[16px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "처리 중..." : "해제하기"}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{ cursor: "pointer" }}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-md border border-slate-200 bg-white text-[15px] font-semibold text-slate-700 transition hover:text-slate-900"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export default function BlockListPage() {
  const reduxUser = useSelector((state) => state.user?.user ?? null);
  const uid = reduxUser?.userID || auth?.currentUser?.uid || null;

  const [contacts, setContacts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "",
    id: "",
    title: "",
    description: "",
  });
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = snap.data() || {};
        setContacts(
          sortByCreatedAtDesc(Array.isArray(data.blockedContacts) ? data.blockedContacts : [])
        );
        setCompanies(
          sortByCreatedAtDesc(
            Array.isArray(data.blockedCompanyKeywords)
              ? data.blockedCompanyKeywords
              : []
          )
        );
        setLoading(false);
      },
      (error) => {
        console.error("[setting/block/list] snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const totalCount = contacts.length + companies.length;

  const handleOpenRemoveContact = (item) => {
    setConfirmState({
      open: true,
      type: "contact",
      id: item.id,
      title: "지인 차단을 해제할까요?",
      description: `${item.name} · ${formatPhoneLast4(item.phoneLast4)} 항목이 리스트에서 제거됩니다.`,
    });
  };

  const handleOpenRemoveCompany = (item) => {
    setConfirmState({
      open: true,
      type: "company",
      id: item.id,
      title: "회사 차단을 해제할까요?",
      description: `${item.keyword} 항목이 리스트에서 제거됩니다.`,
    });
  };

  const handleCloseConfirm = () => {
    if (removing) return;
    setConfirmState({
      open: false,
      type: "",
      id: "",
      title: "",
      description: "",
    });
  };

  const handleConfirmRemove = async () => {
    if (!uid || !confirmState.id) return;

    try {
      setRemoving(true);

      if (confirmState.type === "contact") {
        const nextContacts = contacts.filter((item) => item.id !== confirmState.id);

        await setDoc(
          doc(db, "users", uid),
          {
            blockedContacts: nextContacts,
            blockedUpdatedAt: Date.now(),
          },
          { merge: true }
        );
      }

      if (confirmState.type === "company") {
        const nextCompanies = companies.filter((item) => item.id !== confirmState.id);

        await setDoc(
          doc(db, "users", uid),
          {
            blockedCompanyKeywords: nextCompanies,
            blockedUpdatedAt: Date.now(),
          },
          { merge: true }
        );
      }

      handleCloseConfirm();
    } catch (error) {
      console.error("[setting/block/list] remove error:", error);
      alert("해제 중 문제가 발생했어요.");
    } finally {
      setRemoving(false);
    }
  };

  const rightNode = useMemo(() => {
    return (
      <Link
        href="/setting/block"
        className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
        style={{ cursor: "pointer" }}
      >
        추가
      </Link>
    );
  }, []);

  return (
    <div className="relative">
      <BlockPageFrame title="차단 리스트" rightNode={rightNode}>
        <section className="grid grid-cols-3 gap-2">
          <SummaryCard label="전체" value={loading ? "-" : totalCount} />
          <SummaryCard label="연락처" value={loading ? "-" : contacts.length} />
          <SummaryCard label="회사" value={loading ? "-" : companies.length} />
        </section>

        {!loading && totalCount === 0 ? <EmptyState /> : null}

        {contacts.length ? (
          <SectionCard
            icon={PiUsersThreeDuotone}
            title="지인 직접 차단"
            count={contacts.length}
          >
            {contacts.map((item) => (
              <Row
                key={item.id}
                title={`${item.name} · ${formatPhoneLast4(item.phoneLast4)}`}
                desc="추천과 차밍카드에서 제외됩니다."
                dateText={formatCreatedAt(item.createdAt)}
                onRemove={() => handleOpenRemoveContact(item)}
              />
            ))}
          </SectionCard>
        ) : null}

        {companies.length ? (
          <SectionCard
            icon={PiBuildingOfficeDuotone}
            title="회사 차단"
            count={companies.length}
          >
            {companies.map((item) => (
              <Row
                key={item.id}
                title={item.keyword}
                desc="해당 회사명은 제외 기준으로 사용됩니다."
                dateText={formatCreatedAt(item.createdAt)}
                onRemove={() => handleOpenRemoveCompany(item)}
              />
            ))}
          </SectionCard>
        ) : null}

        {!loading && totalCount > 0 ? (
          <section className="rounded-md border border-violet-100 bg-violet-50 px-4 py-3">
            <div className="flex items-start gap-2 text-[13px] leading-5 text-violet-700">
              <PiCheckCircleFill className="mt-0.5 shrink-0 text-[15px]" />
              <span>차단 해제 후에는 제외 기준에서 바로 제거됩니다.</span>
            </div>
          </section>
        ) : null}
      </BlockPageFrame>

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmRemove}
        loading={removing}
      />
    </div>
  );
}
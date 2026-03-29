import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSelector } from "react-redux";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  PiUsersThreeDuotone,
  PiBuildingOfficeDuotone,
  PiPlusBold,
  PiListBulletsDuotone,
  PiCaretRightBold,
  PiCheckCircleFill,
  PiXBold,
  PiShieldCheckDuotone,
} from "react-icons/pi";

import { auth, db } from "firebaseConfig";
import BlockPageFrame from "./BlockPageFrame";
import {
  dedupeCompanyKeywords,
  dedupeContacts,
  formatPhoneLast4,
  isValidBlockedCompany,
  isValidBlockedContact,
  makeBlockedCompanyKeyword,
  makeBlockedContact,
  normalizePhoneLast4,
  sortByCreatedAtDesc,
} from "./blockUtils";

function HeroCard() {
  return (
    <section className="overflow-hidden rounded-md border border-violet-100 bg-[linear-gradient(135deg,#faf5ff_0%,#ffffff_55%,#eef2ff_100%)] px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/80 ring-1 ring-violet-100">
          <PiShieldCheckDuotone className="text-[22px] text-violet-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[18px] font-bold leading-6 tracking-[-0.02em] text-slate-900">
            아는 사람은 추천과
            <br />
            차밍카드에서 제외할 수 있어요
          </div>
          <p className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
            이름과 번호, 회사명 기준으로
            <br />
            차단 대상을 관리합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-3">
      <div className="text-[13px] font-medium text-slate-600">{label}</div>
      <div className="text-[13px] font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
          <Icon className="text-[20px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-slate-900">{title}</div>
          <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="mb-2 text-[13px] font-semibold text-slate-800">{children}</div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode = "text",
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400"
    />
  );
}

function AddButton({ onClick, label = "추가" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
      aria-label={label}
      title={label}
    >
      <PiPlusBold className="text-[18px]" />
    </button>
  );
}

function FullAddButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-violet-200 bg-violet-50 text-[14px] font-semibold text-violet-700 transition hover:bg-violet-100"
    >
      <PiPlusBold className="text-[16px]" />
      <span>{label}</span>
    </button>
  );
}

function DraftChip({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-2 text-[13px] font-medium text-violet-700">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        style={{ cursor: "pointer" }}
        className="flex h-4 w-4 items-center justify-center rounded-full text-violet-600 transition hover:bg-violet-100"
      >
        <PiXBold className="text-[10px]" />
      </button>
    </div>
  );
}

function SavedChip({ label }) {
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-[13px] font-medium text-slate-700">
      {label}
    </div>
  );
}

export default function BlockSettingPage() {
  const reduxUser = useSelector((state) => state.user?.user ?? null);
  const uid = reduxUser?.userID || auth?.currentUser?.uid || null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [savedContacts, setSavedContacts] = useState([]);
  const [savedCompanies, setSavedCompanies] = useState([]);

  const [contactName, setContactName] = useState("");
  const [contactPhoneLast4, setContactPhoneLast4] = useState("");
  const [companyKeyword, setCompanyKeyword] = useState("");

  const [contactDrafts, setContactDrafts] = useState([]);
  const [companyDrafts, setCompanyDrafts] = useState([]);

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        const data = snap.data() || {};
        setSavedContacts(
          sortByCreatedAtDesc(Array.isArray(data.blockedContacts) ? data.blockedContacts : [])
        );
        setSavedCompanies(
          sortByCreatedAtDesc(
            Array.isArray(data.blockedCompanyKeywords)
              ? data.blockedCompanyKeywords
              : []
          )
        );
        setLoading(false);
      },
      (error) => {
        console.error("[setting/block] snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const totalSavedCount = savedContacts.length + savedCompanies.length;
  const totalDraftCount = contactDrafts.length + companyDrafts.length;

  const listPreviewText = useMemo(() => {
    if (!totalSavedCount) return "등록된 항목이 없어요";
    return `연락처 ${savedContacts.length} · 회사 ${savedCompanies.length}`;
  }, [savedCompanies.length, savedContacts.length, totalSavedCount]);

  const handleAddContactDraft = () => {
    const validation = isValidBlockedContact(contactName, contactPhoneLast4);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const newItem = makeBlockedContact(contactName, contactPhoneLast4);
    const duplicatedInSaved = savedContacts.some(
      (item) => item?.normalizedKey === newItem.normalizedKey
    );
    const duplicatedInDraft = contactDrafts.some(
      (item) => item?.normalizedKey === newItem.normalizedKey
    );

    if (duplicatedInSaved || duplicatedInDraft) {
      alert("이미 등록된 항목입니다.");
      return;
    }

    setContactDrafts((prev) => dedupeContacts([newItem, ...prev]));
    setContactName("");
    setContactPhoneLast4("");
  };

  const handleAddCompanyDraft = () => {
    const validation = isValidBlockedCompany(companyKeyword);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const newItem = makeBlockedCompanyKeyword(companyKeyword);
    const duplicatedInSaved = savedCompanies.some(
      (item) => item?.normalizedKeyword === newItem.normalizedKeyword
    );
    const duplicatedInDraft = companyDrafts.some(
      (item) => item?.normalizedKeyword === newItem.normalizedKeyword
    );

    if (duplicatedInSaved || duplicatedInDraft) {
      alert("이미 등록된 항목입니다.");
      return;
    }

    setCompanyDrafts((prev) => dedupeCompanyKeywords([newItem, ...prev]));
    setCompanyKeyword("");
  };

  const handleSaveAll = async () => {
    if (!uid) {
      alert("로그인 정보를 찾지 못했어요.");
      return;
    }

    if (!contactDrafts.length && !companyDrafts.length) {
      alert("추가된 항목이 없어요.");
      return;
    }

    try {
      setSaving(true);

      const nextContacts = dedupeContacts([...savedContacts, ...contactDrafts]);
      const nextCompanies = dedupeCompanyKeywords([...savedCompanies, ...companyDrafts]);

      await setDoc(
        doc(db, "users", uid),
        {
          blockedContacts: nextContacts,
          blockedCompanyKeywords: nextCompanies,
          blockedUpdatedAt: Date.now(),
        },
        { merge: true }
      );

      setContactDrafts([]);
      setCompanyDrafts([]);
      alert("차단 설정이 저장되었어요.");
    } catch (error) {
      console.error("[setting/block] save error:", error);
      alert("저장 중 문제가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  const saveFooter = (
    <button
      type="button"
      onClick={handleSaveAll}
      disabled={saving}
      style={{ cursor: saving ? "default" : "pointer" }}
      className="flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-bold text-white transition hover:bg-violet-700 disabled:opacity-50"
    >
      {saving ? "저장 중..." : "저장하기"}
    </button>
  );

  return (
    <BlockPageFrame title="지인 차단" footer={saveFooter} showBottomNavbar>
      <HeroCard />

      <section className="space-y-2 rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <SummaryRow label="등록된 항목" value={loading ? "-" : `${totalSavedCount}개`} />
        <SummaryRow label="추가한 항목" value={`${totalDraftCount}개`} />
      </section>

      <SectionCard
        icon={PiUsersThreeDuotone}
        title="지인 직접 차단"
        description="이름과 번호를 함께 등록합니다."
      >
        <div>
          <FieldLabel>이름</FieldLabel>
          <TextInput
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="이름을 입력해주세요"
            maxLength={12}
          />
        </div>

        <div>
          <FieldLabel>전화번호 뒤 4자리</FieldLabel>
          <TextInput
            value={contactPhoneLast4}
            onChange={(e) => setContactPhoneLast4(normalizePhoneLast4(e.target.value))}
            placeholder="뒤 4자리를 입력해주세요"
            maxLength={4}
            inputMode="numeric"
          />
        </div>

        <FullAddButton onClick={handleAddContactDraft} label="지인 직접 차단 추가" />

        {contactDrafts.length ? (
          <div>
            <div className="mb-2 text-[12px] font-semibold text-violet-700">
              저장 예정
            </div>
            <div className="flex flex-wrap gap-2">
              {contactDrafts.map((item) => (
                <DraftChip
                  key={item.id}
                  label={`${item.name} · ${formatPhoneLast4(item.phoneLast4)}`}
                  onRemove={() =>
                    setContactDrafts((prev) =>
                      prev.filter((draft) => draft.id !== item.id)
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        {savedContacts.length ? (
          <div>
            <div className="mb-2 text-[12px] font-semibold text-slate-500">
              등록됨
            </div>
            <div className="flex flex-wrap gap-2">
              {savedContacts.slice(0, 3).map((item) => (
                <SavedChip
                  key={item.id}
                  label={`${item.name} · ${formatPhoneLast4(item.phoneLast4)}`}
                />
              ))}
              {savedContacts.length > 3 ? (
                <SavedChip label={`+${savedContacts.length - 3}개`} />
              ) : null}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        icon={PiBuildingOfficeDuotone}
        title="회사 차단"
        description="회사명 키워드로 등록합니다.(3자 이상)"
      >
        <div>
          <FieldLabel>회사명</FieldLabel>
          <div className="flex items-center gap-2">
            <TextInput
              value={companyKeyword}
              onChange={(e) => setCompanyKeyword(e.target.value)}
              placeholder="회사명을 입력해주세요"
              maxLength={30}
            />
            <AddButton onClick={handleAddCompanyDraft} />
          </div>
        </div>

        {companyDrafts.length ? (
          <div>
            <div className="mb-2 text-[12px] font-semibold text-violet-700">
              저장 예정
            </div>
            <div className="flex flex-wrap gap-2">
              {companyDrafts.map((item) => (
                <DraftChip
                  key={item.id}
                  label={item.keyword}
                  onRemove={() =>
                    setCompanyDrafts((prev) =>
                      prev.filter((draft) => draft.id !== item.id)
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        {savedCompanies.length ? (
          <div>
            <div className="mb-2 text-[12px] font-semibold text-slate-500">
              등록됨
            </div>
            <div className="flex flex-wrap gap-2">
              {savedCompanies.slice(0, 3).map((item) => (
                <SavedChip key={item.id} label={item.keyword} />
              ))}
              {savedCompanies.length > 3 ? (
                <SavedChip label={`+${savedCompanies.length - 3}개`} />
              ) : null}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <Link
        href="/setting/block/list"
        className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:bg-slate-50"
        style={{ cursor: "pointer" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-100">
            <PiListBulletsDuotone className="text-[22px] text-slate-700" />
          </div>

          <div className="min-w-0">
            <div className="text-[15px] font-bold text-slate-900">
              차단 리스트 보기
            </div>
            <div className="mt-1 break-keep text-[13px] text-slate-500">
              {loading ? "불러오는 중..." : listPreviewText}
            </div>
          </div>
        </div>

        <PiCaretRightBold className="shrink-0 text-[18px] text-slate-400" />
      </Link>
    </BlockPageFrame>
  );
}
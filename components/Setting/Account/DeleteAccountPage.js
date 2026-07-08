import React, { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getFunctions, httpsCallable } from "firebase/functions";
import { signOut } from "firebase/auth";
import {
  PiArrowLeft,
  PiWarningCircleDuotone,
  PiChatsCircleDuotone,
  PiCheckCircleFill,
  PiSealWarningDuotone,
} from "react-icons/pi";

import { auth } from "firebaseConfig";
import BottomNavbar from "components/Common/BottomNavbar";
import { resetUserState } from "slices/user";

const DELETE_REASONS = [
  {
    value: "few_matches",
    title: "마음에 드는 상대가 적어요",
    desc: "추천이나 노출되는 상대가 기대와 달랐어요.",
  },
  {
    value: "too_expensive",
    title: "비용이 부담돼요",
    desc: "스푼이나 유료 기능이 부담스럽게 느껴졌어요.",
  },
  {
    value: "not_using",
    title: "당분간 사용할 계획이 없어요",
    desc: "지금은 소개팅이나 만남 서비스가 필요하지 않아요.",
  },
  {
    value: "met_someone",
    title: "좋은 사람을 만났어요",
    desc: "서비스를 더 이상 사용할 이유가 없어졌어요.",
  },
  {
    value: "privacy_concern",
    title: "개인정보가 걱정돼요",
    desc: "노출 방식이나 계정 보안이 불안하게 느껴졌어요.",
  },
  {
    value: "app_quality",
    title: "서비스 사용성이 아쉬워요",
    desc: "화면 구성이나 기능 흐름이 불편했어요.",
  },
  {
    value: "other",
    title: "기타",
    desc: "직접 사유를 적어 알려주세요.",
  },
];

function maskEmail(email = "") {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (!local) return email;

  if (local.length <= 2) {
    return `${local[0] || ""}*@${domain}`;
  }

  return `${local.slice(0, 2)}***@${domain}`;
}

function ReasonOption({ item, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      className={`w-full rounded-md border border-solid px-4 py-3 text-left transition ${selected
        ? "border-violet-300 bg-violet-50"
        : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected
            ? "border-violet-500 bg-violet-500 text-white"
            : "border-slate-300 bg-white text-transparent"
            }`}
        >
          <PiCheckCircleFill className="text-[12px]" />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`text-[14px] font-semibold ${selected ? "text-violet-700" : "text-slate-900"
              }`}
          >
            {item.title}
          </div>
          <div className="mt-1 break-keep text-[12px] leading-5 text-slate-500">
            {item.desc}
          </div>
        </div>
      </div>
    </button>
  );
}

function CheckRow({ checked, onToggle, children }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ cursor: "pointer" }}
      className="flex w-full items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-4 text-left transition hover:bg-slate-50"
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked
          ? "border-violet-500 bg-violet-500 text-white"
          : "border-slate-300 bg-white text-transparent"
          }`}
      >
        <PiCheckCircleFill className="text-[12px]" />
      </div>
      <div className="break-keep text-[13px] leading-5 text-slate-700">
        {children}
      </div>
    </button>
  );
}

function getErrorMessage(error) {
  const code = error?.code || "";
  const message = error?.message || "";
  const merged = `${code} ${message}`;

  if (merged.includes("unauthenticated")) {
    return "로그인 상태를 다시 확인해주세요.";
  }
  if (merged.includes("invalid-argument")) {
    return message.replace(/^.*invalid-argument:?\s*/i, "") || "입력값을 확인해주세요.";
  }
  if (merged.includes("not-found")) {
    return "사용자 정보를 찾지 못했어요.";
  }
  return "회원 탈퇴 중 문제가 발생했어요.";
}

export default function DeleteAccountPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxUser = useSelector((state) => state.user?.user ?? null);

  const email = reduxUser?.email || auth?.currentUser?.email || "";

  const [selectedReason, setSelectedReason] = useState("");
  const [detailText, setDetailText] = useState("");
  const [agreeProfileLoss, setAgreeProfileLoss] = useState(false);
  const [agreeNoRecovery, setAgreeNoRecovery] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedReasonItem = useMemo(() => {
    return DELETE_REASONS.find((item) => item.value === selectedReason) || null;
  }, [selectedReason]);

  const canSubmit =
    !!selectedReason &&
    (selectedReason !== "other" || detailText.trim().length >= 5) &&
    agreeProfileLoss &&
    agreeNoRecovery &&
    !saving;

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert("탈퇴 사유를 선택해주세요.");
      return;
    }

    if (selectedReason === "other" && detailText.trim().length < 5) {
      alert("기타 사유를 5자 이상 입력해주세요.");
      return;
    }

    if (!agreeProfileLoss || !agreeNoRecovery) {
      alert("안내 사항을 모두 확인해주세요.");
      return;
    }

    const ok = window.confirm(
      "정말로 회원 탈퇴를 진행할까요?\n탈퇴 후에는 기존 상태로 복구가 어려울 수 있어요."
    );

    if (!ok) return;

    try {
      setSaving(true);

      const functions = getFunctions(undefined, "asia-northeast3");
      const callable = httpsCallable(functions, "deleteCurrentUserAccount");

      await callable({
        reason: selectedReason,
        reasonTitle: selectedReasonItem?.title || "",
        detailText: detailText.trim(),
        agreeProfileLoss,
        agreeNoRecovery,
      });

      await signOut(auth);
      dispatch(resetUserState());

      alert("회원 탈퇴가 완료되었어요.");
      router.replace("/login");
    } catch (error) {
      console.error("[DeleteAccountPage] delete error:", error);
      alert(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            <header className="shrink-0 border-b border-slate-200 bg-white">
              <div className="flex h-14 items-center px-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  style={{ cursor: "pointer" }}
                  className="mr-2 flex h-9 w-9 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100"
                >
                  <PiArrowLeft className="text-[20px]" />
                </button>

                <div className="text-[16px] font-bold text-slate-900">
                  회원 탈퇴
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4 pb-2">
                <section className="rounded-md border border-rose-100 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_55%,#fff7ed_100%)] px-4 py-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-white/80">
                      <PiSealWarningDuotone className="text-[22px] text-rose-500" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[18px] font-bold leading-6 tracking-[-0.02em] text-slate-900">
                        탈퇴 전에 이유를 남겨주시면
                        <br />
                        서비스 개선에 반영할게요
                      </div>
                      <p className="mt-2 break-keep text-[13px] leading-5 text-slate-500">
                        탈퇴 시 프로필 노출과 매칭 이용이 중단되고
                        <br />
                        공개될 수 있는 개인정보가 정리돼요.
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="text-[13px] font-medium text-slate-500">
                    대상 계정
                  </div>
                  <div className="mt-2 text-[15px] font-semibold text-slate-900">
                    {email ? maskEmail(email) : "이메일 없음"}
                  </div>
                </section>

                <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                      <PiChatsCircleDuotone className="text-[20px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-slate-900">
                        탈퇴 사유를 선택해주세요
                      </div>
                      <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
                        가장 가까운 이유를 하나 골라주세요.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {DELETE_REASONS.map((item) => (
                      <ReasonOption
                        key={item.value}
                        item={item}
                        selected={selectedReason === item.value}
                        onClick={() => setSelectedReason(item.value)}
                      />
                    ))}
                  </div>

                  {selectedReason === "other" ? (
                    <div className="mt-3">
                      <div className="mb-2 text-[13px] font-semibold text-slate-800">
                        기타 사유
                      </div>
                      <textarea
                        value={detailText}
                        onChange={(e) => setDetailText(e.target.value)}
                        placeholder="불편했던 점이나 아쉬웠던 점을 자유롭게 적어주세요"
                        rows={4}
                        className="w-full resize-none rounded-md border border-slate-200 bg-white px-4 py-3 text-[14px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400"
                      />
                      <div className="mt-2 text-right text-[12px] text-slate-400">
                        {detailText.trim().length}자
                      </div>
                    </div>
                  ) : null}
                </section>

                <section className="rounded-md border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                      <PiWarningCircleDuotone className="text-[20px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-slate-900">
                        탈퇴 전 확인해주세요
                      </div>
                      <p className="mt-1 break-keep text-[13px] leading-5 text-slate-500">
                        아래 내용을 모두 확인한 뒤 진행해주세요.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <CheckRow
                      checked={agreeProfileLoss}
                      onToggle={() => setAgreeProfileLoss((prev) => !prev)}
                    >
                      탈퇴가 진행되면 프로필 노출과 매칭 이용이 중단되고, 공개될 수 있는 개인정보가 정리된다는 점을 확인했어요.
                    </CheckRow>

                    <CheckRow
                      checked={agreeNoRecovery}
                      onToggle={() => setAgreeNoRecovery((prev) => !prev)}
                    >
                      탈퇴 후에는 같은 상태로 복구가 어렵고, 재이용 시 다시 가입/심사가 필요할 수 있다는 점을 확인했어요.
                    </CheckRow>
                  </div>
                </section>
              </div>
            <div className="inset-x-0 z-30 border-t border-slate-200 pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{ cursor: canSubmit ? "pointer" : "default" }}
                className="flex h-12 w-full items-center justify-center rounded-md bg-rose-500 text-[14px] font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? "회원 탈퇴 중..." : "회원 탈퇴하기"}
              </button>
            </div>
            </div>


            <BottomNavbar contained />
          </section>
        </div>
      </div>
    </main>
  );
}
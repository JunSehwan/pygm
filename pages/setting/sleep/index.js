import React, { useEffect, useState } from "react";
import Head from "next/head";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "firebaseConfig";
import { PiMoonDuotone } from "react-icons/pi";
import RequireAuth from "components/Common/RequireAuth";

function SleepContent() {
  const [uid, setUid] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = auth?.onAuthStateChanged?.(async (user) => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setUid(user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setEnabled(!!snap.data()?.date_sleep);
        }
      } catch (error) {
        console.error("[setting/sleep] load error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  const handleToggle = async () => {
    if (!uid || saving) return;

    try {
      setSaving(true);
      const nextValue = !enabled;

      await updateDoc(doc(db, "users", uid), {
        date_sleep: nextValue,
      });

      setEnabled(nextValue);
    } catch (error) {
      console.error("[setting/sleep] update error:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-[420px] px-4 pb-8 pt-6">
        <section className="rounded-[20px] bg-white px-5 py-5 shadow-sm ring-1 ring-zinc-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-violet-50">
            <PiMoonDuotone className="text-[24px] text-violet-600" />
          </div>

          <div className="mt-4 text-[24px] font-bold tracking-[-0.02em] text-zinc-900">
            차밍수프 휴면
          </div>

          <p className="mt-2 break-keep text-[14px] leading-6 text-zinc-500">
            잠시 쉬고 싶을 때
            <br />
            내 노출을 멈출 수 있어요.
          </p>
        </section>

        <div className="mt-4 rounded-[18px] bg-white px-4 py-5 shadow-sm ring-1 ring-zinc-100">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="break-keep text-[16px] font-semibold text-zinc-900">
                휴면 상태
              </div>
              <div className="mt-1 break-keep text-[13px] leading-5 text-zinc-500">
                현재 상태 :
                {" "}
                {enabled ? "일시정지 중" : "활성 상태"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggle}
              disabled={loading || saving}
              className={`relative h-8 w-14 rounded-full transition ${enabled ? "bg-violet-600" : "bg-zinc-300"
                } disabled:opacity-60`}
            >
              <span
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${enabled ? "left-7" : "left-1"
                  }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={loading || saving}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-md bg-violet-600 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? "저장 중..." : enabled ? "휴면 해제하기" : "휴면으로 전환하기"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SettingSleepPage() {
  return (
    <>
      <Head>
        <title>휴면 설정 | 차밍수프</title>
      </Head>

      <RequireAuth
        redirect="/setting/sleep"
        fallback={<div className="min-h-screen bg-zinc-50" />}
      >
        <SleepContent />
      </RequireAuth>
    </>
  );
}
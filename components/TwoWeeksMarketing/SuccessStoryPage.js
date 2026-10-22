import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "firebaseConfig";

const OPTIONS = [
  ["getting_to_know", "아직 알아가는 중이에요"],
  ["dating", "꾸준히 만나고 있어요"],
  ["relationship", "연인으로 만나고 있어요"],
  ["not_continuing", "지금은 인연을 이어가고 있지 않아요"],
];

async function ensureAuth() {
  try {
    if (typeof auth.authStateReady === "function") {
      await auth.authStateReady();
    }
  } catch {
    // 초기 인증 복원 실패 시 아래 익명 로그인 fallback을 사용한다.
  }

  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}

export default function SuccessStoryPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [displayLabel, setDisplayLabel] = useState("익명 회원");
  const [dashboardPath, setDashboardPath] = useState("/2weeks/proposal/dashboard");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [content, setContent] = useState("");
  const [publishConsent, setPublishConsent] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const cleanToken = String(router.query.token || "").trim();
    setToken(cleanToken);
    if (!cleanToken) { setError("링크가 올바르지 않습니다."); setLoading(false); return; }
    (async () => {
      try {
        await ensureAuth();
        const fn = httpsCallable(getFunctions(undefined, "asia-northeast3"), "resolveTwoWeeksMarketingAccess");
        const res = await fn({ token: cleanToken, type: "success_story" });
        setDisplayLabel(res.data?.displayLabel || "익명 회원");
        setDashboardPath(res.data?.dashboardPath || "/2weeks/proposal/dashboard");
        setSubmitted(Boolean(res.data?.submitted));
      } catch (e) {
        setError(e?.message?.replace(/^FirebaseError:\s*/i, "") || "이야기 정보를 불러오지 못했습니다.");
      } finally { setLoading(false); }
    })();
  }, [router.isReady, router.query.token]);

  const submit = async () => {
    if (!relationshipStatus) return alert("현재 관계 상태를 선택해주세요.");
    if (relationshipStatus !== "not_continuing" && content.trim().length < 30) return alert("이야기를 30자 이상 작성해주세요.");
    setSaving(true);
    try {
      await ensureAuth();
      const fn = httpsCallable(getFunctions(undefined, "asia-northeast3"), "submitTwoWeeksSuccessStory");
      await fn({ token, relationshipStatus, content: content.trim(), publishConsent: relationshipStatus !== "not_continuing" && publishConsent });
      setSubmitted(true);
    } catch (e) {
      alert(e?.message?.replace(/^FirebaseError:\s*/i, "") || "저장 중 오류가 발생했습니다.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <Head><title>투윅스, 그 후의 이야기</title></Head>
      <main className="min-h-screen bg-[#f0f2f5] px-4 py-6 text-[#1c1e21]">
        <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">2WEEKS STORY</div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">투윅스, 그 후의 이야기</h1>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-zinc-500">실제 만남이 좋은 인연으로 이어진 이야기는 더 좋은 회원이 투윅스를 믿고 참여하는 가장 큰 계기가 됩니다. 그 선순환이 다시 더 좋은 만남의 가능성을 넓혀갑니다.</p>
          {loading ? <div className="py-16 text-center text-sm font-bold text-zinc-400">불러오는 중...</div> : null}
          {error ? <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
          {!loading && !error && submitted ? <div className="mt-6"><div className="rounded-xl bg-emerald-50 p-5"><div className="text-xl font-black text-emerald-900">이야기를 들려주셔서 감사합니다.</div><p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">공개에 동의한 이야기는 관리자 확인 후 익명으로만 소개됩니다.</p></div><button onClick={() => router.push(dashboardPath)} className="mt-5 w-full rounded-xl bg-zinc-950 px-5 py-4 text-sm font-black text-white">신청현황으로 돌아가기</button></div> : null}
          {!loading && !error && !submitted ? <div className="mt-6 grid gap-6">
            <section><div className="text-sm font-black">지금도 그분과 인연을 이어가고 계신가요?</div><div className="mt-3 grid gap-2">{OPTIONS.map(([value,label]) => <button key={value} onClick={() => setRelationshipStatus(value)} className={`rounded-xl border p-4 text-left text-sm font-black ${relationshipStatus === value ? "border-orange-400 bg-orange-50 text-orange-800" : "border-zinc-200 text-zinc-700"}`}>{label}</button>)}</div></section>
            {relationshipStatus && relationshipStatus !== "not_continuing" ? <><section><div className="text-sm font-black">두 분의 이야기를 들려주세요.</div><textarea value={content} onChange={(e) => setContent(e.target.value.slice(0,1400))} rows={8} placeholder="첫 만남에서 기억나는 순간, 이후 어떻게 인연을 이어가게 되었는지 편하게 적어주세요. (30자 이상)" className="mt-3 w-full rounded-xl border border-zinc-200 p-4 text-sm font-semibold leading-6 outline-none focus:border-orange-400"/><div className="mt-1 text-right text-xs font-semibold text-zinc-400">{content.length}/1400</div></section><section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={publishConsent} onChange={(e) => setPublishConsent(e.target.checked)} className="mt-1 h-4 w-4"/><span><span className="text-sm font-black">홈페이지·SNS·광고에 익명 성공스토리로 소개해도 괜찮아요. <span className="text-zinc-400">(선택)</span></span><span className="mt-1 block text-xs font-semibold leading-5 text-zinc-500">실명·회사명·연락처는 공개하지 않으며 <b>{displayLabel}</b>처럼 표시합니다.</span></span></label></section></> : null}
            {relationshipStatus === "not_continuing" ? <div className="rounded-xl bg-zinc-50 p-4 text-sm font-semibold leading-6 text-zinc-600">괜찮아요. 이 답변은 서비스 개선을 위한 내부 참고용으로만 저장되고 성공사례로 공개되지 않습니다.</div> : null}
            <button disabled={saving || !relationshipStatus} onClick={submit} className="w-full rounded-xl bg-zinc-950 px-5 py-4 text-sm font-black text-white disabled:opacity-40">{saving ? "저장 중..." : "이야기 제출하기"}</button>
          </div> : null}
        </div>
      </main>
    </>
  );
}

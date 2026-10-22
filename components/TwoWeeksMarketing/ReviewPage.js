import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "firebaseConfig";

const TAGS = [
  ["easy_meeting", "실제로 만나서 좋았어요"],
  ["sixty_minutes", "60분이라 부담이 적었어요"],
  ["trusted_profile", "프로필을 믿을 수 있었어요"],
  ["curated_match", "한 명씩 제안받는 방식이 좋았어요"],
  ["comfortable_process", "진행 방식이 편했어요"],
  ["would_recommend", "주변에 추천하고 싶어요"],
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

export default function ReviewPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [displayLabel, setDisplayLabel] = useState("익명 회원");
  const [dashboardPath, setDashboardPath] = useState("/2weeks/proposal/dashboard");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState("");
  const [publishConsent, setPublishConsent] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const cleanToken = String(router.query.token || "").trim();
    setToken(cleanToken);
    if (!cleanToken) {
      setError("후기 링크가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await ensureAuth();
        const fn = httpsCallable(getFunctions(undefined, "asia-northeast3"), "resolveTwoWeeksMarketingAccess");
        const res = await fn({ token: cleanToken, type: "review" });
        setDisplayLabel(res.data?.displayLabel || "익명 회원");
        setDashboardPath(res.data?.dashboardPath || "/2weeks/proposal/dashboard");
        setSubmitted(Boolean(res.data?.submitted));
      } catch (e) {
        setError(e?.message?.replace(/^FirebaseError:\s*/i, "") || "후기 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, router.query.token]);

  const toggleTag = (value) => setTags((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);

  const submit = async () => {
    if (!rating) return alert("만족도를 선택해주세요.");
    if (content.trim().length < 20) return alert("후기를 20자 이상 작성해주세요.");
    setSaving(true);
    try {
      await ensureAuth();
      const fn = httpsCallable(getFunctions(undefined, "asia-northeast3"), "submitTwoWeeksReview");
      await fn({ token, rating, tags, content: content.trim(), publishConsent });
      setSubmitted(true);
    } catch (e) {
      alert(e?.message?.replace(/^FirebaseError:\s*/i, "") || "후기 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head><title>투윅스 이용 후기</title></Head>
      <main className="min-h-screen bg-[#f0f2f5] px-4 py-6 text-[#1c1e21]">
        <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-sm md:p-7">
          <div className="text-xs font-black uppercase tracking-[0.18em] text-[#1877f2]">2WEEKS REVIEW</div>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.05em]">투윅스 이용 후기</h1>
          <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#65676b]">
            한 줄의 실제 경험이 투윅스에 더 좋은 회원을 모으는 데 도움이 됩니다. 좋은 회원이 많아질수록 다음 매칭의 선택지도 더 좋아질 수 있어요.
          </p>

          {loading ? <div className="py-16 text-center text-sm font-bold text-zinc-400">불러오는 중...</div> : null}
          {error ? <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div> : null}
          {!loading && !error && submitted ? (
            <div className="mt-6">
              <div className="rounded-xl bg-emerald-50 p-5">
                <div className="text-xl font-black text-emerald-900">후기를 남겨주셔서 감사합니다.</div>
                <p className="mt-2 break-keep text-sm font-semibold leading-6 text-emerald-800">작성해주신 후기는 운영 개선에 활용되며, 공개 동의한 후기는 관리자 확인 후 익명으로만 소개됩니다.</p>
              </div>
              <button onClick={() => router.push(dashboardPath)} className="mt-5 w-full rounded-xl bg-[#1877f2] px-5 py-4 text-sm font-black text-white">신청현황으로 돌아가기</button>
            </div>
          ) : null}

          {!loading && !error && !submitted ? (
            <div className="mt-6 grid gap-6">
              <section>
                <div className="text-sm font-black">이번 투윅스 경험은 어떠셨나요?</div>
                <div className="mt-3 flex gap-2">
                  {[1,2,3,4,5].map((value) => (
                    <button key={value} onClick={() => setRating(value)} className={`flex h-12 w-12 items-center justify-center rounded-full border text-2xl ${rating >= value ? "border-amber-400 bg-amber-50 text-amber-500" : "border-zinc-200 text-zinc-300"}`}>★</button>
                  ))}
                </div>
              </section>
              <section>
                <div className="text-sm font-black">어떤 점이 좋았나요? <span className="font-semibold text-zinc-400">(복수선택 가능)</span></div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {TAGS.map(([value,label]) => <button key={value} onClick={() => toggleTag(value)} className={`rounded-full border border-solid px-3 py-2 text-xs font-bold ${tags.includes(value) ? "border-blue-400 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600"}`}>{label}</button>)}
                </div>
              </section>
              <section>
                <div className="text-sm font-black">투윅스를 이용해보니 어땠나요?</div>
                <textarea value={content} onChange={(e) => setContent(e.target.value.slice(0,700))} rows={6} placeholder="실제로 이용하면서 좋았던 점이나 아쉬웠던 점을 편하게 적어주세요. (20자 이상)" className="mt-3 w-full rounded-xl border border-zinc-200 p-4 text-sm font-semibold leading-6 outline-none focus:border-blue-400" />
                <div className="mt-1 text-right text-xs font-semibold text-zinc-400">{content.length}/700</div>
              </section>
              <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="checkbox" checked={publishConsent} onChange={(e) => setPublishConsent(e.target.checked)} className="mt-1 h-4 w-4" />
                  <span>
                    <span className="text-sm font-black">홈페이지·SNS·광고에 익명 후기로 소개해도 괜찮아요. <span className="text-zinc-400">(선택)</span></span>
                    <span className="mt-1 block break-keep text-xs font-semibold leading-5 text-zinc-500">공개 시 실명·회사명·연락처는 표시하지 않습니다. 현재 표시는 <b>{displayLabel}</b>처럼 회사 유형/직업군과 마스킹된 이름만 사용합니다.</span>
                  </span>
                </label>
              </section>
              <button disabled={saving} onClick={submit} className="w-full rounded-xl bg-[#1877f2] px-5 py-4 text-sm font-black text-white disabled:opacity-50">{saving ? "저장 중..." : "후기 제출하기"}</button>
              <div className="text-center text-[11px] font-semibold leading-5 text-zinc-400">후기 작성과 공개 동의는 선택이며, 공개 여부와 관계없이 매칭 이용에 불이익이 없습니다.</div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "firebaseConfig";
import MobileFrame from "./MobileFrame";

function Stars({ value = 0 }) {
  return <div className="text-sm tracking-[0.08em] text-amber-500">{"★".repeat(Math.max(0, Math.min(5, Number(value || 0))))}</div>;
}

function sortRecent(rows = []) {
  return [...rows].sort((a, b) => Date.parse(b.publishedAtClient || "") - Date.parse(a.publishedAtClient || ""));
}

export default function MarketingStoriesSection() {
  const [reviews, setReviews] = useState([]);
  const [stories, setStories] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [reviewSnap, storySnap] = await Promise.all([
          getDocs(collection(db, "twoweeksPublicReviews")),
          getDocs(collection(db, "twoweeksPublicSuccessStories")),
        ]);
        if (!alive) return;
        setReviews(sortRecent(reviewSnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.verified === true)).slice(0, 6));
        setStories(sortRecent(storySnap.docs.map((item) => ({ id: item.id, ...item.data() })).filter((item) => item.verified === true)).slice(0, 3));
      } catch (error) {
        console.warn("[TwoWeeksLanding] marketing stories load failed", error);
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const hasContent = useMemo(() => reviews.length > 0 || stories.length > 0, [reviews, stories]);
  if (!loaded || !hasContent) return null;

  return (
    <section className="border-b border-solid border-zinc-200 bg-white text-zinc-950">
      <MobileFrame className="py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="text-sm font-black tracking-[0.08em] text-[#ff5b4d]">실제 만남 후기</div>
          <h2 className="mt-4 break-keep text-[34px] font-bold leading-tight tracking-[-0.05em] md:text-5xl">실제로 만나본 사람들의 이야기</h2>
          <p className="mt-5 break-keep text-sm font-medium leading-7 text-zinc-600 md:text-base">투윅스에서 실제 만남을 완료한 회원이 남긴 후기와, 그 만남 이후 이어진 이야기를 익명으로 소개합니다.</p>
        </div>

        {reviews.length ? <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{reviews.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-solid border-zinc-200 bg-zinc-50 p-5">
            <div className="flex items-center justify-between gap-3"><Stars value={item.rating}/><span className="text-[11px] font-bold text-emerald-700">✓ 실제 만남 확인</span></div>
            <p className="mt-4 break-keep text-sm font-semibold leading-7 text-zinc-700">“{item.content}”</p>
            <div className="mt-4 text-xs font-bold text-zinc-400">{item.displayLabel || "익명 회원"}</div>
          </article>
        ))}</div> : null}

        {stories.length ? <div className="mt-10 grid gap-4 md:grid-cols-3">{stories.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-solid border-orange-100 bg-orange-50 p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-500">2WEEKS STORY</div>
            <h3 className="mt-2 text-lg font-black tracking-[-0.04em] text-zinc-950">만남 이후에도 인연을 이어가고 있어요</h3>
            <p className="mt-3 break-keep text-sm font-semibold leading-7 text-zinc-700">“{item.content}”</p>
            <div className="mt-4 text-xs font-bold text-zinc-500">{item.displayLabel || "익명 회원"} · ✓ 실제 만남 확인</div>
          </article>
        ))}</div> : null}
      </MobileFrame>
    </section>
  );
}

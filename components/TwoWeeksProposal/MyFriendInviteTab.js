import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "firebaseConfig";
import { FiCopy, FiGift, FiShare2 } from "react-icons/fi";
import { createMyTwoWeeksInviteLink, getMyTwoWeeksReferralSummary } from "./referralService";

export default function MyFriendInviteTab({ application }) {
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [summary, setSummary] = useState(null);
  const [summaryError, setSummaryError] = useState("");
  const [event, setEvent] = useState(null);
  useEffect(() => {
    if (!application?.id) return undefined;
    let live = true;
    getMyTwoWeeksReferralSummary(application.id)
      .then(data => { if (live) setSummary(data); })
      .catch(err => { if (live) setSummaryError(err?.message || "초대 현황을 불러올 수 없어요."); });
    getDocs(query(collection(db, "twoweeksReferralEvents"), where("active", "==", true), limit(12)))
      .then(snap => {
        if (!live) return;
        const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
        const active = snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .filter(x => (!x.startAt || x.startAt <= today) && (!x.endAt || x.endAt >= today))
          .sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
        setEvent(active[0] || null);
      }).catch(() => {});
    return () => { live = false; };
  }, [application?.id]);
  const generate = async () => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await createMyTwoWeeksInviteLink(application.id);
      if (!result?.url) throw new Error("초대 링크를 확인하지 못했어요.");
      setLink(result.url);
      if (navigator.share) {
        try { await navigator.share({ title: "투윅스에 초대해요", url: result.url }); } catch { /* share cancelled */ }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.url);
        setNotice("초대 링크를 복사했어요.");
      }
    } catch (e) { setError(e?.message || "초대 링크를 만들지 못했어요."); }
    finally { setBusy(false); }
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); setNotice("링크를 복사했어요."); }
    catch { setError("복사에 실패했어요. 링크를 직접 선택해 복사해주세요."); }
  };
  return <div className="space-y-4">
    <section className="rounded-[22px] border border-[#e4ebf6] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[#326bda]"><FiGift/><span className="text-sm font-black">친구 초대</span></div>
      <h3 className="mt-3 break-keep text-lg font-black text-[#132942]">친구에게도 좋은 인연을 소개해주세요.</h3>
      <p className="mt-2 break-keep text-sm leading-6 text-[#657a91]">친구가 내 초대로 가입하고 첫 만남을 마치면, 이벤트 조건에 따라 추천인이 혜택을 받을 수 있어요.</p>
      {event ? <div className="mt-4 rounded-xl bg-[#f3f7fd] p-4">
        <p className="text-sm font-extrabold text-[#254c83]">{event.title}</p>
        {event.rewardName ? <p className="mt-1 text-sm font-bold text-[#405f88]">혜택: {event.rewardName}</p> : null}
        {event.conditions ? <p className="mt-2 break-keep text-xs leading-5 text-[#647b97]">{event.conditions}</p> : null}
        <Link href={`/2weeks/referral?event=${encodeURIComponent(event.id)}`} className="mt-3 inline-block text-xs font-bold text-[#326bda]">이벤트 자세히 보기 →</Link>
      </div> : <p className="mt-4 text-xs text-[#74859b]">현재 진행 중인 친구추천 이벤트는 없어요.</p>}
      <button type="button" disabled={busy} onClick={generate} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#326bda] text-sm font-bold text-white disabled:opacity-50"><FiShare2/>{busy ? "링크 발급 중..." : "친구 초대하기"}</button>
      {link ? <div className="mt-4 rounded-xl bg-[#f1f6fe] p-3"><p className="select-all break-all text-xs text-[#4e6890]">{link}</p><button type="button" onClick={copyLink} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-[#326bda]"><FiCopy/> 링크 복사</button></div> : null}
      {notice ? <p role="status" className="mt-3 text-sm text-blue-700">{notice}</p> : null}
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
    <section className="rounded-[22px] border border-[#e4ebf6] bg-white p-5 shadow-sm">
      <h3 className="text-base font-black text-[#132942]">나의 초대 현황</h3>
      {summary ? <div className="mt-4 grid grid-cols-3 gap-2">
        {[["초대 가입", summary.joined], ["첫 만남 완료", summary.firstMeetingCompleted], ["지급 완료", summary.paid]].map(([name,value]) => <div key={name} className="rounded-xl bg-[#f5f8fc] px-2 py-4 text-center"><strong className="text-xl font-black text-[#326bda]">{value}</strong><span className="mt-1 block text-[11px] font-semibold text-[#647b94]">{name}</span></div>)}
      </div> : summaryError ? <p role="alert" className="mt-3 text-xs text-[#8b6971]">{summaryError}</p> : <p role="status" className="mt-3 text-xs text-[#7a8ba1]">초대 내역을 확인하는 중이에요.</p>}
      {summary?.pending ? <p className="mt-3 text-xs text-[#657d99]">관리자 확인·지급 대기 {summary.pending}건</p> : null}
      {summary?.hasMore ? <p className="mt-2 text-xs text-[#88734d]">일부 오래된 내역은 관리자 확인이 필요해요.</p> : null}
      <p className="mt-3 break-keep text-xs leading-5 text-[#8595a7]">확인된 추천 관계만 집계하며, 다른 회원의 개인정보는 표시하지 않아요.</p>
    </section>
  </div>;
}

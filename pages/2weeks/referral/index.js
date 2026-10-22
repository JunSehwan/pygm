import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "firebaseConfig";
export default function TwoWeeksReferralEventPage(){
  const router=useRouter();const [event,setEvent]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let mounted=true;getDocs(query(collection(db,"twoweeksReferralEvents"),where("active","==",true))).then(snapshot=>{
    if(!mounted)return;const id=String(router.query.event||"");const found=snapshot.docs.map(d=>({id:d.id,...d.data()})).find(d=>d.id===id);
    setEvent(found||null);
  }).catch(e=>{if(mounted)setError("현재 이벤트를 불러올 수 없어요.");console.warn("referral event:",e);}).finally(()=>{if(mounted)setLoading(false);});return()=>{mounted=false;};},[router.isReady,router.query.event]);
  return <main className="min-h-screen bg-[#f7f9fc] px-5 py-12 text-[#132942]"><div className="mx-auto max-w-[600px] space-y-5"><Link href="/2weeks/proposal/dashboard?section=home" className="text-sm font-bold text-[#326bda]">← 투윅스 홈</Link><div className="rounded-[24px] border border-[#e5edf7] bg-white p-7 shadow-sm"><p className="text-xs font-black text-[#326bda]">친구추천 이벤트</p>{loading?<h1 className="mt-4 text-2xl font-black">불러오는 중...</h1>:error?<p className="mt-4 text-red-700">{error}</p>:event?<><h1 className="mt-4 break-keep text-3xl font-black">{event.title}</h1><p className="mt-4 whitespace-pre-line break-keep text-sm leading-7 text-[#56708d]">{event.description}</p><h2 className="mt-6 font-black">추천 혜택</h2><p className="mt-1 text-sm">{event.rewardName || "안내 예정"}</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#5c6f83]">{event.rewardDetails}</p><h2 className="mt-6 font-black">지급 조건</h2><p className="mt-1 whitespace-pre-line break-keep text-sm leading-7 text-[#5c6f83]">{event.conditions}</p><p className="mt-4 text-xs text-[#75879b]">{event.startAt||""}{event.endAt?` ~ ${event.endAt}`:""}</p></>:<p className="mt-4 text-sm">표시할 이벤트가 없어요.</p>}</div></div></main>;
}

import { useCallback, useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
const call=(name,data={})=>httpsCallable(getFunctions(undefined,"asia-northeast3"),name)(data).then(res=>res.data);
const labels={meeting_pending:"첫 만남 대기",needs_review:"검토 필요",eligible:"지급 대상",approved:"지급 승인",paid:"지급 완료",excluded:"지급 제외"};
export default function ReferralRewardsTab(){
  const [items,setItems]=useState([]); const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{setError("");try{setItems((await call("listTwoWeeksReferralRewards")).items||[]);}catch(err){setError(err?.message||"보상 목록을 불러오지 못했습니다.");}},[]);
  useEffect(()=>{load();},[load]);
  const assess=async()=>{setBusy(true);setError("");try{const r=await call("assessTwoWeeksReferralRewards");setNotice(`${r.evaluated}건 점검 완료`);await load();}catch(err){setError(err?.message||"보상 판정 오류");}finally{setBusy(false);}};
  const update=async(item,status)=>{
    if(!window.confirm(status==="paid"?"실제 혜택을 지급했나요? 지급 완료로 기록하면 되돌릴 수 없습니다.":"보상 상태를 변경할까요?")) return;
    const note=window.prompt("처리 메모 (선택)",item.adminNote||"");if(note===null)return;
    setBusy(true);setError("");try{await call("updateTwoWeeksReferralReward",{inviteeApplicationId:item.id,status,note});await load();setNotice("저장 완료");}catch(err){setError(err?.message||"상태 저장 실패");}finally{setBusy(false);}
  };
  return <div className="space-y-4 rounded-xl border border-solid border-zinc-300 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">친구추천 보상 관리</h2><p className="mt-1 text-sm text-zinc-500">자동 판정 후 관리자 승인, 실제 지급은 별도 기록합니다.</p></div><button type="button" disabled={busy} onClick={assess} className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?"확인 중...":"추천인·첫 만남 판정 새로고침"}</button></div>
    {error?<p role="alert" className="text-sm text-red-700">{error}</p>:null}{notice?<p className="text-sm text-blue-700">{notice}</p>:null}
    {!items.length?<p className="rounded-lg bg-zinc-50 p-5 text-sm text-zinc-600">판정된 추천 보상이 없어요. 자동 판정을 실행해보세요.</p>:<div className="grid gap-3">{items.map(item=><div key={item.id} className="rounded-lg border border-solid border-zinc-300 bg-white p-4"><div className="flex flex-wrap justify-between gap-2"><p className="break-all text-sm font-bold">초대받은 신청서: {item.inviteeApplicationId}</p><span className="text-sm font-bold text-blue-700">{labels[item.status]||item.status}</span></div><p className="mt-2 break-all text-xs text-zinc-500">추천인 UID: {item.referrerUid} · 매칭: {item.firstCompletedMatchId||"미확정"}</p><p className="mt-1 text-sm">{item.rewardEventSnapshot?.rewardName?`지급 혜택: ${item.rewardEventSnapshot.rewardName}`:"이벤트 확인 필요"}</p><p className="mt-1 text-xs text-zinc-500">{item.assessmentReason||""}</p><div className="mt-3 flex flex-wrap gap-2">{["eligible","needs_review"].includes(item.status)?<button disabled={busy} onClick={()=>update(item,"approved")} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white">관리자 지급 승인</button>:null}{item.status==="approved"?<button disabled={busy} onClick={()=>update(item,"paid")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">실제 지급 완료 기록</button>:null}{!["paid","excluded"].includes(item.status)?<button disabled={busy} onClick={()=>update(item,"excluded")} className="rounded-lg border border-solid border-red-200 px-3 py-2 text-xs font-bold text-red-700">지급 제외</button>:null}</div></div>)}</div>}
  </div>;
}

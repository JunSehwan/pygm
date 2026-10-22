import { useCallback, useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
const call = (name, data = {}) => httpsCallable(getFunctions(undefined, "asia-northeast3"), name)(data).then(res => res.data);
const EMPTY_EVENT = { title:"",description:"",rewardName:"",rewardDetails:"",conditions:"초대한 친구가 가입한 후 첫 실제 만남을 완료하면 추천인에게 지급",startAt:"",endAt:"",active:false,sortOrder:0 };
const EMPTY_NOTE = { title:"",instagramUrl:"",thumbnailUrl:"",imagePath:"",active:false,sortOrder:0 };
const field = "mt-1 min-h-[43px] w-full rounded-lg border border-solid border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600";
export default function HomeContentManagementTab() {
  const [type, setType] = useState("event");
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [editId, setEditId] = useState("");
  const [draft, setDraft] = useState(EMPTY_EVENT);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true);setError("");
    try { const data = await call("listTwoWeeksHomeAdmin"); setEvents(data.events||[]);setNotes(data.notes||[]); }
    catch(err) { setError(err?.message || "목록을 불러올 수 없습니다."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {load();}, [load]);
  const reset = (nextType = type) => {setEditId("");setType(nextType);setDraft(nextType === "event" ? { ...EMPTY_EVENT } : { ...EMPTY_NOTE });setNotice("");setError("");};
  const uploadImage = async (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) return setError("2MB 이하의 JPG, PNG, WEBP 파일만 선택해주세요.");
    setBusy(true);setError("");
    try {
      const base64 = await new Promise((resolve,reject) => {const reader = new FileReader();reader.onload=()=>resolve(String(reader.result||"").split(",")[1]);reader.onerror=()=>reject(new Error("파일을 읽을 수 없습니다."));reader.readAsDataURL(file);});
      const saved = await call("uploadTwoWeeksDatingNoteImage", { base64, contentType:file.type });
      setDraft(prev => ({...prev,thumbnailUrl:saved.thumbnailUrl,imagePath:saved.path}));
      setNotice("썸네일 업로드 완료. 아래 저장 버튼을 눌러주세요.");
    } catch(err) {setError(err?.message || "이미지 업로드에 실패했습니다.");}
    finally {setBusy(false);}
  };
  const save = async () => {
    setBusy(true);setError("");setNotice("");
    try {await call("saveTwoWeeksHomeContent",{type,id:editId,value:draft});setNotice("저장했어요.");await load();reset(type);setNotice("저장했어요.");}
    catch(err) {setError(err?.message||"저장에 실패했습니다.");}
    finally{setBusy(false);}
  };
  const remove = async(id) => {
    if (!window.confirm("이 콘텐츠를 삭제할까요?")) return;
    setBusy(true);setError("");
    try{await call("deleteTwoWeeksHomeContent",{type,id});await load();reset(type);}catch(err){setError(err?.message||"삭제 실패");}finally{setBusy(false);}
  };
  const rows = type === "event" ? events : notes;
  const input = (key,label,placeholder="") => <label className="block text-sm font-bold text-zinc-700" key={key}>{label}<input className={field} value={draft[key]||""} placeholder={placeholder} onChange={e=>setDraft(v=>({...v,[key]:e.target.value}))}/></label>;
  const textarea = (key,label) => <label className="block text-sm font-bold text-zinc-700" key={key}>{label}<textarea rows={3} className={field} value={draft[key]||""} onChange={e=>setDraft(v=>({...v,[key]:e.target.value}))}/></label>;
  return <div className="space-y-5 rounded-xl border border-solid border-zinc-300 bg-white p-5 shadow-sm">
    <div><h2 className="text-xl font-black">HOME 콘텐츠 관리</h2><p className="mt-1 text-sm text-zinc-500">이벤트와 연애노트는 관리자가 등록하고 활성화한 항목만 HOME에 표시됩니다.</p></div>
    <div className="flex gap-2">{[["event","친구추천 이벤트"],["note","윅키의 연애노트"]].map(([key,label])=><button type="button" key={key} onClick={()=>reset(key)} className={`rounded-lg px-4 py-3 text-sm font-bold ${type===key?"bg-blue-700 text-white":"bg-zinc-100"}`}>{label}</button>)}</div>
    {error?<div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>:null}
    {notice?<div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{notice}</div>:null}
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="space-y-3 rounded-lg border border-solid border-zinc-200 bg-zinc-50 p-4"><h3 className="font-black">{editId?"기존 콘텐츠 수정":"새 콘텐츠 등록"}</h3>
        {input("title","제목")}
        {type === "event" ? <>{textarea("description","HOME 안내 문구")}{input("rewardName","상품·혜택 이름")}{textarea("rewardDetails","혜택 상세")}{textarea("conditions","지급조건")}
          <div className="grid grid-cols-2 gap-2">{["startAt","endAt"].map((key)=><label className="text-sm font-bold" key={key}>{key === "startAt" ? "시작일" : "종료일"}<input type="date" className={field} value={draft[key]||""} onChange={e=>setDraft(v=>({...v,[key]:e.target.value}))}/></label>)}</div>
        </> : <>{input("instagramUrl","인스타그램 게시물 URL","https://www.instagram.com/p/...")}
          <label className="block text-sm font-bold">썸네일 직접 업로드 (2MB 이하)<input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full text-sm" disabled={busy} onChange={e=>uploadImage(e.target.files?.[0])}/></label>
          {draft.thumbnailUrl?<img src={draft.thumbnailUrl} alt="연애노트 미리보기" className="max-h-44 rounded-xl object-cover"/>:null}</>}
        <label className="block text-sm font-bold">노출 순서<input type="number" min="0" max="999" className={field} value={draft.sortOrder||0} onChange={e=>setDraft(v=>({...v,sortOrder:Number(e.target.value)}))}/></label>
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={draft.active===true} onChange={e=>setDraft(v=>({...v,active:e.target.checked}))}/>활성화하여 사용자 HOME에 공개</label>
        <div className="flex gap-2"><button disabled={busy} type="button" onClick={save} className="rounded-lg bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy?"처리 중...":"저장"}</button><button type="button" onClick={()=>reset(type)} className="rounded-lg border border-solid border-zinc-300 bg-white px-4 py-3 text-sm">초기화</button></div>
      </section>
      <section><h3 className="mb-3 font-black">등록 목록 ({rows.length})</h3>{loading?<p>불러오는 중...</p>:rows.length===0?<p className="text-sm text-zinc-500">등록된 콘텐츠가 없습니다.</p>:<div className="space-y-2">{rows.map(item=><div key={item.id} className="rounded-lg border border-solid border-zinc-300 bg-white p-3"><p className="text-sm font-bold">{item.title}</p><p className="my-1 text-xs text-zinc-500">{item.active?"공개 중":"비공개"} · 순서 {item.sortOrder||0}</p><div className="flex gap-3"><button type="button" className="text-sm font-bold text-blue-700" onClick={()=>{setEditId(item.id);setDraft(item);setError("");setNotice("");}}>수정</button><button type="button" className="text-sm font-bold text-red-600" onClick={()=>remove(item.id)}>삭제</button></div></div>)}</div>}</section>
    </div>
  </div>;
}

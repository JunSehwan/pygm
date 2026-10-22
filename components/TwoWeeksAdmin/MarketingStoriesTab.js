import { useMemo, useState } from "react";

const STATUS_LABELS = {
  pending: "공개 검토 대기",
  private_only: "비공개 저장",
  published: "공개중",
  hidden: "비공개 처리",
  not_continuing: "인연 종료",
};

function Card({ item, type, busy, onModerate }) {
  const canPublish = item.publishConsent === true && item.status !== "published";
  const [publicContent, setPublicContent] = useState(item.publicContent || item.content || "");
  return (
    <article className="border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-zinc-950 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">{type === "review" ? "이용후기" : "성공스토리"}</span>
            <span className="text-xs font-black text-zinc-500">{STATUS_LABELS[item.status] || item.status || "-"}</span>
            <span className="text-xs font-black text-emerald-700">✓ 실제 만남 확인</span>
          </div>
          <div className="mt-3 text-lg font-black text-zinc-950">{item.displayLabel || "익명 회원"}</div>
          {type === "review" ? <div className="mt-1 text-sm font-black text-amber-500">{"★".repeat(Number(item.rating || 0))}</div> : null}
          {type === "success_story" ? <div className="mt-1 text-xs font-bold text-zinc-400">관계 상태: {item.relationshipStatus || "-"}</div> : null}
        </div>
        <div className="text-right text-[11px] font-semibold text-zinc-400">{item.createdAtClient || ""}<br/>유입: {item.acquisitionSource || "direct"}</div>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-keep border-t border-zinc-100 pt-4 text-sm font-semibold leading-7 text-zinc-700">{item.content || "(작성 내용 없음)"}</p>
      {canPublish ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="text-xs font-black text-zinc-700">공개용 문구</div>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-zinc-400">실명·회사명·상대방을 특정할 수 있는 표현이 있으면 공개 전에 지워주세요.</p>
          <textarea value={publicContent} onChange={(event) => setPublicContent(event.target.value)} rows={type === "review" ? 5 : 7} className="mt-2 w-full border border-zinc-200 bg-zinc-50 p-3 text-sm font-semibold leading-6 outline-none focus:border-zinc-950" />
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
        <div className="text-xs font-semibold text-zinc-500">마케팅 공개 동의: <b className={item.publishConsent ? "text-emerald-700" : "text-zinc-400"}>{item.publishConsent ? "동의" : "비동의"}</b></div>
        <div className="flex gap-2">
          {canPublish ? <button disabled={busy} onClick={() => onModerate({ type, item, action: "publish", publicContent })} className="border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50">익명 공개</button> : null}
          {item.status === "published" ? <button disabled={busy} onClick={() => onModerate({ type, item, action: "hide" })} className="border border-zinc-300 bg-white px-3 py-2 text-xs font-black text-zinc-700 disabled:opacity-50">공개 내리기</button> : null}
        </div>
      </div>
    </article>
  );
}

export default function MarketingStoriesTab({ reviews = [], stories = [], onModerate, busyId = "" }) {
  const [filter, setFilter] = useState("all");
  const rows = useMemo(() => {
    const combined = [
      ...reviews.map((item) => ({ ...item, _type: "review" })),
      ...stories.map((item) => ({ ...item, _type: "success_story" })),
    ].sort((a,b) => Date.parse(b.createdAtClient || "") - Date.parse(a.createdAtClient || ""));
    if (filter === "pending") return combined.filter((item) => item.status === "pending");
    if (filter === "published") return combined.filter((item) => item.status === "published");
    if (filter === "review") return combined.filter((item) => item._type === "review");
    if (filter === "success_story") return combined.filter((item) => item._type === "success_story");
    return combined;
  }, [reviews, stories, filter]);

  return (
    <section className="grid gap-4">
      <div className="border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><div className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">MARKETING STORIES</div><h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">후기 / 성공사례 관리</h2><p className="mt-2 break-keep text-sm font-semibold leading-6 text-zinc-500">공개 동의한 콘텐츠만 검토 후 익명으로 공개합니다. 공개 데이터에는 실명·회사명·연락처·매칭ID가 포함되지 않습니다.</p></div>
          <div className="flex flex-wrap gap-2 text-xs font-black"><span className="bg-zinc-100 px-3 py-2">후기 {reviews.length}</span><span className="bg-orange-50 px-3 py-2 text-orange-700">성공사례 {stories.length}</span><span className="bg-emerald-50 px-3 py-2 text-emerald-700">검토대기 {[...reviews,...stories].filter((i) => i.status === "pending").length}</span></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{[["all","전체"],["pending","검토대기"],["published","공개중"],["review","후기"],["success_story","성공사례"]].map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`border px-3 py-2 text-xs font-black ${filter === value ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white border-solid text-zinc-500"}`}>{label}</button>)}</div>
      </div>
      {rows.length ? <div className="grid gap-4 lg:grid-cols-2">{rows.map((item) => <Card key={`${item._type}:${item.id}`} item={item} type={item._type} busy={busyId === `marketing:${item._type}:${item.id}`} onModerate={onModerate}/>)}</div> : <div className="border border-dashed border-zinc-300 bg-white p-10 text-center"><div className="text-lg font-black text-zinc-700">아직 등록된 후기나 성공사례가 없습니다.</div><p className="mt-2 text-sm font-semibold text-zinc-400">실제 만남 후 후기가 들어오면 이곳에서 검토할 수 있습니다.</p></div>}
    </section>
  );
}

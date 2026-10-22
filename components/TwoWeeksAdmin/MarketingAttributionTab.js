import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionButton, Section } from "./AdminCommon";
import {
  createTwoWeeksMarketingCampaign,
  getTwoWeeksMarketingDashboard,
  setTwoWeeksMarketingCampaignStatus,
  setTwoWeeksReferralResolution,
} from "./adminService";

const SOURCE_OPTIONS = [
  ["instagram", "인스타그램"],
  ["facebook", "페이스북"],
  ["naver_cafe", "네이버 카페"],
  ["munto", "문토"],
  ["frip", "프립"],
  ["danggeun", "당근"],
  ["open_chat", "오픈채팅"],
  ["offline", "오프라인/QR"],
  ["search", "검색"],
  ["referral", "추천"],
  ["other", "기타"],
];

const SOURCE_LABELS = Object.fromEntries([
  ...SOURCE_OPTIONS,
  ["instagram_facebook", "인스타그램/페이스북"],
  ["offline_qr", "오프라인/QR"],
  ["direct", "직접 유입"],
  ["record_none", "기록없음"],
]);

const REFERRAL_LABELS = {
  verified: "확인완료",
  needs_review: "확인필요",
  not_found: "확인불가",
  none: "추천인없음",
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ko-KR");
}

function SummaryCard({ label, value, suffix = "" }) {
  return (
    <div className="border border-zinc-200 bg-white p-4">
      <div className="text-xs font-black text-zinc-400">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.04em] text-zinc-950">{formatNumber(value)}{suffix}</div>
    </div>
  );
}

export default function MarketingAttributionTab() {
  const [period, setPeriod] = useState("all");
  const [view, setView] = useState("campaigns");
  const [dashboard, setDashboard] = useState({ summary: {}, campaigns: [], channels: [], referrals: [], referralPerformance: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [qr, setQr] = useState(null);
  const [referralFilter, setReferralFilter] = useState("all");
  const [form, setForm] = useState({ source: "offline", name: "", code: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDashboard(await getTwoWeeksMarketingDashboard(period));
    } catch (error) {
      console.error("[TwoWeeksAdmin] marketing dashboard load error:", error);
      alert(error?.message || "마케팅 유입 현황을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const createCampaign = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      alert("캠페인명과 캠페인 코드를 입력해주세요.");
      return;
    }
    setBusy("create");
    try {
      await createTwoWeeksMarketingCampaign(form);
      setForm((prev) => ({ ...prev, name: "", code: "", note: "" }));
      await load();
      alert("캠페인을 생성했습니다.");
    } catch (error) {
      alert(error?.message || "캠페인을 생성하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("유입 URL을 복사했습니다.");
    } catch {
      window.prompt("아래 주소를 복사해주세요.", url);
    }
  };

  const showQr = async (campaign) => {
    setBusy(`qr:${campaign.code}`);
    try {
      const qrCodeModule = await import("qrcode");
      const QRCode = qrCodeModule.default || qrCodeModule;
      const dataUrl = await QRCode.toDataURL(campaign.url, {
        width: 720,
        margin: 2,
        color: { dark: "#18181b", light: "#ffffff" },
      });
      setQr({ ...campaign, dataUrl });
    } catch (error) {
      console.error("[TwoWeeksAdmin] QR generation error:", error);
      alert("QR 이미지를 만들지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  const filteredReferrals = useMemo(
    () => (dashboard.referrals || []).filter((item) => referralFilter === "all" || item.status === referralFilter),
    [dashboard.referrals, referralFilter]
  );

  const resolveReferral = async (applicationId, referrerApplicationId = "", clear = false) => {
    setBusy(`referral:${applicationId}`);
    try {
      await setTwoWeeksReferralResolution({ applicationId, referrerApplicationId, clear });
      await load();
      alert(clear ? "추천인 연결을 해제했습니다." : "추천인을 연결했습니다.");
    } catch (error) {
      alert(error?.message || "추천인 관계를 처리하지 못했습니다.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="grid gap-4">
      <Section
        title="마케팅 유입"
        desc="캠페인 링크·QR부터 가입, 승인, 매칭 가능, 제안, 실제 만남 완료까지 확인합니다. 테스트·더미 신청자는 통계에서 제외됩니다."
        action={(
          <div className="flex flex-wrap gap-2">
            {[['all', '전체'], ['7d', '최근 7일'], ['30d', '최근 30일']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setPeriod(value)} className={`h-9 border px-3 text-xs font-black ${period === value ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-600"}`}>
                {label}
              </button>
            ))}
            <ActionButton onClick={load} disabled={loading} tone="light">새로고침</ActionButton>
          </div>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard label="고유 방문" value={dashboard.summary?.visits} />
          <SummaryCard label="가입" value={dashboard.summary?.signups} />
          <SummaryCard label="가입 전환율" value={dashboard.summary?.conversionRate} suffix="%" />
          <SummaryCard label="프로필 승인" value={dashboard.summary?.approved} />
          <SummaryCard label="매칭 제안" value={dashboard.summary?.proposed} />
          <SummaryCard label="만남 완료" value={dashboard.summary?.completed} />
        </div>
      </Section>

      <div className="flex gap-2">
        {[['campaigns', '캠페인·성과'], ['referrals', '추천인']].map(([value, label]) => (
          <button key={value} type="button" onClick={() => setView(value)} className={`h-11 border px-5 text-sm font-black ${view === value ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-600"}`}>
            {label}
          </button>
        ))}
      </div>

      {view === "campaigns" ? (
        <>
          <Section title="새 캠페인" desc="저장 즉시 링크와 QR을 만들 수 있으며 새 캠페인마다 코드를 배포할 필요가 없습니다.">
            <div className="grid gap-3 lg:grid-cols-[180px_1fr_220px_1fr_auto]">
              <select value={form.source} onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))} className="h-11 border border-zinc-200 bg-white px-3 text-sm font-bold">
                {SOURCE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input value={form.name} maxLength={80} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="캠페인명 (예: 신림 OO필라테스)" className="h-11 border border-zinc-200 px-3 text-sm font-bold" />
              <input value={form.code} maxLength={60} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") }))} placeholder="코드 (예: PILATES01)" className="h-11 border border-zinc-200 px-3 text-sm font-bold" />
              <input value={form.note} maxLength={240} onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))} placeholder="운영 메모 (선택)" className="h-11 border border-zinc-200 px-3 text-sm font-bold" />
              <ActionButton onClick={createCampaign} disabled={busy === "create"} tone="dark">생성</ActionButton>
            </div>
          </Section>

          <Section title="캠페인 성과" desc="방문은 캠페인별 동일 브라우저를 한 번만 집계합니다. 매칭 가능은 승인 후 회원별 예치금 충족 또는 면제 상태입니다.">
            <div className="overflow-x-auto border border-zinc-200">
              <table className="min-w-[1180px] w-full border-collapse text-left">
                <thead className="bg-zinc-950 text-white">
                  <tr>{["채널 / 캠페인", "상태", "방문", "가입", "승인", "매칭 가능", "제안", "만남 완료", "URL / QR"].map((head) => <th key={head} className="px-3 py-3 text-xs font-black">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {(dashboard.campaigns || []).map((campaign) => (
                    <tr key={campaign.code} className="border-b border-zinc-100">
                      <td className="px-3 py-3"><div className="font-black text-zinc-950">{campaign.name}</div><div className="mt-1 text-xs font-bold text-zinc-400">{SOURCE_LABELS[campaign.source] || campaign.source} · {campaign.code}{formatDate(campaign.createdAt) ? ` · ${formatDate(campaign.createdAt)}` : ""}</div>{campaign.note ? <div className="mt-1 max-w-[260px] truncate text-[11px] font-semibold text-zinc-400">{campaign.note}</div> : null}</td>
                      <td className="px-3 py-3"><button type="button" disabled={busy === `status:${campaign.code}`} onClick={async () => { setBusy(`status:${campaign.code}`); try { await setTwoWeeksMarketingCampaignStatus(campaign.code, !campaign.active); await load(); } catch (error) { alert(error?.message || "상태 변경 실패"); } finally { setBusy(""); } }} className={`border px-3 py-1.5 text-xs font-black ${campaign.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-100 text-zinc-500"}`}>{campaign.active ? "활성" : "비활성"}</button></td>
                      {["visits", "signups", "approved", "matchingEligible", "proposed", "completed"].map((key) => <td key={key} className="px-3 py-3 text-sm font-black text-zinc-700">{formatNumber(campaign[key])}</td>)}
                      <td className="px-3 py-3"><div className="flex gap-2"><ActionButton onClick={() => copyUrl(campaign.url)} tone="light">링크 복사</ActionButton><ActionButton onClick={() => showQr(campaign)} disabled={busy === `qr:${campaign.code}`} tone="dark">QR 보기</ActionButton></div></td>
                    </tr>
                  ))}
                  {!dashboard.campaigns?.length ? <tr><td colSpan={9} className="px-4 py-10 text-center text-sm font-bold text-zinc-400">생성된 캠페인이 없습니다.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="채널별 가입 성과" desc="직접 유입과 가입자가 직접 답한 유입경로는 서로 다른 값으로 유지됩니다.">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {(dashboard.channels || []).map((channel) => (
                <div key={channel.source} className="border border-zinc-200 bg-white p-4">
                  <div className="font-black text-zinc-950">{SOURCE_LABELS[channel.source] || channel.source}</div>
                  <div className="mt-2 text-xs font-bold leading-6 text-zinc-500">방문 {formatNumber(channel.visits)} · 가입 {formatNumber(channel.signups)} · 승인 {formatNumber(channel.approved)} · 제안 {formatNumber(channel.proposed)} · 완료 {formatNumber(channel.completed)}</div>
                </div>
              ))}
            </div>
          </Section>
        </>
      ) : (
        <div className="grid gap-4">
          <Section title="추천 성과" desc="추천으로 가입한 회원의 현재 전환상태만 집계하며 보상 지급 기능은 포함하지 않습니다.">
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {(dashboard.referralPerformance || []).map((item) => (
                <div key={item.referrerUid} className="border border-zinc-200 bg-white p-4">
                  <div className="font-black text-zinc-950">{item.referrerName}</div>
                  <div className="mt-2 text-xs font-bold leading-6 text-zinc-500">추천 가입 {item.signupCount} · 승인 {item.approvedCount} · 제안 {item.proposedCount} · 만남 완료 {item.completedCount}</div>
                </div>
              ))}
              {!dashboard.referralPerformance?.length ? <div className="border border-zinc-200 bg-white p-4 text-sm font-bold text-zinc-400">확인된 추천 성과가 없습니다.</div> : null}
            </div>
          </Section>

          <Section
            title="추천인 관리"
            desc="이름과 휴대폰 뒤 4자리가 정확히 한 명에게 일치할 때만 자동 연결합니다. 동명이인은 임의로 연결하지 않습니다."
            action={(
              <select value={referralFilter} onChange={(event) => setReferralFilter(event.target.value)} className="h-10 border border-zinc-200 bg-white px-3 text-sm font-bold">
                <option value="all">전체</option>
                {Object.entries(REFERRAL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            )}
          >
            <div className="grid gap-3">
              {filteredReferrals.map((item) => (
                <div key={item.applicationId} className="border border-zinc-200 bg-white p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-black text-zinc-950">{item.memberName} <span className="ml-2 text-xs text-zinc-400">{item.memberStatus}</span></div>
                      <div className="mt-1 text-xs font-bold text-zinc-500">입력: {item.referrerNameInput || "없음"}{item.referrerPhoneLast4Input ? ` · 뒤 ${item.referrerPhoneLast4Input}` : ""}</div>
                      <div className="mt-1 text-xs font-black text-orange-700">{REFERRAL_LABELS[item.status] || item.status}{item.verifiedReferrerName ? ` · ${item.verifiedReferrerName}` : ""}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(item.candidates || []).map((candidate) => (
                        <ActionButton key={candidate.applicationId} disabled={busy === `referral:${item.applicationId}`} onClick={() => resolveReferral(item.applicationId, candidate.applicationId)} tone="good">
                          {candidate.name} · {candidate.phoneLast4} 연결
                        </ActionButton>
                      ))}
                      {item.status !== "none" ? <ActionButton disabled={busy === `referral:${item.applicationId}`} onClick={() => resolveReferral(item.applicationId, "", true)} tone="light">추천인 없음 처리</ActionButton> : null}
                    </div>
                  </div>
                </div>
              ))}
              {!filteredReferrals.length ? <div className="border border-zinc-200 bg-white px-4 py-10 text-center text-sm font-bold text-zinc-400">표시할 추천인 정보가 없습니다.</div> : null}
            </div>
          </Section>
        </div>
      )}

      {qr ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-5" onClick={() => setQr(null)}>
          <div className="w-full max-w-md bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-xl font-black text-zinc-950">{qr.name}</div>
            <div className="mt-1 text-xs font-bold text-zinc-400">{qr.code}</div>
            <img src={qr.dataUrl} alt={`${qr.name} QR`} className="mx-auto mt-5 w-full max-w-[320px]" />
            <div className="mt-5 flex gap-2">
              <a href={qr.dataUrl} download={`twoweeks-${qr.code}.png`} className="flex h-11 flex-1 items-center justify-center bg-zinc-950 text-sm font-black text-white">QR 저장</a>
              <button type="button" onClick={() => setQr(null)} className="h-11 border border-zinc-200 px-5 text-sm font-black text-zinc-700">닫기</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


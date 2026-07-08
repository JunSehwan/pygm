import { Section, StatCard, StatusBadge } from "./AdminCommon";
import { formatDate } from "./utils";

export default function ResultsTab({ applications, responses, matches }) {
  const proposed = applications.filter((item) => item.currentProposal?.candidateApplicationId || item.matchingStatus === "proposed");
  const confirmed = applications.filter((item) => item.matchingStatus === "confirmed" || item.matchingStatus === "completed");

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="제안 발송" value={proposed.length} />
        <StatCard label="응답 수락" value={responses.filter((item) => item.response === "accepted").length} />
        <StatCard label="응답 거절" value={responses.filter((item) => item.response === "declined").length} />
        <StatCard label="확정/완료" value={confirmed.length} />
      </div>

      <Section title="응답 기록" desc="사용자가 후보 제안에 응답한 기록입니다.">
        <div className="overflow-x-auto border border-zinc-200">
          <table className="min-w-[960px] w-full text-left">
            <thead className="bg-zinc-950 text-white">
              <tr>
                {["응답", "신청자ID", "후보ID", "회차", "응답일"].map((head) => (
                  <th key={head} className="px-3 py-3 text-xs font-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {responses.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="px-3 py-3"><StatusBadge value={item.response || item.status} tone={item.response === "accepted" ? "good" : "bad"} /></td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{item.viewerApplicationId || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{item.candidateApplicationId || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{item.roundId || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{formatDate(item.respondedAt || item.createdAt)}</td>
                </tr>
              ))}
              {!responses.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm font-bold text-zinc-400">
                    응답 기록이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="매칭 저장 기록">
        <div className="overflow-x-auto border border-zinc-200">
          <table className="min-w-[960px] w-full text-left">
            <thead className="bg-zinc-950 text-white">
              <tr>
                {["상태", "남성", "여성", "점수", "회차", "생성일"].map((head) => (
                  <th key={head} className="px-3 py-3 text-xs font-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matches.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="px-3 py-3"><StatusBadge value={item.status || "proposed"} /></td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{item.maleName || item.maleApplicationId || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{item.femaleName || item.femaleApplicationId || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{Number.isFinite(item.scoreTotal) ? `${item.scoreTotal}점` : "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{item.roundId || "-"}</td>
                  <td className="px-3 py-3 text-sm font-bold text-zinc-700">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
              {!matches.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-zinc-400">
                    저장된 매칭 기록이 없습니다.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

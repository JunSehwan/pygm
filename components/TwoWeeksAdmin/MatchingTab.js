import { useMemo, useState } from "react";
import { ActionButton, FieldRow, InfoBox, Section } from "./AdminCommon";
import {
  buildHighScorePairs,
  cx,
  formatAgeBirth,
  formatBirthYear,
  getAdvisoryMatchingConflicts,
  getAdminMatchingMeta,
  getApplicationName,
  getHardMatchingBlockers,
  getMatchingAvailabilityBlockReason,
  getBasic,
  getIdentity,
  getPairScore,
  getProfilePhoto,
  getRoundId,
  isFemale,
  isMale,
  isMatchAvailableApplication,
  isApprovedApplication,
  isSameCompanyPair,
  normalizeArray,
} from "./utils";

function formatAgeGap(score = {}) {
  if (!Number.isFinite(Number(score?.ageDiff))) return "나이차 확인 필요";
  const signed = Number(score.ageDiff);
  if (signed === 0) return "동갑";
  return `나이차 ${Math.abs(signed)}세`;
}

function CandidateMiniCard({ application, selected, onClick, disabled = false }) {
  const basic = getBasic(application);
  const identity = getIdentity(application);
  const adminMeta = getAdminMatchingMeta(application);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(application)}
      className={cx(
        "w-full border border-solid p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-35",
        selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-slate-100 text-zinc-950 hover:border-zinc-950"
      )}
    >
      <div className="flex gap-3">
        {getProfilePhoto(application) ? (
          <img src={getProfilePhoto(application)} alt="" className="h-14 w-14 object-cover" />
        ) : (
          <div className="h-14 w-14 bg-zinc-100" />
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-black">{basic.name || basic.nickname || "-"}</div>
          <div className={cx("mt-1 text-xs font-semibold", selected ? "text-white/70" : "text-zinc-500")}>
            {formatAgeBirth(application)} · {identity.jobCategory || "-"}
          </div>
          <div className={cx("mt-1 truncate text-xs font-semibold", selected ? "text-white/70" : "text-zinc-400")}>
            {normalizeArray(basic.activityAreas).join(" · ") || "-"}
          </div>
          <div className={cx("mt-1 text-[11px] font-black", selected ? "text-orange-200" : "text-orange-600")}>
            내부 P{adminMeta.profileAppeal} · C{adminMeta.conditionCompetitiveness} · R{adminMeta.matchingReliability}
          </div>
        </div>
      </div>
    </button>
  );
}

function getPairKey(maleId = "", femaleId = "") {
  return `${maleId}__${femaleId}`;
}

function buildExistingPairSet(matches = []) {
  return new Set(
    matches
      .filter((match) => match?.maleApplicationId && match?.femaleApplicationId)
      .map((match) => getPairKey(match.maleApplicationId, match.femaleApplicationId))
  );
}

export default function MatchingTab({ applications, matches = [], onCreateMatch, onBulkCreateMatches, busyId }) {
  const eligibleApplications = applications.filter(isMatchAvailableApplication);
  const blockedApprovedApplications = applications
    .filter(isApprovedApplication)
    .filter((item) => !isMatchAvailableApplication(item))
    .map((item) => ({ item, reason: getMatchingAvailabilityBlockReason(item) }))
    .filter((entry) => entry.reason);
  const blockedReasonSummary = blockedApprovedApplications.reduce((acc, entry) => {
    acc[entry.reason] = (acc[entry.reason] || 0) + 1;
    return acc;
  }, {});
  const males = eligibleApplications.filter(isMale);
  const females = eligibleApplications.filter(isFemale);
  const existingPairSet = useMemo(() => buildExistingPairSet(matches), [matches]);
  const highScorePairs = useMemo(
    () => buildHighScorePairs(eligibleApplications, 999, { excludedPairKeys: existingPairSet }),
    [eligibleApplications, existingPairSet]
  );

  const [selectedMale, setSelectedMale] = useState(null);
  const [selectedFemale, setSelectedFemale] = useState(null);

  const male = selectedMale && males.some((item) => item.id === selectedMale.id) ? selectedMale : males[0] || null;
  const availableFemales = male
    ? females.filter(
        (item) =>
          getRoundId(item) === getRoundId(male) &&
          !existingPairSet.has(getPairKey(male.id, item.id)) &&
          !isSameCompanyPair(male, item)
      )
    : females;
  const female = selectedFemale && availableFemales.some((item) => item.id === selectedFemale.id)
    ? selectedFemale
    : availableFemales[0] || null;
  const score = male && female ? getPairScore(male, female) : null;
  const compatibilityConflicts = getAdvisoryMatchingConflicts(score);
  const hardBlockers = getHardMatchingBlockers(score);
  const duplicatePair = Boolean(male?.id && female?.id && existingPairSet.has(getPairKey(male.id, female.id)));
  const busy = busyId === "match" || busyId === "bulkMatch";

  return (
    <div className="grid gap-4">
      <Section
        title="자동 매칭"
        desc={`승인 + 입금확인 완료자 중 충돌 없는 후보 기준 · 기존 매칭 이력·동일 회사 제외 · 구성 가능 ${highScorePairs.length}쌍`}
        action={
          <ActionButton
            disabled={!highScorePairs.length || busy}
            onClick={() => onBulkCreateMatches(highScorePairs)}
            tone="dark"
          >
            고득점 일괄 매칭+문자
          </ActionButton>
        }
      >
        {Object.keys(blockedReasonSummary).length ? (
          <div className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-6 text-amber-900">
            <div className="font-black">승인자 중 매칭 후보 제외 사유</div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(blockedReasonSummary).map(([reason, count]) => (
                <span key={reason}>{reason} {count}명</span>
              ))}
            </div>
          </div>
        ) : null}
        {highScorePairs.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {highScorePairs.slice(0, 6).map((pair) => (
              <div key={`${pair.male.id}_${pair.female.id}`} className="border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-sm font-black text-zinc-950">
                  {getApplicationName(pair.male)} ↔ {getApplicationName(pair.female)}
                </div>
                <div className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-black ${Math.abs(Number(pair.score?.ageDiff || 0)) >= 8 ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                  {formatAgeGap(pair.score)}
                </div>
                <div className="mt-1 text-xs font-semibold text-zinc-500">
                  {pair.score.complete ? `기본 ${pair.score.total}점 · 추천 ${pair.score.rankingScore}점` : "추가정보 필요"} · 내부보정 {pair.score.internalAdjustment >= 0 ? "+" : ""}{pair.score.internalAdjustment || 0} · 지역 {pair.score.areaOverlap.join(" · ") || "-"} · 시간 {pair.score.timeOverlap.join(" · ") || "-"}
                </div>
                {pair.score?.reasons?.length ? (
                  <div className="mt-2 border-t border-zinc-200 pt-2 text-[11px] font-bold leading-5 text-zinc-700">
                    상대 공개 이유 · {pair.score.reasons.join(" / ")}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-50 p-6 text-center text-sm font-bold text-zinc-400">
            자동 매칭 가능한 승인/입금확인 완료 후보가 없습니다.
          </div>
        )}
      </Section>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_0.85fr_1fr]">
        <Section title="남성 후보" desc="승인 + 입금확인 완료 + 미제안 신청자만 표시됩니다.">
          <div className="grid max-h-[640px] gap-2 overflow-y-auto pr-1">
            {males.map((item) => (
              <CandidateMiniCard
                key={item.id}
                application={item}
                selected={male?.id === item.id}
                onClick={setSelectedMale}
              />
            ))}
          </div>
        </Section>

        <Section title="여성 후보" desc="현재 선택한 남성과 기존 매칭 이력이 있거나 같은 회사인 상대는 자동 제외됩니다.">
          <div className="grid max-h-[640px] gap-2 overflow-y-auto pr-1">
            {availableFemales.map((item) => (
              <CandidateMiniCard
                key={item.id}
                application={item}
                selected={female?.id === item.id}
                onClick={setSelectedFemale}
              />
            ))}
            {!availableFemales.length ? (
              <div className="border border-zinc-200 bg-zinc-50 p-5 text-center text-xs font-bold text-zinc-400">
                이 남성과 새로 매칭할 수 있는 여성 후보가 없습니다.
              </div>
            ) : null}
          </div>
        </Section>

        <Section
          title="수동 매칭 검토"
          desc="핵심 조건이 충돌해도 경고 내용을 확인한 뒤 관리자가 수동으로 매칭할 수 있습니다."
          action={
            <ActionButton
              disabled={!male || !female || duplicatePair || busy || !score?.complete || !score?.manualEligible}
              onClick={() => onCreateMatch(male, female, score)}
              tone={compatibilityConflicts.length ? "warn" : "dark"}
            >
              {compatibilityConflicts.length ? "충돌 확인 후 제안 저장+문자" : "후보 제안 저장+문자"}
            </ActionButton>
          }
        >
          {male && female ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <InfoBox label="기본 적합도" value={score ? (score.complete ? `${score.total}점` : "추가정보 필요") : "-"} tone="dark" />
                <InfoBox label="관리자 추천순위" value={score?.complete ? `${score.rankingScore}점 (${score.internalAdjustment >= 0 ? "+" : ""}${score.internalAdjustment || 0})` : "-"} />
                <InfoBox label="나이 차이" value={formatAgeGap(score)} tone={Math.abs(Number(score?.ageDiff || 0)) >= 8 ? "warn" : "dark"} />
                <InfoBox label="공통지역" value={score?.areaOverlap?.join(" · ") || "-"} />
              </div>

              {compatibilityConflicts.length ? (
                <div className="border border-amber-300 bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900">
                  <div>핵심 조건 충돌 안내: {compatibilityConflicts.map((item) => item.label).join(" · ")}</div>
                  <div className="mt-1 text-xs font-semibold text-amber-700">
                    자동 매칭에서는 제외되지만, 내용을 확인한 뒤 수동 매칭은 가능합니다.
                  </div>
                </div>
              ) : null}

              {hardBlockers.length ? (
                <div className="border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  매칭 불가: {hardBlockers.map((item) => item.label).join(" · ")}
                </div>
              ) : null}

              {score?.complete ? (
                <div className="grid gap-2">
                  <div className="border border-blue-200 bg-blue-50 p-3 text-xs font-semibold leading-6 text-blue-950">
                    <div className="font-black">상대 프로필에 자동 표시할 매칭 이유</div>
                    {score?.reasons?.length ? (
                      <ul className="mt-1 grid gap-1">
                        {score.reasons.map((reason) => (
                          <li key={reason}>· {reason}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-1 text-blue-700">공개 가능한 긍정 이유를 계산 중입니다.</div>
                    )}
                  </div>
                  <div className="border border-zinc-200 bg-zinc-50 p-3 text-xs font-semibold leading-6 text-zinc-600">
                    세부점수 · 지역 {score.breakdown.area}/20 · 시간 {score.breakdown.time}/20 · 나이 {score.breakdown.age}/15 · 결혼 {score.breakdown.marriage}/15 · 자녀 {score.breakdown.children}/15 · 흡연 {score.breakdown.smoking}/7 · 종교 {score.breakdown.religion}/5 · 음주 {score.breakdown.drinking}/3
                  </div>
                  <div className="border border-orange-200 bg-orange-50 p-3 text-xs font-semibold leading-6 text-orange-900">
                    내부 밸런스 보정 · 프로필 {score.adminRanking?.profileAdjustment >= 0 ? "+" : ""}{score.adminRanking?.profileAdjustment || 0} · 조건 {score.adminRanking?.conditionAdjustment >= 0 ? "+" : ""}{score.adminRanking?.conditionAdjustment || 0} · 신뢰도 {score.adminRanking?.reliabilityAdjustment >= 0 ? "+" : ""}{score.adminRanking?.reliabilityAdjustment || 0} · 총 {score.internalAdjustment >= 0 ? "+" : ""}{score.internalAdjustment || 0}
                    <div className="mt-1 font-medium text-orange-700">내부평가는 후보를 탈락시키지 않고 자동 추천 순서에만 작게 반영됩니다.</div>
                  </div>
                </div>
              ) : null}

              {duplicatePair ? (
                <div className="border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
                  이미 같은 상대와 매칭 이력이 있습니다. 중복 매칭은 생성할 수 없습니다.
                </div>
              ) : null}

              <div className="border border-zinc-200 px-4">
                <FieldRow label="남성" value={`${getApplicationName(male)} · ${formatAgeBirth(male)} · ${getIdentity(male).jobCategory || "-"}`} />
                <FieldRow label="여성" value={`${getApplicationName(female)} · ${formatAgeBirth(female)} · ${getIdentity(female).jobCategory || "-"}`} />
                <FieldRow label="시간" value={score?.timeOverlap?.join(" · ") || "-"} />
                <FieldRow label="지역" value={score?.areaOverlap?.join(" · ") || "-"} />
              </div>
            </div>
          ) : (
            <div className="bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-400">
              승인 + 입금확인 완료된 남성/여성 후보가 필요합니다.
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

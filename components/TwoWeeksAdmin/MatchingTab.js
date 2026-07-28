import { useMemo, useState } from "react";
import { ActionButton, FieldRow, InfoBox, Section } from "./AdminCommon";
import {
  buildHighScorePairs,
  cx,
  formatAgeBirth,
  formatBirthYear,
  getApplicationName,
  getBasic,
  getIdentity,
  getPairScore,
  getProfilePhoto,
  isFemale,
  isMale,
  isMatchAvailableApplication,
  normalizeArray,
} from "./utils";

function CandidateMiniCard({ application, selected, onClick }) {
  const basic = getBasic(application);
  const identity = getIdentity(application);

  return (
    <button
      type="button"
      onClick={() => onClick(application)}
      className={cx(
        "w-full border p-3 text-left transition",
        selected ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-950"
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
  const males = eligibleApplications.filter(isMale);
  const females = eligibleApplications.filter(isFemale);
  const existingPairSet = useMemo(() => buildExistingPairSet(matches), [matches]);
  const highScorePairs = useMemo(
    () =>
      buildHighScorePairs(eligibleApplications).filter(
        (pair) => !existingPairSet.has(getPairKey(pair.male.id, pair.female.id))
      ),
    [eligibleApplications, existingPairSet]
  );

  const [selectedMale, setSelectedMale] = useState(null);
  const [selectedFemale, setSelectedFemale] = useState(null);

  const male = selectedMale && males.some((item) => item.id === selectedMale.id) ? selectedMale : males[0] || null;
  const female = selectedFemale && females.some((item) => item.id === selectedFemale.id) ? selectedFemale : females[0] || null;
  const score = male && female ? getPairScore(male, female) : null;
  const duplicatePair = Boolean(male?.id && female?.id && existingPairSet.has(getPairKey(male.id, female.id)));
  const busy = busyId === "match" || busyId === "bulkMatch";

  return (
    <div className="grid gap-4">
      <Section
        title="자동 매칭"
        desc={`승인 + 입금확인 완료자 중 아직 제안되지 않은 후보 기준 · 기존 매칭 이력 제외 · 구성 가능 ${highScorePairs.length}쌍`}
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
        {highScorePairs.length ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {highScorePairs.slice(0, 6).map((pair) => (
              <div key={`${pair.male.id}_${pair.female.id}`} className="border border-zinc-200 bg-zinc-50 p-3">
                <div className="text-sm font-black text-zinc-950">
                  {getApplicationName(pair.male)} ↔ {getApplicationName(pair.female)}
                </div>
                <div className="mt-1 text-xs font-semibold text-zinc-500">
                  {pair.score.total}점 · 지역 {pair.score.areaOverlap.join(" · ") || "-"} · 시간 {pair.score.timeOverlap.join(" · ") || "-"}
                </div>
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

        <Section title="여성 후보" desc="승인 + 입금확인 완료 + 미제안 신청자만 표시됩니다.">
          <div className="grid max-h-[640px] gap-2 overflow-y-auto pr-1">
            {females.map((item) => (
              <CandidateMiniCard
                key={item.id}
                application={item}
                selected={female?.id === item.id}
                onClick={setSelectedFemale}
              />
            ))}
          </div>
        </Section>

        <Section
          title="수동 매칭 검토"
          desc="선택한 남녀 후보 제안을 저장합니다."
          action={
            <ActionButton
              disabled={!male || !female || duplicatePair || busy}
              onClick={() => onCreateMatch(male, female, score)}
              tone="dark"
            >
              후보 제안 저장+문자
            </ActionButton>
          }
        >
          {male && female ? (
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoBox label="점수" value={score ? `${score.total}점` : "-"} tone="dark" />
                <InfoBox label="나이차" value={score?.ageDiff === null ? "-" : `남성 +${score?.ageDiff || 0}세 기준`} />
                <InfoBox label="공통지역" value={score?.areaOverlap?.join(" · ") || "-"} />
              </div>

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

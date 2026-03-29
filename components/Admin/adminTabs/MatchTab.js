import React from "react";
import { PiHeartDuotone } from "react-icons/pi";
import { EmptyBlock, MiniBadge, SectionCard } from "../AdminCommon";
import {
  formatDateTime,
  formatLocationValue,
  getUserDisplayName,
  getUserMbti,
} from "../adminUtils";

function MatchCard({ item, usersById = {} }) {
  const femaleUser = usersById[item.femaleUid] || null;
  const maleUser = usersById[item.maleUid] || null;

  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <MiniBadge tone="violet">{item.status || "matched"}</MiniBadge>
        <MiniBadge>
          {item.contactStatus?.visible
            ? item.contactStatus?.dDayLabel || "연락처 공개중"
            : item.contactOpenStatus || "연락처 상태 확인 필요"}
        </MiniBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <UserInfoBlock
          label="여성"
          uid={item.femaleUid}
          user={femaleUser}
          fallbackName={item.femaleNickname}
        />

        <UserInfoBlock
          label="남성"
          uid={item.maleUid}
          user={maleUser}
          fallbackName={item.maleNickname}
        />
      </div>

      <div className="mt-4 rounded-md bg-slate-50 px-3 py-3 text-[13px] leading-6 text-slate-600">
        매칭 ID: {item.id || "-"}
        <br />
        생성일: {formatDateTime(item.createdAt || item.updatedAt)}
      </div>
    </div>
  );
}

function UserInfoBlock({ label, uid, user, fallbackName }) {
  const name = user ? getUserDisplayName(user) : fallbackName || "-";
  const mbti = user ? getUserMbti(user) : "-";
  const residence = user
    ? formatLocationValue(user.residence || {
      sido: user.address_sido,
      sigugun: user.address_sigugun,
    })
    : "-";
  const workArea = user
    ? formatLocationValue(
      user.workArea || {
        sido: user.company_location_sido,
        sigugun: user.company_location_sigugun,
      }
    )
    : "-";
  const job = user?.job || user?.company || "-";

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-[13px] font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-[18px] font-bold text-slate-900">{name}</div>
      <div className="mt-2 text-[14px] leading-6 text-slate-700">
        UID: {uid || "-"}
        <br />
        MBTI: {mbti || "-"}
        <br />
        거주지: {residence || "-"}
        <br />
        근무지: {workArea || "-"}
        <br />
        직업/회사: {job || "-"}
      </div>
    </div>
  );
}

export default function MatchTab({ matches, usersById = {} }) {
  return (
    <div className="space-y-4">
      <SectionCard
        icon={PiHeartDuotone}
        title="매칭 현황"
        description="최근 매칭 성사 건의 남녀 기본정보와 UID를 함께 확인할 수 있어요."
      >
        {matches.length ? (
          <div className="space-y-3">
            {matches.map((item) => (
              <MatchCard key={item.id} item={item} usersById={usersById} />
            ))}
          </div>
        ) : (
          <EmptyBlock text="표시할 매칭 성사 건이 없어요." />
        )}
      </SectionCard>
    </div>
  );
}
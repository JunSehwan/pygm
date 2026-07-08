export default function FilterBar({
  keyword,
  setKeyword,
  roundFilter,
  setRoundFilter,
  genderFilter,
  setGenderFilter,
  reviewFilter,
  setReviewFilter,
  rounds,
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr]">
      <input
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="이름, 닉네임, 연락처, 직업, 지역 검색"
        className="h-11 border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none focus:border-zinc-950"
      />

      <select
        value={roundFilter}
        onChange={(event) => setRoundFilter(event.target.value)}
        className="h-11 border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none focus:border-zinc-950"
      >
        <option value="all">전체 회차</option>
        {rounds.map((roundId) => (
          <option key={roundId} value={roundId}>
            {roundId}
          </option>
        ))}
      </select>

      <select
        value={genderFilter}
        onChange={(event) => setGenderFilter(event.target.value)}
        className="h-11 border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none focus:border-zinc-950"
      >
        <option value="all">성별 전체</option>
        <option value="male">남성</option>
        <option value="female">여성</option>
      </select>

      <select
        value={reviewFilter}
        onChange={(event) => setReviewFilter(event.target.value)}
        className="h-11 border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none focus:border-zinc-950"
      >
        <option value="all">검토 전체</option>
        <option value="pending">검토 대기</option>
        <option value="reviewing">검토 중</option>
        <option value="approved">승인</option>
        <option value="rejected">반려</option>
        <option value="waitlisted">대기풀</option>
      </select>
    </div>
  );
}

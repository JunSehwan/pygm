function Message({ type, children }) {
  if (!children) return null;
  const cls =
    type === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  return <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${cls}`}>{children}</div>;
}

export default function IdentityUpgradeGate({ application, loading, error, notice, onVerify, onUsePhoneLookup }) {
  const basic = application?.basic || {};
  const phone = basic.phone || basic.phoneNormalized || application?.phoneIdentityVerification?.phone || "";
  const name = basic.name || basic.nickname || "회원";

  return (
    <section className="mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-6xl items-center gap-8 px-5 py-10 md:min-h-[calc(100svh-80px)] md:grid-cols-[0.95fr_1.05fr] md:px-8">
      <div>
        <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70">기존 회원 본인확인</div>
        <h1 className="mt-5 text-[38px] font-bold leading-tight text-white md:text-[58px]">
          한 번만 본인인증하면<br />계속 이용할 수 있어요.
        </h1>
        <p className="mt-5 max-w-xl break-keep text-base leading-8 text-zinc-300 md:text-lg">
          투윅스의 보안 기준이 강화되어 기존 가입 회원도 최초 1회 본인인증이 필요합니다. 인증이 끝나면 기존 신청·매칭·예치금 정보는 그대로 유지됩니다.
        </p>
      </div>

      <div className="rounded-[34px] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl md:p-8">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">IDENTITY CHECK</div>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">안전한 실제 만남을 위한 본인인증</h2>
        <p className="mt-3 break-keep text-sm font-semibold leading-6 text-zinc-300">
          {name}님의 기존 신청정보와 본인인증 결과가 일치하는지 서버에서 확인합니다. 새로 가입할 필요는 없습니다.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-xs font-bold text-zinc-500">등록 연락처</div>
          <div className="mt-1 text-base font-black text-white">{phone || "등록된 연락처"}</div>
        </div>

        <Message type="success">{notice}</Message>
        <Message type="error">{error}</Message>

        <button
          type="button"
          onClick={onVerify}
          disabled={loading}
          className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "본인인증 확인 중..." : "본인인증하고 신청현황 보기"}
        </button>

        <button
          type="button"
          onClick={onUsePhoneLookup}
          disabled={loading}
          className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 px-6 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          다른 번호로 신청현황 조회
        </button>

        <p className="mt-5 break-keep text-xs font-semibold leading-5 text-zinc-500">
          본인인증은 신원 확인과 안전한 서비스 운영을 위해 사용되며, 기존 프로필이나 매칭 결과를 새로 만들지 않습니다.
        </p>
      </div>
    </section>
  );
}

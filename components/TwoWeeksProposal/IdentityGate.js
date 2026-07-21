function Message({ type, children }) {
  if (!children) return null;

  const cls =
    type === "error"
      ? "border-red-400/20 bg-red-500/10 text-red-100"
      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";

  return (
    <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 ${cls}`}>
      {children}
    </div>
  );
}

export default function IdentityGate({
  loading,
  error,
  notice,
  phone,
  code,
  codeSent,
  sendingCode,
  verifyingCode,
  onPhoneChange,
  onCodeChange,
  onSendCode,
  onVerifyCode,
}) {
  const busy = loading || sendingCode || verifyingCode;

  return (
    <section className="mx-auto grid min-h-[calc(100svh-64px)] w-full max-w-6xl items-center gap-8 px-5 py-10 md:min-h-[calc(100svh-80px)] md:grid-cols-[0.95fr_1.05fr] md:px-8">
      <div>
        <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70">
          신청 현황 조회
        </div>

        <h1 className="mt-5 text-[38px] font-black leading-tight tracking-[-0.06em] text-white md:text-[60px]">
          신청 현황을
          <br />
          확인하세요
        </h1>

        <p className="mt-5 max-w-xl break-keep text-base leading-8 text-zinc-300 md:text-lg">
          휴대폰 번호 인증 후 확인할 수 있습니다.
        </p>
      </div>

      <div className="rounded-[34px] border border-white/10 bg-white/[0.055] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.36)] backdrop-blur-xl md:p-8">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-white">
          휴대폰 번호로 조회
        </h2>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-bold text-zinc-400">휴대폰 번호</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => onPhoneChange?.(event.target.value)}
            placeholder="010-0000-0000"
            inputMode="tel"
            autoComplete="tel"
            disabled={busy}
            className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400 disabled:opacity-60"
          />
        </label>

        {codeSent ? (
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold text-zinc-400">인증번호</span>
            <input
              type="tel"
              value={code}
              onChange={(event) => onCodeChange?.(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="6자리 입력"
              inputMode="numeric"
              disabled={busy}
              className="h-14 w-full rounded-2xl border border-white/10 bg-black/35 px-4 text-base font-bold text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-400 disabled:opacity-60"
            />
          </label>
        ) : null}

        <Message type="success">{notice}</Message>
        <Message type="error">{error}</Message>

        <div className="mt-7 grid gap-3">
          {!codeSent ? (
            <button
              type="button"
              onClick={onSendCode}
              disabled={busy}
              className="inline-flex h-14 w-full items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingCode ? "발송 중..." : "인증번호 받기"}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onVerifyCode}
                disabled={busy}
                className="inline-flex h-14 w-full items-center justify-center rounded-full bg-orange-500 px-6 text-sm font-black text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifyingCode ? "확인 중..." : "신청 현황 확인하기"}
              </button>

              <button
                type="button"
                onClick={onSendCode}
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center rounded-full border border-white/10 px-6 text-sm font-bold text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-60"
              >
                인증번호 다시 받기
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Message({ type, children }) {
  if (!children) return null;
  return <div role={type === "error" ? "alert" : "status"} className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium leading-6 ${type === "error" ? "bg-red-50 text-red-700" : "bg-[#eef5ff] text-[#315e9d]"}`}>{children}</div>;
}

export default function IdentityGate({ loading, error, notice, phone, code, codeSent, sendingCode, verifyingCode, onPhoneChange, onCodeChange, onSendCode, onVerifyCode }) {
  const busy = loading || sendingCode || verifyingCode;
  return (
    <section className="mx-auto flex min-h-[calc(100svh-76px)] w-full max-w-[640px] flex-col justify-center px-4 py-9 sm:px-5">
      <div className="mb-6 flex items-center gap-3">
        <img src="/images/twoweeks/wicky/wicky-phone.png" alt="윅키" className="wicky-float h-12 w-12 object-contain"/>
        <div><p className="text-sm font-bold text-[#326bda]">윅키의 안내</p><p className="break-keep text-sm leading-6 text-[#516983]">문자로 받은 6자리 인증번호를 입력하면 바로 확인할 수 있어요.</p></div>
      </div>
      <div className="rounded-[24px] border border-[#e3ebf6] bg-white p-6 shadow-[0_12px_40px_rgba(21,53,100,.06)] sm:p-8">
        <p className="text-xs font-extrabold text-[#326bda]">신청현황 조회</p>
        <h1 className="mt-3 break-keep text-[28px] font-black leading-tight tracking-[-.05em] text-[#132942]">휴대폰 번호로<br/>내 신청현황을 확인해요.</h1>
        <p className="mt-3 break-keep text-sm leading-6 text-[#708199]">가입할 때 사용한 휴대폰 번호를 입력해주세요.</p>
        <form onSubmit={(event) => {event.preventDefault(); if(!busy) (codeSent ? onVerifyCode : onSendCode)?.();}}>
          <label className="mt-7 block"><span className="mb-2 block text-sm font-bold text-[#273c5c]">휴대폰 번호</span>
            <input type="tel" value={phone} onChange={event=>onPhoneChange?.(event.target.value)} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" disabled={busy} className="h-14 w-full rounded-xl border border-[#d4e0ef] bg-white px-4 text-base font-semibold text-[#142d4a] outline-none placeholder:text-[#9dabbf] focus:border-[#326bda] disabled:opacity-60"/>
          </label>
          {codeSent ? <label className="mt-4 block"><span className="mb-2 block text-sm font-bold text-[#273c5c]">인증번호 6자리</span>
            <input type="text" value={code} onChange={event=>onCodeChange?.(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))} placeholder="숫자 6자리" inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={busy} className="h-14 w-full rounded-xl border border-[#d4e0ef] bg-white px-4 text-base font-bold tracking-widest text-[#142d4a] outline-none placeholder:tracking-normal placeholder:text-[#9dabbf] focus:border-[#326bda] disabled:opacity-60"/>
          </label> : null}
          <Message type="success">{notice}</Message><Message type="error">{error}</Message>
          <button type="submit" disabled={busy || (codeSent && code.length !== 6)} className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#326bda] px-5 text-sm font-extrabold text-white transition hover:bg-[#285ac0] disabled:cursor-not-allowed disabled:opacity-50">{sendingCode ? "인증번호 보내는 중..." : verifyingCode ? "확인 중..." : codeSent ? "내 신청현황 확인하기" : "인증번호 받기"}</button>
          {codeSent ? <button type="button" onClick={onSendCode} disabled={busy} className="mt-3 min-h-[44px] w-full text-sm font-semibold text-[#61748d] disabled:opacity-50">인증번호 다시 받기</button> : null}
        </form>
      </div>
      <style jsx>{`.wicky-float {animation: wickyFloat 3.6s ease-in-out infinite} @keyframes wickyFloat {0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)}} @media(prefers-reduced-motion:reduce){.wicky-float{animation:none}}`}</style>
    </section>
  );
}

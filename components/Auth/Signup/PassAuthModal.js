import React, { useMemo, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { requestPortoneIdentityVerification } from "lib/portoneIdentity";

const telecomOptions = [
  { key: "skt", label: "SKT" },
  { key: "kt", label: "KT" },
  { key: "lgu", label: "LG U+" },
  { key: "mvno", label: "알뜰폰" },
];

const initialAgreements = {
  all: false,
  privacy: false,
  unique: false,
  service: false,
  telecom: false,
};

export default function PassAuthModal({ open, tel, name, onClose, onSuccess }) {
  const [selectedTelecom, setSelectedTelecom] = useState("lgu");
  const [agreements, setAgreements] = useState(initialAgreements);
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState("");

  const allRequiredChecked =
    agreements.privacy &&
    agreements.unique &&
    agreements.service &&
    agreements.telecom;

  const selectedLabel = useMemo(() => {
    return telecomOptions.find((v) => v.key === selectedTelecom)?.label || "";
  }, [selectedTelecom]);

  if (!open) return null;

  const toggleAgreement = (key) => {
    if (key === "all") {
      const next = !agreements.all;
      setAgreements({
        all: next,
        privacy: next,
        unique: next,
        service: next,
        telecom: next,
      });
      return;
    }

    const next = { ...agreements, [key]: !agreements[key] };
    next.all = next.privacy && next.unique && next.service && next.telecom;
    setAgreements(next);
  };

  const verifyWithServer = async (identityVerificationId) => {
    const functions = getFunctions();
    const verifyIdentityResult = httpsCallable(functions, "verifyIdentityResult");

    const result = await verifyIdentityResult({
      identityVerificationId,
      requestedPhone: tel,
      requestedCarrier: selectedTelecom,
    });

    return result?.data;
  };

  const handlePortOneIdentity = async (methodLabel) => {
    setInlineError("");

    if (!selectedTelecom) {
      setInlineError("통신사를 선택해주세요.");
      return;
    }
    if (!allRequiredChecked) {
      setInlineError("필수 약관에 동의해주세요.");
      return;
    }

    try {
      setLoading(true);

      // 1) 포트원 SDK 호출 (throw safe wrapper)
      const sdkResult = await requestPortoneIdentityVerification({
        phone: tel,
        name,
        carrier: selectedTelecom,
      });


      if (!sdkResult?.ok) {
        // ✅ 여기서 빨간 오버레이 대신 사용자 메시지로 처리
        const msg =
          sdkResult?.message ||
          "본인인증 창 호출에 실패했습니다. 채널 설정을 확인해주세요.";

        setInlineError(msg);
        alert(`[본인인증 실패]\n${msg}`);
        return;
      }

      // 2) 서버 검증
      const verified = await verifyWithServer(sdkResult.identityVerificationId);


      if (!verified?.verified) {
        const msg = verified?.message || "본인인증 검증에 실패했습니다.";
        setInlineError(msg);
        alert(`[본인인증 검증 실패]\n${msg}`);
        return;
      }

      // 3) 부모(Signup.js)에 payload 전달
      onSuccess({
        verified: true,
        provider: "PORTONE",
        method: methodLabel,
        phone: verified.phone || tel,
        name: verified.name || "",
        birth: verified.birth || "",
        gender: verified.gender || "",
        carrier: verified.carrier || selectedLabel,
        ci: verified.ci || "",
        di: verified.di || "",
      });
    } catch (e) {
      // 여기까지 오면 우리가 예상 못한 에러
      const msg = e?.message || "본인인증 중 알 수 없는 오류가 발생했습니다.";
      setInlineError(msg);
      alert(`[본인인증 오류]\n${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[380px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              PASS 인증
            </p>
            <h2 className="text-base font-extrabold text-slate-900">본인인증</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 disabled:opacity-50"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">
            이용중이신 통신사를 선택해주세요.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {telecomOptions.map((item) => {
              const active = selectedTelecom === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  disabled={loading}
                  onClick={() => setSelectedTelecom(item.key)}
                  className={`flex h-[84px] items-center justify-center rounded-2xl border text-sm font-bold transition disabled:opacity-50 ${active
                      ? "border-rose-400 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-700"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <button
              type="button"
              onClick={() => toggleAgreement("all")}
              disabled={loading}
              className="mb-3 flex w-full items-center gap-2 text-left disabled:opacity-50"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${agreements.all
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-transparent"
                  }`}
              >
                ✓
              </span>
              <span className="text-sm font-bold text-slate-900">전체 동의하기</span>
            </button>

            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              <AgreementItem checked={agreements.privacy} onClick={() => toggleAgreement("privacy")} label="개인정보이용동의" disabled={loading} />
              <AgreementItem checked={agreements.unique} onClick={() => toggleAgreement("unique")} label="고유식별정보처리동의" disabled={loading} />
              <AgreementItem checked={agreements.service} onClick={() => toggleAgreement("service")} label="서비스이용약관동의" disabled={loading} />
              <AgreementItem checked={agreements.telecom} onClick={() => toggleAgreement("telecom")} label="통신사이용약관동의" disabled={loading} />
            </div>
          </div>

          {inlineError ? (
            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <p className="text-[12px] leading-4 text-rose-600">{inlineError}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">
                채널이 본인인증용인지, storeId/channelKey 조합이 맞는지 확인해주세요.
              </p>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handlePortOneIdentity("PASS")}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-rose-500 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "인증 진행 중..." : "PASS로 인증하기"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handlePortOneIdentity("SMS")}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-700 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "인증 진행 중..." : "문자(SMS)로 인증하기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgreementItem({ checked, onClick, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 text-left disabled:opacity-50"
    >
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${checked
            ? "border-slate-700 bg-slate-700 text-white"
            : "border-slate-300 bg-white text-transparent"
          }`}
      >
        ✓
      </span>
      <span className="text-[12px] text-slate-600">{label}</span>
    </button>
  );
}
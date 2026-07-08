import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import RegisterLayout from "./RegisterLayout";
import Step1BasicForm from "./Step1BasicForm";
import Step2VerificationForm from "./Step2VerificationForm";
import Step3ConsentForm from "./Step3ConsentForm";
import { INITIAL_FORM, TWOWEEKS_COMPLETE_PATH } from "./constants";
import { focusFirstError, formatPhone, normalizePhone, validateStep1, validateStep2, validateStep3 } from "./helpers";
import { createTwoWeeksApplication } from "./twoweeksApplicationService";
import { requestPortoneIdentityVerification } from "lib/portoneIdentity";
import {
  clearPendingIdentityVerification,
  createIdentityVerificationId,
  prepareIdentityVerificationPending,
  verifyIdentityResultWithServer,
} from "lib/identityVerificationClient";
import {
  birthYearFromIdentityBirth,
  buildIdentityData,
  clearTwoWeeksDraft,
  normalizeGender,
  readTwoWeeksDraft,
  TWOWEEKS_IDENTITY_SOURCE,
  writeTwoWeeksDraft,
} from "./identityVerification";

function SubmitOverlay({ visible, progress, message, tone = "loading" }) {
  if (!visible) return null;

  const isError = tone === "error";
  const isSuccess = tone === "success";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-[28px] bg-white p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black ${
            isError ? "bg-red-50 text-red-500" : isSuccess ? "bg-emerald-50 text-emerald-500" : "bg-black text-white"
          }`}
        >
          {isError ? "!" : isSuccess ? "✓" : "↑"}
        </div>

        <div className="mt-5 whitespace-pre-line text-lg font-black tracking-[-0.03em] text-slate-950">{message || "업로드 중입니다."}</div>

        {!isError ? (
          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-black transition-all duration-300" style={{ width: `${Math.max(0, Math.min(progress || 0, 100))}%` }} />
            </div>
            <div className="mt-2 text-xs font-semibold text-slate-500">{progress || 0}%</div>
          </div>
        ) : null}

        <p className="mt-4 break-keep text-xs leading-5 text-slate-500">
          사진과 인증 자료를 안전하게 저장하고 있습니다. 창을 닫지 말고 잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}

function IdentityProcessingOverlay({ message }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
      <div className="w-full max-w-[360px] rounded-[28px] bg-white p-7 text-center shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl font-black text-white">
          ✓
        </div>
        <div className="mt-5 whitespace-pre-line text-lg font-black tracking-[-0.03em] text-slate-950">
          {message}
        </div>
        <p className="mt-4 break-keep text-xs leading-5 text-slate-500">
          차밍수프와 동일한 본인인증 방식으로 진행됩니다. 인증창을 닫지 말고 잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}

function mergeDraftForm(draftForm = {}, currentForm = INITIAL_FORM) {
  return {
    ...currentForm,
    ...draftForm,
    representativePhoto: currentForm.representativePhoto,
    additionalPhotos: currentForm.additionalPhotos,
    verificationDocument: currentForm.verificationDocument,
    consents: {
      ...currentForm.consents,
      ...(draftForm.consents || {}),
    },
  };
}

export default function TwoWeeksRegister() {
  const router = useRouter();
  const processingIdvRef = useRef("");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => {
    const draft = typeof window !== "undefined" ? readTwoWeeksDraft() : null;
    return draft?.form ? mergeDraftForm(draft.form, INITIAL_FORM) : INITIAL_FORM;
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitTone, setSubmitTone] = useState("loading");
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const [identityError, setIdentityError] = useState("");

  const validators = useMemo(() => ({ 1: validateStep1, 2: validateStep2, 3: validateStep3 }), []);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleErrors = (nextErrors) => {
    setErrors(nextErrors);
    focusFirstError();
  };

  const applyVerifiedIdentity = useCallback((verifiedPayload, fallbackPhone = "") => {
    const nextIdentityData = buildIdentityData(verifiedPayload, fallbackPhone);

    if (!nextIdentityData?.verified) {
      const message = nextIdentityData?.message || "본인인증 결과가 유효하지 않습니다.";
      setIdentityError(message);
      setErrors((prev) => ({ ...prev, phoneVerify: message }));
      return false;
    }

    const verifiedPhone = normalizePhone(nextIdentityData.phone || fallbackPhone || "");
    const verifiedGender = normalizeGender(nextIdentityData.gender || "");
    const verifiedBirthYear = birthYearFromIdentityBirth(nextIdentityData.birth || "");

    setForm((prev) => ({
      ...prev,
      name: nextIdentityData.name || prev.name,
      gender: verifiedGender || prev.gender,
      birthYear: verifiedBirthYear || prev.birthYear,
      phone: verifiedPhone ? formatPhone(verifiedPhone) : prev.phone,
      phoneVerified: true,
      phoneVerificationSkipped: false,
      identityVerifiedData: nextIdentityData,
    }));

    setIdentityError("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.phoneVerify;
      delete next.phone;
      delete next.name;
      delete next.gender;
      delete next.birthYear;
      return next;
    });

    return true;
  }, []);

  const handleIdentityVerify = useCallback(async () => {
    const enteredPhone = normalizePhone(form.phone);

    if (!form.name?.trim()) {
      handleErrors({ name: "본인인증을 위해 이름을 먼저 입력해주세요." });
      return;
    }

    if (!enteredPhone) {
      handleErrors({ phone: "본인인증을 위해 연락처를 먼저 입력해주세요." });
      return;
    }

    try {
      setIdentityLoading(true);
      setIdentityError("");
      setIdentityMessage("본인인증 창을 준비하고 있어요.");

      const identityVerificationId = createIdentityVerificationId("twoweeks");
      const redirectUrl = `${window.location.origin}/2weeks/register?idv=${encodeURIComponent(identityVerificationId)}`;

      writeTwoWeeksDraft({
        form,
        pendingIdentityVerificationId: identityVerificationId,
        pendingIdentityStartedAt: Date.now(),
        requestedPhone: enteredPhone,
      });

      prepareIdentityVerificationPending({
        source: TWOWEEKS_IDENTITY_SOURCE,
        returnUrl: redirectUrl,
        requestedPhone: enteredPhone,
        requestedCarrier: "",
        identityVerificationId,
      });

      setIdentityMessage("본인인증을 진행 중이에요.\n인증창을 닫지 말고 기다려주세요.");

      const sdkResult = await requestPortoneIdentityVerification({
        phone: enteredPhone,
        name: form.name,
        source: TWOWEEKS_IDENTITY_SOURCE,
        identityVerificationId,
        redirectUrl,
        timeoutMs: 30000,
      });

      if (!sdkResult?.ok) {
        const message = sdkResult?.message || "본인인증이 완료되지 않았습니다. 다시 진행해주세요.";
        setIdentityError(message);
        setErrors((prev) => ({ ...prev, phoneVerify: message }));
        clearPendingIdentityVerification();
        return;
      }

      setIdentityMessage("본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요.");

      const verified = await verifyIdentityResultWithServer({
        identityVerificationId: sdkResult.identityVerificationId || identityVerificationId,
        requestedPhone: enteredPhone,
      });

      if (!verified?.verified) {
        const message = verified?.message || "본인인증 검증에 실패했습니다.";
        setIdentityError(message);
        setErrors((prev) => ({ ...prev, phoneVerify: message }));
        clearPendingIdentityVerification();
        return;
      }

      setIdentityMessage("인증 정보를 적용하고 있어요.\n거의 완료됐어요.");
      const ok = applyVerifiedIdentity(verified, enteredPhone);

      if (ok) {
        clearPendingIdentityVerification();
        writeTwoWeeksDraft({
          form: {
            ...form,
            phoneVerified: true,
            phoneVerificationSkipped: false,
          },
          identityVerifiedData: verified,
        });
      }
    } catch (error) {
      console.error("[TwoWeeksRegister] identity verify error:", error);
      const message = error?.message || "본인인증 중 오류가 발생했습니다.";
      setIdentityError(message);
      setErrors((prev) => ({ ...prev, phoneVerify: message }));
      clearPendingIdentityVerification();
    } finally {
      setIdentityLoading(false);
      setIdentityMessage("");
    }
  }, [applyVerifiedIdentity, form]);

  useEffect(() => {
    if (!router.isReady) return;

    const queryIdv = router.query?.idv || router.query?.identityVerificationId || router.query?.identity_verification_id || router.query?.id || "";
    const identityVerificationId = Array.isArray(queryIdv) ? queryIdv[0] : String(queryIdv || "");

    if (!identityVerificationId) return;
    if (processingIdvRef.current === identityVerificationId) return;

    processingIdvRef.current = identityVerificationId;

    const draft = readTwoWeeksDraft();
    const requestedPhone = normalizePhone(draft?.requestedPhone || draft?.form?.phone || form.phone || "");

    if (draft?.form) {
      setForm((prev) => mergeDraftForm(draft.form, prev));
    }

    (async () => {
      try {
        setIdentityLoading(true);
        setIdentityMessage("본인인증 결과를 확인하고 있어요.\n잠시만 기다려주세요.");
        setIdentityError("");

        const verified = await verifyIdentityResultWithServer({
          identityVerificationId,
          requestedPhone,
        });

        if (!verified?.verified) {
          const message = verified?.message || "본인인증 검증에 실패했습니다.";
          setIdentityError(message);
          setErrors((prev) => ({ ...prev, phoneVerify: message }));
          clearPendingIdentityVerification();
          return;
        }

        setIdentityMessage("인증 정보를 적용하고 있어요.\n거의 완료됐어요.");
        const ok = applyVerifiedIdentity(verified, requestedPhone);

        if (ok) {
          clearPendingIdentityVerification();
        }
      } catch (error) {
        console.error("[TwoWeeksRegister] idv redirect verify error:", error);
        const message = error?.message || "본인인증 결과 처리 중 오류가 발생했습니다.";
        setIdentityError(message);
        setErrors((prev) => ({ ...prev, phoneVerify: message }));
      } finally {
        setIdentityLoading(false);
        setIdentityMessage("");
        router.replace("/2weeks/register", undefined, { shallow: true });
      }
    })();
    // form은 fallback 용도라 의존성에서 제외
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query, applyVerifiedIdentity]);

  const goNext = () => {
    const nextErrors = validators[step]?.(form) || {};

    if (Object.keys(nextErrors).length) {
      handleErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep((prev) => Math.min(prev + 1, 3));
    scrollToTop();
  };

  const submit = async () => {
    const nextErrors = validateStep3(form);

    if (Object.keys(nextErrors).length) {
      handleErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    setSubmitTone("loading");
    setSubmitMessage("업로드 준비 중입니다.");

    try {
      const result = await createTwoWeeksApplication(form, {
        onUploadProgress: setUploadProgress,
        onStatusChange: setSubmitMessage,
      });

      setSubmitTone("success");
      setSubmitMessage("신청 저장 완료");
      setUploadProgress(100);
      clearTwoWeeksDraft();

      await new Promise((resolve) => setTimeout(resolve, 650));

      const completeParams = new URLSearchParams({ applicationId: result.applicationId });
      if (result.dashboardToken) completeParams.set("token", result.dashboardToken);

      await router.push(`${TWOWEEKS_COMPLETE_PATH}?${completeParams.toString()}`);
    } catch (error) {
      console.error("[TwoWeeksRegister] submit error:", error);
      setSubmitTone("error");
      setSubmitMessage("업로드 실패");
      setTimeout(() => {
        setSubmitting(false);
        setSubmitMessage("");
        setUploadProgress(0);
        setSubmitTone("loading");
      }, 1800);
    }
  };

  return (
    <RegisterLayout>
      {step === 1 ? (
        <Step1BasicForm
          form={form}
          setForm={setForm}
          errors={errors}
          onNext={goNext}
          onIdentityVerify={handleIdentityVerify}
          identityLoading={identityLoading}
          identityError={identityError}
        />
      ) : null}
      {step === 2 ? <Step2VerificationForm form={form} setForm={setForm} errors={errors} onNext={goNext} /> : null}
      {step === 3 ? <Step3ConsentForm form={form} setForm={setForm} errors={errors} onSubmit={submit} submitting={submitting} /> : null}

      <SubmitOverlay visible={submitting || Boolean(submitMessage)} progress={uploadProgress} message={submitMessage} tone={submitTone} />
      <IdentityProcessingOverlay message={identityMessage} />
    </RegisterLayout>
  );
}

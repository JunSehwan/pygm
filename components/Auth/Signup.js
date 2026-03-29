import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { getFunctions, httpsCallable } from "firebase/functions";

import { signUp } from "slices/user";
import {
  createAccount,
  emailDubCheck,
  sendLms,
  saveIdentityVerificationToUser,
  phoneDubCheck,
} from "firebaseConfig";
import { requestPortoneIdentityVerification } from "lib/portoneIdentity";

import SignupFormCard from "./Signup/SignupFormCard";

const email_check = (email) =>
  /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i.test(
    email
  );

const initialForm = {
  username: "",
  nickname: "",
  gender: "",
  email: "",
  tel: "",
  password: "",
  passwordCheck: "",
};

export default function Signup() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState("");
  const [identityVerifiedData, setIdentityVerifiedData] = useState(null);

  const isPasswordMatch =
    form.password.length > 0 &&
    form.passwordCheck.length > 0 &&
    form.password === form.passwordCheck;

  // 디버그 필요 시 사용 (리마운트 확인용)
  useEffect(() => {
    // console.log("[Signup] mounted");
    return () => {
      // console.log("[Signup] unmounted");
    };
  }, []);

  const canSubmit = useMemo(() => {
    const finalGender = identityVerifiedData?.gender || form.gender;

    return (
      !loading &&
      !phoneVerifyLoading &&
      phoneVerified &&
      !!identityVerifiedData?.verified &&
      !!form.username &&
      !!finalGender &&
      !!form.email &&
      !!form.tel &&
      !!form.password &&
      !!form.passwordCheck &&
      !!form.nickname?.trim() &&
      isPasswordMatch
    );
  }, [loading, phoneVerifyLoading, phoneVerified, identityVerifiedData, form, isPasswordMatch]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];

      if (key === "password" || key === "passwordCheck") {
        delete next.passwordLength;
        delete next.passwordMatch;
      }

      if (key === "tel") {
        delete next.tel;
        delete next.telVerify;
      }

      if (key === "gender") {
        delete next.gender;
      }

      return next;
    });

    // 연락처 변경 시 본인인증 상태 초기화
    if (key === "tel") {
      setPhoneVerified(false);
      setPhoneVerifyError("");
      setIdentityVerifiedData(null);
    }
  };

  const validateForm = useCallback(() => {
    const nextErrors = {};

    if (!form.username) nextErrors.username = "이름을 입력해주세요.";

    const finalGender = identityVerifiedData?.gender || form.gender;
    if (!finalGender) {
      nextErrors.gender = "성별 정보를 확인해주세요.";
    }

    if (!form.email) nextErrors.email = "이메일을 입력해주세요.";
    else if (!email_check(form.email)) {
      nextErrors.email = "이메일 형식이 올바르지 않습니다.";
    }

    if (!form.tel) nextErrors.tel = "연락처를 입력해주세요.";
    if (!phoneVerified || !identityVerifiedData?.verified) {
      nextErrors.telVerify = "연락처 본인인증을 완료해주세요.";
    }

    if (!form.password || form.password.length < 8) {
      nextErrors.passwordLength = "비밀번호를 8자 이상 입력해주세요.";
    }

    if (form.password !== form.passwordCheck) {
      nextErrors.passwordMatch = "비밀번호가 일치하지 않습니다.";
    }

    if (!form.nickname?.trim()) {
      nextErrors.nickname = "닉네임을 입력해주세요.";
    } else if (form.nickname.trim().length > 10) {
      nextErrors.nickname = "닉네임은 10자 이내로 입력해주세요.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form, phoneVerified, identityVerifiedData]);

  const verifyIdentityResultWithServer = async (identityVerificationId) => {
    const functions = getFunctions(undefined, "asia-northeast3");
    const verifyIdentityResult = httpsCallable(functions, "verifyIdentityResult");

    const result = await verifyIdentityResult({
      identityVerificationId,
      requestedPhone: form.tel,
    });

    return result?.data;
  };

  const handlePhoneVerify = async () => {
    setPhoneVerifyError("");

    if (!form.tel) {
      setErrors((prev) => ({ ...prev, tel: "연락처를 먼저 입력해주세요." }));
      return;
    }

    try {
      setPhoneVerifyLoading(true);

      const sdkResult = await requestPortoneIdentityVerification({
        phone: form.tel,
        name: form.username,
      });

      if (!sdkResult?.ok) {
        const msg = sdkResult?.message || "본인인증 창 호출에 실패했습니다.";

        // 사용자 취소는 조용한 안내 처리
        if (
          msg.includes("취소") ||
          sdkResult?.code === "FAILURE_TYPE_PG"
        ) {
          setPhoneVerifyError("본인인증이 취소되었습니다. 다시 진행해주세요.");
          return;
        }

        setPhoneVerifyError(msg);
        alert(`[본인인증 실패]\n${msg}`);
        return;
      }

      const verified = await verifyIdentityResultWithServer(
        sdkResult.identityVerificationId
      );

      if (!verified?.verified) {
        setPhoneVerifyError(verified?.message || "본인인증 검증에 실패했습니다.");
        alert(`[본인인증 검증 실패]\n${verified?.message || "다시 시도해주세요."}`);
        return;
      }

      setPhoneVerified(true);
      setIdentityVerifiedData({
        verified: true,
        provider: "PORTONE",
        phone: verified.phone || form.tel,
        name: verified.name || "",
        birth: verified.birth || "",
        gender: verified.gender || "",
        carrier: verified.carrier || "",
        ci: verified.ci || "",
        di: verified.di || "",
      });

      setErrors((prev) => {
        const next = { ...prev };
        delete next.telVerify;
        delete next.tel;
        return next;
      });

      setForm((prev) => ({
        ...prev,
        // 테스트모드에서는 name이 빈값일 수 있으므로 기존값 유지 fallback
        username: verified?.name || prev.username,
        // 인증 성별 우선 (테스트모드에서 빈값이면 기존값 유지)
        gender: verified?.gender || prev.gender,
        // 인증 번호 우선
        tel: verified?.phone
          ? String(verified.phone).replace(/[^0-9]/g, "")
          : prev.tel,
      }));

      alert("본인인증이 완료되었습니다.");
    } catch (e) {
      console.error("handlePhoneVerify error:", e);
      const msg = e?.message || "본인인증 중 오류가 발생했습니다.";
      setPhoneVerifyError(msg);
      alert(`[본인인증 오류]\n${msg}`);
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);

      // 1) 이메일 중복 체크
      const dup = await emailDubCheck(form.email);
      if (dup?.length) {
        setErrors((prev) => ({ ...prev, email: "이미 등록된 이메일입니다." }));
        return;
      }

      // 2) 본인인증 완료 확인
      if (!identityVerifiedData?.verified) {
        setErrors((prev) => ({
          ...prev,
          telVerify: "연락처 본인인증을 완료해주세요.",
        }));
        return;
      }

      // 3) 전화번호 중복 체크 (인증값 우선)
      const finalPhone = String(identityVerifiedData?.phone || form.tel || "").replace(
        /[^0-9]/g,
        ""
      );

      const phoneDup = await phoneDubCheck(finalPhone);
      if (phoneDup) {
        setErrors((prev) => ({
          ...prev,
          telVerify: "이미 가입된 연락처입니다. 로그인해주세요.",
        }));
        return;
      }

      // 4) 회원가입 데이터 준비
      const finalGender = identityVerifiedData?.gender || form.gender;
      const finalName = identityVerifiedData?.name || form.username;
      const nicknameToUse = form.nickname?.trim();

      const birthdayPlaceholder = { year: 1990 }; // createAccount 시그니처 유지용

      // 5) Auth + 기본 user 생성
      const res = await createAccount(
        form.email,
        form.password,
        finalGender,
        finalName,
        nicknameToUse,
        birthdayPlaceholder,
        finalPhone
      );

      if (!res?.uid) {
        alert("회원가입 처리 중 문제가 발생했습니다. 다시 시도해주세요.");
        return;
      }

      // 6) 본인인증 결과를 Firestore users/{uid}에 병합 저장
      await saveIdentityVerificationToUser(res.uid, {
        provider: identityVerifiedData?.provider || "PORTONE",
        phone: finalPhone,
        name: finalName,
        birth: identityVerifiedData?.birth || "",
        gender: finalGender || "",
        carrier: identityVerifiedData?.carrier || "",
        ci: identityVerifiedData?.ci || "",
        di: identityVerifiedData?.di || "",
      });

      // 7) Redux 반영 (전역 auth 가드가 반응할 수 있음)
      dispatch(
        signUp({
          email: form.email,
          username: finalName,
          nickname: nicknameToUse,
          gender: finalGender,
          tel: finalPhone,
          id: res.uid,
          userID: res.uid,
          avatar: res.photoURL || "",
          date_profile_finished: false,
          phone_verified: true,
          identity_provider: identityVerifiedData?.provider || "PORTONE",
          identity_di: identityVerifiedData?.di || "",
          identity_ci: identityVerifiedData?.ci || "",
          identity_birth: identityVerifiedData?.birth || "",
        })
      );

      // 8) 문자 발송은 비동기로 (회원가입 UX를 막지 않음)
      sendLms(
        finalPhone,
        `[차밍수프] ${finalName}님, 회원가입이 완료되었습니다.\nhttps://charmingsoup.com`
      ).catch((smsErr) => {
        console.error("sendLms error:", smsErr);
      });

      // 9) ✅ 완료모달 대신 바로 웰컴 페이지로 이동 (리마운트 이슈 회피)
      router.replace("/welcome");
      return;
    } catch (err) {
      console.error("[signup] handleSubmit error:", err);
      alert(`회원가입 중 오류가 발생했습니다.\n${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/40 blur-3xl" />
          <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-sky-200/40 blur-3xl" />
          <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
          <section
            className="
              w-full max-w-[390px] overflow-hidden bg-white
              md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80
              md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]
            "
          >
            <SignupFormCard
              form={form}
              errors={errors}
              loading={loading}
              canSubmit={canSubmit}
              phoneVerified={phoneVerified}
              phoneVerifyLoading={phoneVerifyLoading}
              phoneVerifyError={phoneVerifyError}
              identityVerifiedData={identityVerifiedData}
              isPasswordMatch={isPasswordMatch}
              onFieldChange={setField}
              onPhoneVerify={handlePhoneVerify}
              onSubmit={handleSubmit}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
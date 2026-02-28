import React, { useCallback, useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { signUp } from "slices/user";
import { createAccount, emailDubCheck, sendLms } from "firebaseConfig";
import LoadingPage from "components/Common/Loading";
import GoBack from "components/Common/GoBack";
import { BiShow, BiHide } from "react-icons/bi";
import Link from "next/link";

const Signup = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { signUpSuccess, user } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [showPswd, setShowPswd] = useState(false);

  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const [errors, setErrors] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const resetForm = () => {
    setUsername("");
    setNickname("");
    setGender("");
    setEmail("");
    setTel("");
    setPassword("");
    setPasswordCheck("");
    setErrors({});
  };

  useEffect(() => {
    if (signUpSuccess || user) {
      resetForm();
      router.push("/dashboard");
    }
  }, [signUpSuccess, user, router]);

  const email_check = (email) =>
    /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i.test(email);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const newErrors = {};
      if (!username) newErrors.username = "이름을 입력해주세요.";
      if (!nickname) newErrors.nickname = "닉네임을 입력해주세요.";
      if (!gender) newErrors.gender = "성별을 선택해주세요.";
      if (!email) newErrors.email = "이메일을 입력해주세요.";
      else if (!email_check(email)) newErrors.email = "이메일 형식이 올바르지 않습니다.";
      if (!tel) newErrors.tel = "연락처를 입력해주세요.";
      if (password.length < 8) newErrors.passwordLength = "비밀번호를 8자 이상 입력해주세요.";
      if (password !== passwordCheck) newErrors.passwordMatch = "비밀번호가 일치하지 않습니다.";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      try {
        setLoading(true);
        const dubCheck = await emailDubCheck(email);
        if (dubCheck?.length) {
          setErrors({ email: "이미 등록된 이메일입니다." });
          setLoading(false);
          return;
        }

        const res = await createAccount(email, password, gender, username, nickname, { year: 1990 }, tel);
        if (res?.uid) {
          dispatch(
            signUp({
              email,
              username,
              nickname,
              gender,
              tel,
              id: res.uid,
              avatar: res.photoURL,
            })
          );

          // ✅ LMS 발송
          await sendLms(
            tel,
            `[피그말리온] ${username}님, 회원가입이 완료되었습니다.\n\n가입 이메일: ${email}\n지금 바로 나의 인연을 찾아보세요 👉 https://pygm.co.kr`
          );

          resetForm();
          router.push("/dashboard");
        }
      } catch (err) {
        console.error(err);
        alert("회원가입 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [username, nickname, gender, email, tel, password, passwordCheck, dispatch, router]
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex justify-center items-center">
      {loading ? (
        <LoadingPage />
      ) : (
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl px-6 py-10 relative">
          {/* 상단 고정 헤더 */}
          <div className="absolute top-0 left-0 w-full px-6 py-5 flex items-center justify-between">
            <GoBack />
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight whitespace-nowrap">
              피그말리온 회원가입
            </h1>
            <div className="w-6" />
          </div>

          <form className="mt-16 space-y-5" onSubmit={onSubmit}>
            {/* 이름 */}
            <div>
              <input
                ref={inputRef}
                type="text"
                placeholder="이름"
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.username ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </div>

            {/* 닉네임 */}
            <div>
              <input
                type="text"
                placeholder="닉네임 (10자 이내)"
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.nickname ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
              {errors.nickname && <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>}
            </div>

            {/* 성별 */}
            <div>
              <select
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.gender ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">성별 선택</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* 이메일 */}
            <div>
              <input
                type="email"
                placeholder="이메일 주소"
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.email ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            {/* 연락처 */}
            <div>
              <input
                type="tel"
                placeholder="연락처 (01012345678)"
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.tel ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                maxLength={11}
              />
              {errors.tel && <p className="text-red-500 text-sm mt-1">{errors.tel}</p>}
            </div>

            {/* 비밀번호 */}
            <div className="relative">
              <input
                type={showPswd ? "text" : "password"}
                placeholder="비밀번호 (8자 이상)"
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.passwordLength ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="absolute right-4 top-[14px] text-gray-400 cursor-pointer"
                onClick={() => setShowPswd(!showPswd)}
              >
                {showPswd ? <BiHide /> : <BiShow />}
              </div>
              {errors.passwordLength && <p className="text-red-500 text-sm mt-1">{errors.passwordLength}</p>}
            </div>

            {/* 비밀번호 확인 */}
            <div className="relative">
              <input
                type={showPswd ? "text" : "password"}
                placeholder="비밀번호 확인"
                className={`w-full px-4 py-3 text-gray-800 bg-[#f5f5f7] border ${errors.passwordMatch ? "border-red-400" : "border-transparent"
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                value={passwordCheck}
                onChange={(e) => setPasswordCheck(e.target.value)}
              />
              {errors.passwordMatch && <p className="text-red-500 text-sm mt-1">{errors.passwordMatch}</p>}
            </div>

              <div className="text-center mt-[2rem] mb-[2rem] text-sm text-gray-500">
                회원가입을 클릭하면 피그말리온의
                <a
                  className="inline-block text-blue-500 align-baseline hover:text-blue-800"
                  href="/about/Service" target="_blank" rel="noreferrer noopener"
                >&nbsp;서비스 약관</a>
                에 동의하고
                <a
                  className="inline-block text-blue-500 align-baseline hover:text-blue-800"
                  href="/about/Privacy" target="_blank" rel="noreferrer noopener"
                >&nbsp;개인정보 처리방침&nbsp;</a>
                적용을 인정하는 것으로 간주합니다.
              </div>


            {/* 버튼 */}
            <button
              type="submit"
              className="w-full py-4 bg-[#007aff] text-white font-semibold rounded-xl hover:bg-[#0066d6] transition-colors"
            >
              회원가입
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-blue-600 font-medium">
                로그인
              </Link>
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default Signup;

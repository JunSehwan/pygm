import React, { useCallback, useEffect, useState, useRef } from 'react';
import { signIn, emailDubCheck, getUser } from 'firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import { login, signUp } from "slices/user";
import PropTypes from 'prop-types';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  query, where, getDocs,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";
import Image from 'next/image';
import dayjs from "dayjs";
import { useRouter } from 'next/router';
import Link from 'next/link';

const Login = () => {
  // useEffect(() => {
  //   if ((user || user?.userID)) {
  //     if (user?.purpose == 1) {
  //       console.log(user?.purpose)
  //       router.push('/friends')
  //     } else {
  //       console.log(user?.purpose)
  //       router.push('/news')
  //     }
  //   }
  // }, [router, user]);
  const dispatch = useDispatch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [emailDubError, setEmailDubError] = useState(false);
  const onChangeEmail = useCallback(
    e => {
      setEmail(e.target.value);
      setEmailError(false);
      setEmailDubError(false);
    },
    []
  );

  // @ 비밀번호 길이 검토
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const onChangePassword = useCallback(
    e => {
      setPassword(e.target.value);
      setPasswordError(false);
      setLoginError(false);
    },
    []
  );
  const [loginError, setLoginError] = useState(false);
  const [results, setResults] = useState();

  const { signUpSuccess, isLoggedIn } = useSelector(state => state.user);
  const { user } = useSelector(state => state.user);
  useEffect(() => {
    if (signUpSuccess || isLoggedIn || !!user) {
      setEmail("");
      setPassword("");
      setEmailError(false);
      setEmailDubError(false);
      setPasswordError(false);
    }
  }, [signUpSuccess, isLoggedIn, user])

  useEffect(() => {
    if (signUpSuccess && isLoggedIn && !!user) {
      if (user?.purpose === 1) {
        router.push("/friends")
      } else {
        router.push("/news")
      }
    }
  }, [isLoggedIn, router, signUpSuccess, user])

  const auth = getAuth();

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoginError(false);

    if (password?.length === 0) {
      return setPasswordError(true);
    }
    if (email?.length === 0) {
      return setEmailError(true);
    }
    await emailDubCheck(email).then((dubCheck) => {
      if (dubCheck?.length === 0) {
        throw setEmailDubError(true);
      }
    })
    try {
      let loginResult = await signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const loginResult = userCredential.user;
          if (!loginResult) {
            throw new Error(
              "Email is not verified. We have sent the verification link again. Please check your inbox/spam."
            );
          }
          return loginResult;
        })
      setResults(loginResult);
      if (!loginResult) setLoginError(true);
      if (loginResult?.uid?.length !== 0) {
        dispatch(login({ results }));
      }
    } catch (e) {
      if (e) { setLoginError(true); }
      console.error(e);
      const errorCode = e.code;
      const errorMessage = e.message;
      alert(errorCode, "에러")
    }

  }, [password, email, auth, results, dispatch])


  // 구글로그인
  const now = new Date();
  const nowForCopy = dayjs(now);
  const time = nowForCopy?.format('YYYY-MM-DD HH:mm:ss');
  const [con, setCon] = useState();
  const db = getFirestore();


  const handlePasswordForgot = useCallback(() => {
    router.push("/auth/forgotpassword");
  }, [router,])

  // autoFocus 관련
  const inputElement = useRef(null);
  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus();
    }
  }, []);

  return (
    <div>
      <div className="max-w-[32rem] container mx-auto">
        <div className="flex justify-center my-3">
          {/* <!-- Row --> */}
          <div className="w-full flex">
            {/* <!-- Col --> */}

            <div className='pt-2 w-full'>
              <div className="mt-2 px-2 w-full bg-white rounded-lg lg:rounded-l-none">
                <form
                  className="w-full mb-2 bg-white rounded"
                  onSubmit={onSubmit}
                >

                  <div className="mb-4">
                    <label className="block mb-1 text-md font-bold text-gray-700" htmlFor="login_email">
                      이메일
                    </label>
                    <input
                      className={emailError || emailDubError ?
                        'w-full px-3 py-2 mb-2 text-md border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                        :
                        'w-full px-3 py-2 mb-2 text-md leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                      }
                      ref={inputElement}
                      id="login_email"
                      type="email"
                      placeholder="이메일주소"
                      onChange={onChangeEmail}
                      value={email}
                    />
                    {emailError ? (
                      <p className="text-xs mb-[1.5rem] italic text-red-500">이메일을 입력해주세요.</p>
                    ) : null}
                    {emailDubError ? (
                      <p className="text-xs mb-[1.5rem] italic text-red-500">해당하는 이메일 계정은 존재하지 않습니다.</p>
                    ) : null}
                  </div>


                  <div className="mb-4">
                    <label className="block mb-1 text-md font-bold text-gray-700" htmlFor="password">
                      비밀번호
                    </label>
                    <input
                      className=
                      'w-full px-3 py-2 mb-3 text-md leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                      id="login_password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="********"
                      onChange={onChangePassword}
                      value={password}
                    />
                    {passwordError ? (
                      <p className="text-xs mb-[1.5rem] italic text-red-500">비밀번호를 입력해주세요.</p>
                    ) : null}
                    {loginError ? (
                      <p className="text-xs mb-[1.5rem] italic text-red-500">로그인 에러 - 비밀번호를 다시 확인해주세요.</p>
                    ) : null}
                  </div>
                  <div className="mb-6 text-center">
                    <button
                      className="w-full px-4 text-md py-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:shadow-outline"
                      type="onSubmit"
                    >
                      로그인
                    </button>
                  </div>




                </form>

                {/* 구분선 */}
                <div className="w-[90%] mx-auto h-[4px] py-2 my-2 border-b-[1px] border-solid border-slate-200"></div>
                <div className="w-fit bg-white mt-[-18px] px-8 mx-auto text-md text-gray-500">아직 회원이 아니신가요?</div>

                <div className='my-2'>
                  <div className="py-6 w-full text-center">
                    <Link href="/signup">
                      <div className="w-full px-4 text-md py-4 font-bold text-gray-700 shadow-md hover:shadow-none bg-white rounded-lg hover:bg-gray-100 focus:outline-none focus:shadow-outline">
                        회원가입
                      </div>
                    </Link>
                  </div>
                  <div className="text-center text-[14px] text-gray-500">
                    비밀번호를 잊어버렸나요?
                    <a
                      className="inline-block text-[0.88rem] text-blue-500 align-baseline hover:text-blue-800"
                      onClick={handlePasswordForgot}
                    >
                      &nbsp;비밀번호를 재설정
                    </a>
                    해주세요.
                  </div>



                  {/* <div className="text-center mt-[1rem] mb-[1rem] text-[14px] text-gray-500">
                    아직 회원이 아니신가요? <Link href="/signup"><span className="text-[0.88rem] text-blue-500 align-baseline hover:text-blue-800">회원가입</span></Link>을 해주세요.
                  </div> */}

                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
};

export default Login;
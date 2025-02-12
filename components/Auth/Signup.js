import React, { useCallback, useState, useEffect, useRef } from 'react';
import { signUp } from "slices/user";
import Link from 'next/link';
import { createAccount, emailDubCheck, sendMailForSignUp } from 'firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from "next/router";
import {
  signInWithPopup,
  getAuth
} from "firebase/auth";
import dayjs from "dayjs";
import {
  doc,
  setDoc, getFirestore
} from "firebase/firestore";
import Image from 'next/image';
import LoadingPage from 'components/Common/Loading';
import { BiShow, BiHide } from 'react-icons/bi';
import { FiMail } from 'react-icons/fi';
import GoBack from 'components/Common/GoBack';

const Signup = () => {

  const dispatch = useDispatch();
  const { signUpSuccess, user } = useSelector(state => state.user);
  const router = useRouter();
  useEffect(() => {
    if (signUpSuccess || !!user) {
      setUsername("");
      setEmail("");
      setForm({
        year: standardYear,
        month: "",
        day: "01",
      });
      setTel("");
      setPassword("");
      setPasswordCheck("");
      setUsernameError(false);
      setEmailError(false);
      setEmailDubError(false);
      setBirthError(false);
      setTelError(false);
      setPasswordLengthError(false);
      setPasswordError(false);
    }
  }, [signUpSuccess, user])

  useEffect(() => {
    if (signUpSuccess || !!user) {
      router.push("/dashboard")
    }
  }, [router, signUpSuccess, user])


  // 입력폼

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const onChangeUsername = useCallback((e) => {
    setUsername(e.target.value);
    setUsernameError(false);
  }, [])

  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const onChangeNickname = useCallback((e) => {
    setNickname(e.target.value);
    setNicknameError(false);
  }, [])

  // 성별
  const [gender, setGender] = useState("");
  const [genderError, setGenderError] = useState(false);
  const onChangeGender = useCallback((e) => {
    setGender(e.target.value);
    setGenderError(false);
  }, []);

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
  function email_check(email) {
    var reg = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
    return reg.test(email);
  }
  // 생년월일
  const standardYear = 1990;
  const [form, setForm] = useState({
    year: standardYear,
    month: "1",
    day: "01",
  });
  const onChangeYear = useCallback(
    e => {
      setForm({ ...form, year: e.target.value })
      setBirthError(false)
    },
    [form]
  );
  const onChangeMonth = useCallback(
    e => {
      setForm({ ...form, month: e.target.value })
      setBirthError(false)
    },
    [form]
  );
  const onChangeDay = useCallback(
    e => {
      setForm({ ...form, day: e.target.value })
      setBirthError(false)
    },
    [form]
  );

  const [birthError, setBirthError] = useState(false);
  const now = new Date();
  let yearsArr = [];
  for (let y = now.getFullYear(); y >= 1950; y -= 1) {
    yearsArr.push(y);
  }
  let monthArr = [];
  for (let m = 1; m <= 12; m += 1) {
    if (m < 10) {
      // 날짜가 2자리로 나타나야 했기 때문에 1자리 월에 0을 붙혀준다
      monthArr.push("0" + m.toString());
    } else {
      monthArr.push(m.toString());
    }
  }
  let days = [];
  let date = new Date(form?.year, form?.month, 0).getDate();
  for (let d = 1; d <= date; d += 1) {
    if (d < 10) {
      // 날짜가 2자리로 나타나야 했기 때문에 1자리 일에 0을 붙혀준다
      days.push("0" + d.toString());
    } else {
      days.push(d.toString());
    }
  }

  const years = () => {
    const allYears = [];
    const thisYear = new Date().getFullYear();
    for (let i = thisYear; i >= thisYear - 40; i -= 1)
      allYears.push(<option key={i} value={i}>{i}년</option>);
    return (
      <>
        <option key="" value="">년</option>
        {allYears}
      </>
    );
  };
  const months = () => {
    const monthNames = [
      "1월", "2월", "3월", "4월", "5월", "6월",
      "7월", "8월", "9월", "10월", "11월", "12월",
    ];
    return (
      <>
        <option key="" value="">월</option> {/* 선택창 초기값 */}
        {monthNames?.map((month, i) => (
          <option key={month} value={i + 1}>{month}</option>
        ))}
      </>
    );
  };

  // 전화번호
  const [tel, setTel] = useState("");
  const [telError, setTelError] = useState("");
  const onChangeNumber = useCallback((e) => {
    const regex = /^[0-9\b -]{0,13}$/;
    setTel(e.target.value);
    if (regex.test(e.target.value)) {
      setTelError(false);
    } else {
      setTelError(true);
    }
  }, []);

  // @ 비밀번호 확인
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [passwordLengthError, setPasswordLengthError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [showPswd, setShowPswd] = useState(false);

  // @ 비밀번호 길이 검토
  const onChangePassword = useCallback(
    e => {
      setPassword(e.target.value);
      setPasswordLengthError(e.target.value.length < 8);
    },
    []
  );
  const onChangePasswordCheck = useCallback(
    e => {
      setPasswordCheck(e.target.value);
      setPasswordError(e.target.value !== password);
    },
    [password]
  );

  const toggleShowPswd = useCallback(() => {
    setShowPswd(prev => !prev);
  }, [])

  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();

    console.log(email)
    if (username?.length === 0) {
      return setUsernameError(true);
    }
    if (nickname?.length === 0) {
      return setNicknameError(true);
    }
    
    if (gender === '') {
      document.getElementById('gender').focus();
      return setGenderError(true);
    }
    if (email?.length === 0) {
      return setEmailError(true);
    }
    if (!email_check(email)) {
      return setEmailError(true);
    }

    if (form?.year?.length === 0 || form?.month?.length === 0 || form?.day?.length === 0) {
      return setBirthError(true);
    }
    if (tel == '') {
      return setTelError(true);
    }
    if (password !== passwordCheck) {
      return setPasswordError(true);
    }
    if (password?.length < 8) {
      return setPasswordLengthError(true);
    }
    await emailDubCheck(email).then(async (dubCheck) => {
      if (dubCheck?.length !== 0) {
        alert("중복된 메일주소입니다.")
        return setEmailDubError(true);
        // return setEmailDubError(true);
        // return setEmailDubError(true);
      } else {
        setLoading(true);
        const res = await createAccount(email, password, gender, username, nickname, form, tel);
        if (res?.uid?.length !== 0) {
          try {
            dispatch(signUp({
              email, username, nickname, gender,
              birthday: form,
              tel,
              id: res?.uid,
              avatar: res?.photoURL
            }));
            // const getMail = await sendMailForSignUp(
            //   email, username,
            // );
          } catch (err) {
            console.error(err);
          }
        }
        setLoading(false);
      }
    })
    if (emailDubError) {
      return setEmailDubError(true);
    }


  }, [username, nickname, email, form, gender, tel, password, passwordCheck, emailDubError, dispatch])

  const nowForCopy = dayjs(now);
  const time = nowForCopy?.format('YYYY-MM-DD HH:mm:ss');
  const [con, setCon] = useState();
  const auth = getAuth();
  const db = getFirestore();

  // const signInWithKakaoHandler = useCallback(() => {
  //   const redirectUri = `${location.origin}/auth/kakaologin`;
  //   Kakao.Auth.authorize({ redirectUri });
  // }, [])

  // const signInWithGoogleHandler = useCallback(async () => {
  //   const googleProvider = new GoogleAuthProvider();
  //   try {
  //     await signInWithPopup(auth, googleProvider) // popup을 이용한 signup
  //       .then(async (data) => {
  //         setCon(data?.user);
  //         if (!data?.user) {
  //           return alert("존재하지 않는 계정입니다.")
  //         }
  //         const userDB = data?.user;
  //         if (userDB?.uid?.length !== 0) {

  //           const userRef = collection(db, "users");
  //           const q = query(userRef, where("id", "==", userDB?.uid));
  //           //결과 검색
  //           const querySnapshot = await getDocs(q);
  //           const result = querySnapshot?.docs?.map((doc) => (
  //             {
  //               ...doc.data(),
  //               id: doc.id,
  //             }
  //           ))
  //           if (result?.length === 0) {
  //             setDoc(doc(db, "users", userDB.uid), {
  //               id: userDB?.uid,
  //               username: userDB?.displayName,
  //               avatar: userDB?.photoURL || "",
  //               email: userDB?.email,
  //               timestamp: time,
  //             })
  //             dispatch(signUp({
  //               email: userDB?.email,
  //               username: userDB?.displayName,
  //               id: userDB?.uid,
  //               avatar: userDB?.photoURL
  //             }));
  //           }
  //           if (result?.length !== 0) {
  //             const gettingInfo = await getUser(userDB.uid);
  //             dispatch(signUp({
  //               gettingInfo
  //             }));

  //           }

  //         }

  //         return data?.user
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }, [auth, db, time, dispatch])

  // autoFocus 관련
  const inputElement = useRef(null);
  useEffect(() => {
    if (inputElement.current) {
      inputElement.current.focus();
    }
  }, []);

  return (
    <>

      <div className='max-w-[32rem] mx-auto'>
        <div className="container mx-auto">
          <div className="flex justify-center my-3">
            {/* <!-- Row --> */}
            <div className="w-full flex">
              {/* <!-- Col --> */}
              {/* <!-- Col --> */}
              <div className="mt-6 w-full rounded-lg lg:rounded-l-none">
                {loading ?
                  <div className="min-h-[50vh] w-full">
                    <LoadingPage />
                  </div>
                  :
                  <>
                    {/* 뒤로가기 버튼 */}
                    <div className='w-full fixed left-0 top-0 py-2 bg-[#ffffff51] z-10 backdrop-blur-md	'>
                      <div className='max-w-[32rem] mx-auto'>
                        <div className='w-full flex justify-items-end items-center'>
                          <GoBack />
                        </div>
                        <h3 className='text-2xl text-blue-600 my-2 ml-2 w-full'>피그말리온 회원가입</h3>
                      </div>
                    </div>
                    <div className='pt-[66px] px-2 '>

                      {/* 입력폼 */}

                      <form
                        className="w-full pt-4 pb-2 mb-1 rounded"
                        onSubmit={onSubmit}
                      >

                        <>
                          <div className="mb-2">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="name">
                              이름
                            </label>
                            <input
                              ref={inputElement}
                              className={usernameError ?
                                'w-full px-3 py-4 mb-2 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              id="name"
                              type="text"
                              maxLength={10}
                              placeholder="본명을 기재해주세요."
                              onChange={onChangeUsername}
                              value={username}
                            />
                            {usernameError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">이름을 입력해주세요.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="nickname">
                              닉네임(10자이내 입력)
                            </label>
                            <input
                              className={nicknameError ?
                                'w-full px-3 py-4 mb-2 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              id="nickname"
                              type="text"
                              maxLength={10}
                              placeholder="닉네임을 작성해주세요."
                              onChange={onChangeNickname}
                              value={nickname}
                            />
                            {nicknameError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">닉네임을 입력해주세요.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="gender">
                              성별
                            </label>
                            <select
                              className={genderError ?
                                'w-full px-3 py-4 mb-2 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              id="gender"
                              type="gender"
                              name="gender"

                              placeholder="성별"
                              onChange={onChangeGender}
                              defaultValue={user?.gender || ""}
                            >
                              <option value="" key="select">선택</option>
                              <option value="male" key="man">남자</option>
                              <option value="female" key="woman">여자</option>
                            </select>
                            {genderError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">성별을 선택해주세요.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="e-mail">
                              이메일
                            </label>
                            <input
                              className={emailError || emailDubError ?
                                'w-full px-3 py-4 mb-2 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              id="e-mail"
                              type="email"
                              placeholder="이메일주소를 입력해주세요."
                              onChange={onChangeEmail}
                              value={email}
                            />
                            {emailError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">올바른 이메일 형식이 아닙니다.</span>
                                </div>
                              </div>
                            ) : null}
                            {emailDubError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">이미 동일한 이메일 계정이 존재합니다.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2">
                            <div className="mb-4 md:mr-2 md:mb-0 w-[100%]">
                              <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="birthday">
                                생년월일
                              </label>
                              <div className="flex gap-2">
                                <select
                                  className={birthError ? "w-full px-3 py-4 mb-2 border-red-500 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                    :
                                    "w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                  }
                                  id="birthyear"
                                  type="text"
                                  placeholder="년"
                                  onChange={onChangeYear}
                                  value={form?.year}
                                >
                                  {years()}
                                </select>
                                <select
                                  className={birthError ? "md:ml-2 w-full border-red-500 px-3 py-2 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                    :
                                    "md:ml-2 w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                  }
                                  id="birthmonth"
                                  type="text"
                                  placeholder="월"
                                  onChange={onChangeMonth}
                                  value={form?.month}
                                >
                                  {months()}
                                </select>
                                <select
                                  className={birthError ? "border-red-500 md:ml-2 w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                    :
                                    "md:ml-2 w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                                  }
                                  value={form?.day}
                                  onChange={onChangeDay
                                  }
                                  id="birthday"
                                  type="text"
                                  placeholder="일"
                                >
                                  {days.map(item => (
                                    <option value={item} key={item}>
                                      {item}일
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            {birthError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">생년월일을 선택해주세요.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="phone">
                              연락처
                            </label>
                            <input
                              className={telError ?
                                'w-full px-3 py-4 mb-2 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-2 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              id="phone"
                              type="tel"
                              maxLength='11'
                              placeholder="숫자만 입력 ex. 01012345678"
                              onChange={onChangeNumber}
                              value={tel}
                            />
                            {telError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">연락처를 입력해주세요.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2 relative">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="password">
                              비밀번호(8자이상)
                            </label>
                            <input
                              className={passwordLengthError ?
                                'w-full px-3 py-4 mb-3 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-3 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              id="password"
                              type={showPswd ? "text" : "password"}
                              placeholder="(8자이상 입력)"
                              onChange={onChangePassword}
                              value={password}
                            >
                            </input>
                            <div className="inline cursor-pointer absolute top-[42px] right-[8px] sm:right-[14px] text-gray-400">
                              {showPswd ? (
                                <BiHide onClick={toggleShowPswd} />
                              ) : (
                                <BiShow onClick={toggleShowPswd} />
                              )}
                            </div>

                            {passwordLengthError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">비밀번호는 8자 이상이어야 합니다.</span>
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div className="mb-2 relative">
                            <label className="block mb-1 text-sm font-bold text-gray-700" htmlFor="c_password">
                              비밀번호 확인
                            </label>
                            <input
                              className={passwordError ?
                                'w-full px-3 py-4 mb-3 text-sm border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                                :
                                'w-full px-3 py-4 mb-3 text-sm leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                              }
                              onChange={onChangePasswordCheck}
                              value={passwordCheck}
                              id="c_password"
                              type={showPswd ? "text" : "password"}
                              placeholder="********"
                            />
                            <div className="inline cursor-pointer absolute top-[42px] right-[8px] sm:right-[14px] text-gray-400">
                              {showPswd ? (
                                <BiHide onClick={toggleShowPswd} />
                              ) : (
                                <BiShow onClick={toggleShowPswd} />
                              )}
                            </div>
                            {passwordError ? (
                              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                </svg>
                                <span className="sr-only">Info</span>
                                <div>
                                  <span className="font-medium">비밀번호가 일치하지 않습니다.</span>
                                </div>
                              </div>
                            ) : null}
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

                          <div className="mb-2 text-center">
                            <button
                              className="w-full px-4 text-md py-4 font-bold text-white bg-sky-600 rounded-lg hover:bg-sky-700 focus:outline-none focus:shadow-outline"
                              type="submit"
                            >
                              회원가입
                            </button>
                          </div>
                        </>

                      </form>
                      <div className="text-center mt-[2rem] mb-[1rem] text-[14px] text-gray-400">
                        이미 가입을 하셨나요? <Link href="/"><span className="text-blue-800">로그인</span></Link> 해주세요.
                      </div>

                    </div>
                  </>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};



export default Signup;

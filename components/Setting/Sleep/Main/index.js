import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from 'firebaseConfig';
import { updateUserSleep, updateUserSleepDoneFalse } from 'slices/user';
import { setDateSleep } from 'firebaseConfig';
import toast from 'react-hot-toast';

const index = () => {
  const { user, updateUserSleepDone } = useSelector(state => state.user);
  const router = useRouter();
  auth.languageCode = 'ko';
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);

  const updateSleepToast = () => toast('휴면모드 상태변경 완료!');

  useEffect(() => {
    if (updateUserSleepDone) {
      setEmailError(false);
      setUsernameError(false);
      setEmail("");
      setUsername("");
      updateSleepToast();
      dispatch(updateUserSleepDoneFalse());
    }
  }, [dispatch, updateUserSleepDone])

  const onChangeEmail = useCallback((e) => {
    e.preventDefault();
    setEmail(e.target.value);
    setEmailError(false);
  }, [email])

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState(false);

  const onChangeUsername = useCallback((e) => {
    e.preventDefault();
    setUsername(e.target.value);
    setUsernameError(false);
  }, [username])

  // if (!!user) return router.push("/dashboard");

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (email?.length === 0) return setEmailError(true);
    if (email !== user?.email) return setEmailError(true);
    if (username !== user?.username) return setUsernameError(true);
    if (user?.date_sleep == undefined || user?.date_sleep == null || user?.date_sleep !== true) {
      await setDateSleep(false)
        .then(async (result) => {
          await dispatch(updateUserSleep(result));

        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(errorCode, errorMessage);
          alert("휴면상태 변경이 정상적으로 작동되지 않습니다. 관리자에게 문의해주세요!")
        });
      return null;
    } if (user?.date_sleep == true) {
      await setDateSleep(true)
        .then(async (result) => {
          await dispatch(updateUserSleep(result));
          // ..
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(errorCode, errorMessage);
          alert("휴면상태 변경이 정상적으로 작동되지 않습니다. 관리자에게 문의해주세요!")
        });
      return null;
    } else {
      return alert("정보를 다시 확인해주세요!")
    }
  }, [email, username, user?.email, user?.date_sleep, user?.username, dispatch])



  return (
    <form
      className='pt-2 pb-[30px] mx-auto px-2 w-full'
      onSubmit={onSubmit}
    >
      <div className='py-6'>
        <div className='mx-auto text-left'>
          <div className='flex w-full items-center flex-col'>
            <p className='text-blue-600 text-[1.5rem] leading-8 text-left my-3 font-semibold w-full'>
              😴 소개팅 휴면상태 변경
            </p>

            <div className="w-full flex items-center p-2 my-4 text-sm text-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300" role="alert">
              <div className='w-full leading-6'>
                <p>📌 나의 상태가 휴면상태로 변경되며, 프로필이 비공개 됩니다.</p>
                <p>📌 휴면 해지시, 프로필 재등록 없이 바로 서비스가 재개됩니다.</p>
                <p>📌 휴면 신청 시, 모든 소개가 종료됩니다.</p>
                <p>📌 윙크를 보내거나 받은 이성 모두에게 휴면회원으로 표기됩니다.</p>
                <p>📌 휴면회원으로 표기되면 상대가 내 프로필을 조회할 수 없습니다.</p>
              </div>
            </div>

          </div>
        </div>

        <h2 className="text-lg mt-4 mb-4 font-semibold">회원님의 이메일 계정과 성함을 작성해주세요.</h2>
        {/* <form onSubmit={onSubmit}> */}
        <input
          className='w-full px-3 py-3 mb-2 text-md leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
          type="email"
          placeholder="이메일 입력"
          onChange={onChangeEmail}
          value={email}
        />
        {emailError ? (
          <p className="text-sm mb-[1.5rem] italic text-red-500">이메일을 정확히 입력해주세요.</p>
        ) : null}


        <input
          className='w-full px-3 py-3 mb-2 text-md leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
          type="username"
          value={username}
          placeholder="성함(본명) 입력"
          onChange={onChangeUsername}
        />
        {usernameError ? (
          <p className="text-sm mb-[1.5rem] italic text-red-500">성함을 정확히 입력해주세요.</p>
        ) : null}




        <div className="w-full flex items-center justify-center mt-8">
          {!user?.date_sleep || user?.date_sleep === false ?
            <button
              className="w-[100%] mx-auto px-4 text-md py-4 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:shadow-outline"
              type="submit"
            // onClick={onSubmit(true)}
            >
              휴면하기
            </button>
            :
            <button
              className="w-[100%] mx-auto px-4 text-md py-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:shadow-outline"
              type="submit"
            // onClick={onSubmit(false)}
            >
              재개하기
            </button>
          }
        </div>
      </div>
    </form>
  );
};

export default index;
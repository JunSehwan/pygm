import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import {
  auth, emailDubCheck, usernameDubCheck
} from 'firebaseConfig';
import { sendPasswordResetEmail } from "firebase/auth";

const index = () => {
  const router = useRouter();
  auth.languageCode = 'ko';

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);

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
    if (username?.length === 0) return setUsernameError(true);
    const resultEmail = await emailDubCheck(email);
    const resultUsername = await usernameDubCheck(username);


    if (email?.length !== 0 && emailError == false && usernameError == false
      && resultEmail?.length !== 0 && resultUsername?.length !== 0

    ) {
      await sendPasswordResetEmail(auth, email)
        .then(() => {
          // Password reset email sent!
          // ..
          alert("비밀번호 재설정 이메일을 발송하였습니다. 이메일을 확인하고 내용속 링크를 통해 비밀번호를 변경해주세요!")
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(errorCode, errorMessage);
          alert("이메일이 맞지 않습니다.")
        });
    } else {
      alert("이메일이 맞지 않습니다.")
    }
  }, [email, username])

  return (
    <div className='pt-2 pb-[30px] mx-auto px-2 w-full'>
      <div className='py-6'>
        <div className='mx-auto text-left'>
          <div className='flex justify-between w-full items-center'>
            <p className='text-gray-500 text-[1.2rem] leading-8'>
              🔐 비밀번호 재설정
            </p>
          </div>
        </div>

        <h2 className="text-lg mt-4 mb-4 font-semibold">회원님의 이메일 계정과 성함을 작성해주세요.</h2>
        {/* <form onSubmit={onSubmit}> */}
        <input
          className='w-full px-3 py-3 mb-2 text-md leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
          type="email"
          placeholder="이메일 입력"
          onChange={onChangeEmail}
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
          <button
            className="w-[100%] mx-auto px-4 text-md py-4 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:shadow-outline"
            type="button"
            onClick={onSubmit}
          >
            비밀번호 변경하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default index;
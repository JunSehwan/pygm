import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from 'firebaseConfig';
// import { setWithdraw, setWithdrawDoneFalse } from 'slices/user';
import toast from 'react-hot-toast';
import { FaCircleCheck } from "react-icons/fa6";
import Modal from './Modal';
import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { reauthenticateUser, getWithdraw } from 'firebaseConfig';
import { signOut } from 'slices/user';

const index = () => {
  const { user, setWithdrawDone } = useSelector(state => state.user);
  const router = useRouter();
  const auth = getAuth();
  auth.languageCode = 'ko';
  const me = auth.currentUser;
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [password, setPassword] = useState();
  const [passwordError, setPasswordError] = useState(false);

  const [openModal, setOpenModal] = useState(false);

  const onClickOpenModal = useCallback(async (e) => {
    e.preventDefault();
    if (email?.length === 0) return setEmailError(true);
    if (email !== user?.email) return setEmailError(true);
    if (!password || password?.length === 0) return setPasswordError(true);
    if (email?.length !== 0 && email === user?.email) {
      try {
        if (!auth.currentUser || !auth.currentUser.email) return;
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email,
          password)
        await reauthenticateWithCredential(auth.currentUser, credential).then(() => {
          // return ({ pwd: password })
          setOpenModal(true)
          // User re-authenticated.
        }).catch((error) => {
          console.error(error);
          setPasswordError(true)
        });
        // console.log(result, "리절트")

        // if (result == "success") {
        //   console.log(result,"sex")
        // } else {
        //   setPasswordError(true)
        // }
        // .then(() => {
        //   setOpenModal(true);
        // })
      } catch (e) {
        console.error(e, "에러")
        const errorCode = e.code;
        const errorMessage = e.message;
        console.log(errorCode, errorMessage);
        // alert("비밀번호 정보가 잘못되었습니다.")
        return (setPasswordError(true))
      }
    } else {
      alert("정보를 다시 확인해주세요.")
      return (setPasswordError(true))
    }
  }, [auth.currentUser, email, password, user?.email])

  const onClickCloseModal = useCallback(() => {
    setOpenModal(false);
  }, [])

  const updateWithdrawToast = () => toast('회원탈퇴가 완료되었습니다! 이용해주셔서 감사합니다.');

  // useEffect(() => {
  //   if (setWithdrawDone) {
  //     // setEmailError(false);
  //     // setUsernameError(false);
  //     // setEmail("");
  //     // setUsername("");
  //     updateWithdrawToast();
  //     router.push("/");
  //     dispatch(setWithdrawDoneFalse());
  //   }
  // }, [dispatch, setWithdrawDone])

  const onChangeEmail = useCallback((e) => {
    e.preventDefault();
    setEmail(e.target.value);
    setEmailError(false);
  }, [])

  // 이메일

  const onChangePassword = useCallback((e) => {
    setPassword(e.target.value);
    setPasswordError(false);
  }, [])
  // if (!!user) return router.push("/dashboard");

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (email?.length === 0) return setEmailError(true);
    if (email !== user?.email) return setEmailError(true);
    if (password?.length === 0) return setPasswordError(true);
    if (email?.length !== 0 && email === user?.email) {
      try {
        await reauthenticateUser(password)
          .then(async () => {
            await getWithdraw()
            await deleteUser(me).then(async () => {
              // User deleted.
              alert("회원탈퇴가 정상적으로 처리되었습니다.")
              // setTimeout(() => {
              dispatch(signOut())
              // }, [2500]);
              updateWithdrawToast();
              router.push('/');
            }).catch((error) => {
              console.error(error)
              const errorCodes = error.code;
              const errorMessages = error.message;
              // console.log(errorCodes, errorMessages);
              if (errorCodes == "auth/requires-recent-login") {
                alert("잠시 뒤 다시 시도해주세요.")
              }
              else {
                setPasswordError(true);
                // alert("비밀번호 정보가 잘못되었습니다.")
              }
            });
          })
      } catch (e) {
        console.error(e, "에러")
        const errorCode = e.code;
        const errorMessage = e.message;
        console.log(errorCode, errorMessage);
        // alert("비밀번호 정보가 잘못되었습니다.")
      }
    } else {
      alert("정보를 다시 확인해주세요.")
    }
  }, [router, email, user?.email, password, me, dispatch])


  return (
    <form onSubmit={onSubmit}>
      <div
        className='pt-2 pb-[30px] mx-auto px-2 w-full'
      // onSubmit={onSubmit}
      >
        <div className='py-2'>
          <div className='mx-auto text-left'>
            <div className='flex w-full items-center flex-col'>
              <p className='text-pink-600 text-[1.5rem] leading-8 text-left my-3 mx-2 font-semibold w-full'>
                👣 회원탈퇴
              </p>

              <div className="w-full flex items-center p-3 my-2 text-md text-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-300" role="alert">
                <div className='w-full leading-5'>
                  <div className='w-full flex gap-1 flex-row items-center my-3'>
                    <div className='w-6 h-6'>
                      <FaCircleCheck
                        className='w-4 h-4' /></div>
                    <span className='w-full'>탈퇴 시, 직접 입력한 프로필, 잔여 윙크, 윙크를 주고받은 이력 등 모든 정보가 삭제됩니다.</span>
                  </div>
                  <div className='w-full flex gap-1 flex-row items-center my-3'>
                    <div className='w-6 h-6'>
                      <FaCircleCheck
                        className='w-4 h-4' /></div>
                    <span className='w-full'>다시 서비스를 이용하고 싶으시다면 가입부터 다시 진행하여야 합니다.</span>
                  </div>
                  <div className='w-full flex gap-1 flex-row items-center my-3'>
                    <div className='w-6 h-6'>
                      <FaCircleCheck
                        className='w-4 h-4' /></div>
                    <span className='w-full'>새로 가입하면 매칭이력도 삭제되어 이전과 동일한 사람이 소개될 수 있습니다.</span>
                  </div>
                  <div className='w-full flex gap-1 flex-row items-center my-3'>
                    <div className='w-6 h-6'>
                      <FaCircleCheck
                        className='w-4 h-4' /></div>
                    <span className='w-full'>윙크를 보내거나 받은 이성 모두에게 탈퇴회원으로 표기됩니다.</span>
                  </div>
                  <div className='w-full flex gap-1 flex-row items-center my-3'>
                    <div className='w-6 h-6'>
                      <FaCircleCheck
                        className='w-4 h-4' /></div>
                    <span className='w-full'>탈퇴회원으로 표기되면 상대가 내 프로필을 조회할 수 없습니다.</span>
                  </div>
                  <div className='w-full flex gap-1 flex-row items-center my-3'>
                    <div className='w-6 h-6'>
                      <FaCircleCheck
                        className='w-4 h-4' /></div>
                    <span className='w-full'>해당 이메일 계정으로 다시 가입이 불가합니다.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <h2 className="text-lg mt-4 mb-4 font-semibold">회원님의 이메일 계정과 비밀번호를 작성해주세요.</h2>
          {/* <form onSubmit={onSubmit}> */}
          <div className="mb-1">
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
          </div>

          <div className="mb-1">
            <input
              className={passwordError ?
                'w-full px-3 py-3 mb-2 text-md border-red-500 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
                :
                'w-full px-3 py-3 mb-2 text-md leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline'
              }
              id="password"
              type="password"
              autoComplete="new-password"
              maxLength={100}
              placeholder="비밀번호를 입력해주세요."
              onChange={onChangePassword}
              value={password || ""}
            />
            {passwordError ? (
              <p className="text-sm mb-[1.5rem] text-red-500">비밀번호가 유효하지 않습니다.</p>
            ) : null}
          </div>

          <div className="w-full flex items-center justify-center mt-8">
            <button
              className="w-[100%] mx-auto px-4 text-md py-4 font-bold text-white bg-gray-600 rounded-lg hover:bg-gray-700 focus:outline-none focus:shadow-outline"
              type="button"
              onClick={onClickOpenModal}
            >
              탈퇴하기
            </button>
          </div>
        </div>
      </div>

      <Modal
        title="회원탈퇴"
        contents="정말 회원탈퇴를 하시겠습니까?"
        closeOutsideClick={true}
        openModal={openModal}
        closeModal={onClickCloseModal}
        twobutton={true}
        cancelFunc={onClickCloseModal}
        onOK={onSubmit}
      />
    </form>
  );
};

export default index;
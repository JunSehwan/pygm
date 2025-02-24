import React, { useCallback } from 'react';
import fake_friends from 'components/Common/Dummy/data';
import { onPaybackHeart, updateUserInfos, MessageFunction } from 'firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setPaybackWinks, userLoadingEnd } from 'slices/user';
import dayjs from 'dayjs';


const index = () => {
  const { user } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const setUsers = useCallback(async () => {
    const res = await updateUserInfos(fake_friends);
  }, [])
  const setMessage = useCallback(async () => {
    const response = await fetch("http://127.0.0.1:5001/pygmalion-96c6f/asia-northeast3/sendmessages");
  }, [])

  // 윙크 기간 지난것 정산
  let today = dayjs()?.format('YYYY-MM-DD HH:mm:ss');
  const likesArr = []
  user?.likes?.map((v) => (
    dayjs(dayjs(v?.startAt).add(7, 'day'))?.isBefore(dayjs(today)) == true
      && (v?.refund !== true)
      ?
      likesArr?.push(v) : null
  ))
  const likesAndLikedArr = []
  likesArr?.map((v) => (
    (v?.refund !== true) && user?.liked?.length !== 0 && user?.liked?.map((m) => (
      v?.userId == m?.userId ? likesAndLikedArr?.push(v) : null
    ))
  ))
  // 중복제거&차집합
  const uniqueLikesAndLikedArr = [...new Set(likesAndLikedArr)];
  const finalLikesArr = likesArr?.filter(v => !uniqueLikesAndLikedArr?.includes(v))

  const likesAndDislikedArr = []
  likesArr?.map((v) => (
    (v?.refund !== true) && user?.disliked?.length !== 0 &&
    user?.disliked?.map((m) => (
      v?.userId == m?.userId ? likesAndDislikedArr?.push(v) : null

    ))
  ))
  // 중복제거&차집합
  const uniqueLikesAndDislikedArr = [...new Set(likesAndDislikedArr)];
  const finalArr = finalLikesArr?.filter(v => !uniqueLikesAndDislikedArr?.includes(v))

  const onPayback = useCallback(async () => {
    if (!user?.userID) {
      return alert('로그인이 필요합니다.');
    }
    const result = await onPaybackHeart(finalArr)
    // .then((result) => {
    dispatch(setPaybackWinks(result))
    // dispatch(userLoadingEnd())
    // })
  }, [
    user?.userID, dispatch, finalArr, user?.likes, user?.wink
  ])


  // 이거 합쳐서 갯수 >> 추가하면 표시 해놔서 refund : false

  return (
    <div className='w-full flex flex-col'>
      <div className="mx-auto px-2 w-full flex items-center p-4 my-4 text-sm text-[--pygm-five] border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800" role="alert">
        <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
        <span className="sr-only">Info</span>
        <div>
          <span className="font-medium">매칭이 실패할 경우, 윙크를 다시 돌려드립니다. </span>
        </div>
      </div>

      {/* 회복되는 윙크 */}

      {finalArr?.length !== 0 &&
        <div className='w-full px-2 mx-auto'>
          <button
            className="shadow hover:shadow-none hover:bg-sky-800 bg-gradient-to-br from-sky-400 via-sky-400 to-violet-400 p-3 rounded w-full text-white flex items-center justify-between mx-auto"
            onClick={onPayback}
          >
            <div className="flex flex-col gap-3 text-left w-full">
              <div className="">
                <span className="text-white text-xl font-semibold">윙크 돌려받기</span>
                <br />
                <span className="text-white text-md">상대방의 응답이 없는 7일 지난 윙크는 다시 돌려드립니다.</span>
              </div>
              <div className='w-full flex justify-end'>
                <div
                  className="w-fit text-black bg-white hover:bg-gray-50 px-4 py-2 rounded-lg ease duration-300 flex gap-1 items-center group">
                  <span>{finalArr?.length}개 받기</span>
                  <svg xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true" role="img"
                    className="group-hover:translate-x-1 transition-transform ease duration-200 w-6 h-6"
                    viewBox="0 0 256 256">
                    <path fill="currentColor"
                      d="m221.66 133.66l-72 72a8 8 0 0 1-11.32-11.32L196.69 136H40a8 8 0 0 1 0-16h156.69l-58.35-58.34a8 8 0 0 1 11.32-11.32l72 72a8 8 0 0 1 0 11.32Z">
                    </path>
                  </svg>
                </div>
              </div>
            </div>
            <div>
            </div>
          </button>
        </div>}
      {/* <button onClick={setUsers}>유저등록</button> */}
      {/* <button onClick={setMessage}>메시지등록</button> */}
    </div>
  );
};

export default index;
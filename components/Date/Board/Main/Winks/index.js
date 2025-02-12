import React, { useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getLikesFriendsByUserId } from 'firebaseConfig'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  setLikesArr,
  setLikesArrDone,
  setLikedArr,
  setLikedArrDone
} from 'slices/user';
import WinksCard from './WinksCard';
import hangjungdong from 'components/Common/Address';
import NoCardEmpty from '../NoCardEmpty';

const index = () => {
  const auth = getAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, likesArr } = useSelector(state => state.user);
  const { sido, sigugun, dong } = hangjungdong;
  const sigugunList = hangjungdong?.sigugun;

  useEffect(() => {
    const authStateListener = onAuthStateChanged(auth, async (mine) => {
      if (!mine) {
        // dispatch(resetUserState());
        return router.push("/");
      }
      await getLikesFriendsByUserId(user?.likes, user?.liked).then((likesArr) => {
        dispatch(setLikesArr(likesArr));
      })
    })
    return () => {
      authStateListener();
    };
  }, [router, auth, user?.liked, dispatch, user?.uid, user?.userID, user?.likes])

  return (
    <>
      <div className='w-[100%] my-2 border-none border-gray-200 h-4'></div>
      <div className='w-full mt-5'>
        <section className='w-full my-3 mx-auto px-2'>
          <div className='mx-auto px-2 flex flex-row items-center justify-between my-2 w-full'>
            <div className='text-xl text-blue-800 font-bold mb-2'>
              내가 윙크를 보낸 이성😃
            </div>
            <div className='text-md text-gray-500 mb-2'>
              총 {likesArr?.length}명
            </div>
          </div>
          {likesArr?.length == 0 &&
            <NoCardEmpty
              title="아직 윙크를 보낸 이성이 없습니다."
            />
          }
          <ul className='w-full grid grid-flow-row grid-cols-2 gap-2 overflow-hidden'>
            {/* <ul className='w-full gap-2 overflow-x-auto flex whitespace-nowrap'> */}
            {likesArr?.map((v, index) => (
              <WinksCard
                friend={v}
                key={index + 1}
                sido={sido}
                sigugunList={sigugunList}
              />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
};

export default index;
import React, { useEffect, useRef } from 'react';
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
import { setMyCouples, setMyCouplesDone } from 'slices/couple';
import CoupleCard from './CoupleCard';
import hangjungdong from 'components/Common/Address';
import NoCardEmpty from '../NoCardEmpty';


const index = () => {
  const auth = getAuth();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  const { myCouples } = useSelector(state => state.couple);
  const { sido, sigugun, dong } = hangjungdong;
  const sigugunList = hangjungdong?.sigugun;

  // useEffect(() => {
  //   const authStateListener = onAuthStateChanged(auth, async (mine) => {
  //     if (!mine) {
  //       // dispatch(resetUserState());
  //       return router.push("/");
  //     }
  //   })
  //   return () => {
  //     authStateListener();
  //   };
  // }, [dispatch, auth, router, user?.uid, user?.userID, user?.likes])

  return (
    <>
      <div className='w-[100%] my-2 border-none border-gray-200 h-4'></div>
      <div className='w-full mt-5'>
        <section className='w-full my-3 mx-auto px-2'>
          <div className='mx-auto px-2 flex flex-row items-center justify-between my-2 w-full'>
            <div className='text-xl text-blue-800 font-bold mb-2'>
              매칭된 이성😃
            </div>
            <div className='text-md text-gray-500 mb-2'>
              총 {myCouples?.length}명
            </div>
          </div>
          {myCouples?.length == 0 &&
            <NoCardEmpty
              title="아직 매칭이 된 건이 없습니다."
            />
          }
          <ul className='w-full grid grid-flow-row grid-cols-2 gap-2 overflow-hidden'>
            {myCouples?.map((v, index) => (
              <CoupleCard
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
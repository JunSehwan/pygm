import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import hangjungdong from 'components/Common/Address';
import { motion } from "framer-motion";
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FaHome } from "react-icons/fa";
import { FaBuilding } from "react-icons/fa";
import { FaBriefcase } from "react-icons/fa";
import dayjs from "dayjs";
import { getFriendSleep, getFriendWithdraw, auth } from 'firebaseConfig';
import {
  setFriendSleep, setFriendWithdraw, friendSleepLoadingStart, friendSleepLoadingEnd
} from 'slices/user';
import { onAuthStateChanged } from 'firebase/auth';

const index = ({ friend }) => {
  const { user, allFriends, loading } = useSelector(state => state.user);
  const { sido, sigugun, dong } = hangjungdong;
  const router = useRouter();
  const dispatch = useDispatch();
  const sigugunList = hangjungdong?.sigugun;
  const resultArr = [];
  // const sigugunFunc = useCallback(() => {
  sigugunList?.map((v) => {
    v?.sido == friend?.address_sido ? resultArr?.push(v) : null
  }, [friend?.address_sido])

  const [defaultSido] = sido?.filter((item) => item?.sido == friend?.address_sido, [])
  const [defaultSigugun] = sigugun?.filter((item) => item?.sido == friend?.address_sido && item?.sigugun == friend?.address_sigugun, [])


  const resultCompanyArr = [];
  // const sigugunFunc = useCallback(() => {
  sigugunList?.map((v) => {
    v?.sido == friend?.company_location_sido ? resultCompanyArr?.push(v) : null
  }, [friend?.company_location_sido])

  const [defaultCompanySido] = sido?.filter((item) => item?.sido == friend?.company_location_sido, [])
  const [defaultCompanySigugun] = sigugun?.filter((item) => item?.sido == friend?.company_location_sido && item?.sigugun == friend?.address_sigugun, [])

  const goDetail = useCallback(() => {
    if (user) {
      router.push({
        pathname: `/date/cards/${friend?.userID}`,
      });
    } else {
      router.push("/")
    }
  }, [friend?.userID, router, user])

  let today = dayjs();
  let expiredDay = dayjs(friend?.expired);

  const friendID = friend?.userID
  useEffect(() => {
    const authStateListener = onAuthStateChanged(auth, async (mine) => {
      // dispatch(friendSleepLoadingStart())
      await getFriendSleep(friend?.userID).then((result) => {
        dispatch(setFriendSleep({ ...result, id: friendID }));
      })
      await getFriendWithdraw(friend?.userID).then((result) => {
        dispatch(setFriendWithdraw({ ...result, id: friendID }));
      })
    })
    // dispatch(friendSleepLoadingEnd())
    return () => {
      authStateListener();
    };
  }, [dispatch, friendID, friend?.userID, user?.userID, friend?.date_sleep, friend?.withdraw])

  const sleeping = friend?.date_sleep == true;
  const withdrawing = friend?.withdraw == true;


  // const [dislikes, setDislikes] = useState(false);
  // const [disliked, setDisliked] = useState(false);

  // useEffect(() => {
  //   const dislikesResults = friend?.disliked?.find((v) => v?.userId === user?.userID) !== undefined
  //   setDislikes(dislikesResults)
  //   const dislikedResults = friend?.dislikes?.find((v) => v?.userId === user?.userID) !== undefined
  //   setDisliked(dislikedResults)
  // }, [friend?.disliked, friend?.dislikes])

  const [refreshedFriend, setRefreshedFriend] = useState("");
  useEffect(() => {
    allFriends?.map((v) => (
      friend?.userID === v?.userID ? setRefreshedFriend(v) : null
    ))

  }, [allFriends, friend, friend?.userID])

  return (
    <>
      {sleeping && !withdrawing &&
        <>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="my-3 mx-2 w-[100%] bg-slate-50 opacity-75 border-solid border-t-2 border-pink-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 shadow-lg hover:shadow-sm ">
            <div className='w-full text-left relative '>
              <div className='w-full relative h-[420px] flex flex-col items-center justify-center gap-4'>
                <Image
                  alt="empty"
                  width="0"
                  height="0"
                  sizes="100vw"
                  unoptimized
                  className='w-[70px]'
                  src="/image/icon/empty.png" />
                <span className='text-lg text-slate-500'>휴면중인 회원입니다.</span>
              </div>
            </div>
          </motion.div>
        </>
      }
      {withdrawing && !sleeping &&
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="my-3 mx-2 w-[100%] bg-slate-50 opacity-75 border-solid border-t-2 border-slate-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 shadow-lg hover:shadow-sm ">
          <div className='w-full text-left relative '>
            <div className='w-full relative h-[420px] flex flex-col items-center justify-center gap-4'>
              <Image
                alt="empty"
                width="0"
                height="0"
                sizes="100vw"
                unoptimized
                className='w-[70px]'
                src="/image/icon/empty.png" />
              <span className='text-lg text-slate-500'>탈퇴한 회원입니다.</span>
            </div>
          </div>
        </motion.div>
      }
      {(refreshedFriend?.disliked?.length == 0 || !refreshedFriend?.disliked) && (!sleeping || sleeping == "") && (!withdrawing || withdrawing == "") &&
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="my-3 mx-2 w-[100%] h-[420px] bg-white shadow-lg hover:shadow-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 border-b-solid border-b-4 border-blue-300 ">
          <button
            className='w-full text-left relative h-[100%]'
            onClick={goDetail}
          >
            <div className='w-full relative h-[100%]'>
              {friend?.thumbimage?.[0] ?
                <div className=' w-[100%] h-[100%] rounded-lg flex items-center justify-center bg-slate-700'>
                  <Image
                    className="rounded-lg w-[100%] h-[100%] object-cover"
                    unoptimized
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    width="0"
                    height="0"
                    sizes="100vw"
                    loader={() => friend?.thumbimage?.[0]}
                    src={friend?.thumbimage[0]}
                    alt={friend?.thumbimage[0]} />
                </div>
                :
                <div className=' w-[100%] h-[100%] rounded-lg flex items-center justify-center bg-slate-700'>
                  <Image
                    className="rounded-lg w-[90%] h-[360px] object-cover blur"
                    unoptimized
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    width="0"
                    height="0"
                    sizes="100vw"
                    src="/image/image_error.png"
                    alt="/image/image_error.png" />
                </div>
              }
              <span className='absolute top-4 right-4 rounded-full px-4 py-2 shadow-md bg-black/50 text-md font-semibold text-white'>D-{Math.ceil(expiredDay?.diff(today, "day", true))}일</span>
            </div>
            <div className="absolute bottom-0 rounded-b-lg right-0 left-0  p-4 
            
            ">
              <div className='w-full flex justify-between flow-row items-center gap-2'>
                <div className="text-2xl font-bold tracking-tight text-white dark:text-white">{friend?.nickname}
                </div>
                <span className='inline-flex items-center rounded-md px-4 py-1.5 text-md font-medium text-center text-sky-700 bg-white hover:bg-white focus:ring-4 focus:outline-none focus:ring-white dark:bg-white dark:hover:bg-white dark:focus:ring-white dark:text-black'>
                  {friend?.mbti_ei}{friend?.mbti_sn}{friend?.mbti_tf}{friend?.mbti_jp}</span>
              </div>
              <p className="mb-2 text-lg tracking-tight text-white dark:text-white">{friend?.birthday?.year}년생</p>
              <div className="flex w-full items-center justify-start flex-wrap gap-1">
                <p className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-md font-medium text-center text-white bg-sky-600/60 hover:bg-sky-800/60 focus:ring-4 focus:outline-none focus:ring-sky-300/60 dark:bg-sky-200/60 dark:hover:bg-sky-300/60 dark:focus:ring-sky-400/60 dark:text-black">
                  <FaHome className='' />
                  <span className="">{(() => {
                    switch (friend?.address_sido) {
                      case '11': return (<span className="">서울특별시</span>)
                      case '26': return (<span className="">부산광역시</span>)
                      case '27': return (<span className="">대구광역시</span>)
                      case '28': return (<span className="">인천광역시</span>)
                      case '29': return (<span className="">광주광역시</span>)
                      case '30': return (<span className="">대전광역시</span>)
                      case '31': return (<span className="">울산광역시</span>)
                      case '36': return (<span className="">세종특별자치시</span>)
                      case '41': return (<span className="">경기도</span>)
                      case '42': return (<span className="">강원도</span>)
                      case '43': return (<span className="">충청북도</span>)
                      case '44': return (<span className="">충청남도</span>)
                      case '45': return (<span className="">전라북도</span>)
                      case '46': return (<span className="">전라남도</span>)
                      case '47': return (<span className="">경상북도</span>)
                      case '48': return (<span className="">경상남도</span>)
                      case '50': return (<span className="">제주특별자치도</span>)
                      default: null;
                    }
                  })(friend?.address_sido)}</span>
                  <span className=''>{defaultSigugun?.codeNm}</span>
                </p>
                <p className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-md font-medium text-center text-white bg-sky-600/60 hover:bg-sky-800/60 focus:ring-4 focus:outline-none focus:ring-sky-300/60 dark:bg-sky-200/60 dark:hover:bg-sky-300/60 dark:focus:ring-sky-400/60 dark:text-black">
                  <FaBuilding className='' />
                  <span className="">{(() => {
                    switch (friend?.company_location_sido) {
                      case '11': return (<span className="">서울특별시</span>)
                      case '26': return (<span className="">부산광역시</span>)
                      case '27': return (<span className="">대구광역시</span>)
                      case '28': return (<span className="">인천광역시</span>)
                      case '29': return (<span className="">광주광역시</span>)
                      case '30': return (<span className="">대전광역시</span>)
                      case '31': return (<span className="">울산광역시</span>)
                      case '36': return (<span className="">세종특별자치시</span>)
                      case '41': return (<span className="">경기도</span>)
                      case '42': return (<span className="">강원도</span>)
                      case '43': return (<span className="">충청북도</span>)
                      case '44': return (<span className="">충청남도</span>)
                      case '45': return (<span className="">전라북도</span>)
                      case '46': return (<span className="">전라남도</span>)
                      case '47': return (<span className="">경상북도</span>)
                      case '48': return (<span className="">경상남도</span>)
                      case '50': return (<span className="">제주특별자치도</span>)
                      default: null;
                    }
                  })(friend?.company_location_sido)}</span>
                  <span className=''>{defaultCompanySigugun?.codeNm}</span>
                </p>
                <div className="gap-1 inline-flex items-center rounded-md px-3 py-1.5 text-md font-medium text-center text-white bg-blue-600/60 hover:bg-blue-800/60 focus:ring-4 focus:outline-none focus:ring-blue-300/60 dark:bg-blue-600/60 dark:hover:bg-blue-700/60 dark:focus:ring-blue-800/60">
                  <FaBriefcase className='' />
                  <span className="text-md">{(() => {
                    switch (friend?.job) {
                      case '1': return (<span className="">대기업</span>)
                      case '2': return (<span className="">중견기업</span>)
                      case '3': return (<span className="">공기업</span>)
                      case '4': return (<span className="">공무원</span>)
                      case '5': return (<span className="">공공기관</span>)
                      case '6': return (<span className="">외국계</span>)
                      case '7': return (<span className="">전문직</span>)
                      case '8': return (<span className="">금융권</span>)
                      case '9': return (<span className="">교육계</span>)
                      case '10': return (<span className="">프리랜서</span>)
                      case '11': return (<span className="">사업가</span>)
                      case '12': return (<span className="">기타</span>)
                      default: null;
                    }
                  })(friend?.job)}</span>
                </div>
              </div>
            </div>
          </button>
        </motion.div>
      }
    </>
  );
};

index.propTypes = {
  friend: PropTypes.object,
};

export default index;
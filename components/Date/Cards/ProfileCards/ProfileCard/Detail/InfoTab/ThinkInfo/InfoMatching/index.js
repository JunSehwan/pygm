import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { MdSchool } from "react-icons/md";
import { FaBuilding } from "react-icons/fa";
import { FaDiceFour, FaBriefcase } from "react-icons/fa";
import { MdInterests } from "react-icons/md";
import { BiSolidDrink } from "react-icons/bi";
import { GiMuscleUp } from "react-icons/gi";
import { MdRestaurantMenu } from "react-icons/md";
import { BsAirplaneFill } from "react-icons/bs";
import { ImManWoman } from "react-icons/im";
import { MdChurch } from "react-icons/md";
import { TbSum } from "react-icons/tb";

const index = () => {
  const { user, friend, addLikeDone, addDislikeDone, friendsLoading, otherFriendLoading } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const [mbtiPoint, setMbtiPoint] = useState(0);
  const [hobbyPoint, setHobbyPoint] = useState(0);
  const [weddingPoint, setWeddingPoint] = useState(0);
  const [careerPoint, setCareerPoint] = useState(0);
  const [etcPoint, setEtcPoint] = useState(0);
  const [totalPoint, setTotalPoint] = useState(0);

  useEffect(() => {
    if (otherFriendLoading) {
      if (user?.mbti_ei == friend?.mbti_ei) {
        setMbtiPoint(prev => prev + 25)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.mbti_jp == friend?.mbti_jp) {
        setMbtiPoint(prev => prev + 25)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.mbti_sn == friend?.mbti_sn) {
        setMbtiPoint(prev => prev + 25)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.mbti_tf == friend?.mbti_tf) {
        setMbtiPoint(prev => prev + 25)
        setTotalPoint(prev => prev + (100 / 38))
      }
      // 취미생활
      if (user?.drink == friend?.drink) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.health == friend?.health) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.hotplace == friend?.hotplace) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.tour == friend?.tour) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.tourlike == friend?.tourlike) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.tourpurpose == friend?.tourpurpose) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.hobbyshare == friend?.hobbyshare) {
        setHobbyPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      // 연애관, 결혼생활
      if (user?.opfriend == friend?.opfriend) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.friendmeeting == friend?.friendmeeting) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.longdistance == friend?.longdistance) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.datecycle == friend?.datecycle) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.dateromance == friend?.dateromance) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.contact == friend?.contact) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.contactcycle == friend?.contactcycle) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.passwordshare == friend?.passwordshare) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.wedding == friend?.wedding) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.wedding_dating == friend?.wedding_dating) {
        setWeddingPoint(prev => prev + 10)
        setTotalPoint(prev => prev + (100 / 38))
      }

      // 경력, 생활정보
      if (user?.career_goal == friend?.career_goal) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.living_weekend == friend?.living_weekend) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.living_consume == friend?.living_consume) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.living_pet == friend?.living_pet) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.living_tatoo == friend?.living_tatoo) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.living_smoke == friend?.living_smoke) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.living_charming == friend?.living_charming) {
        setCareerPoint(prev => prev + 100 / 7)
        setTotalPoint(prev => prev + (100 / 38))
      }

      // 기타정보
      if (user?.religion == friend?.religion) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.religion_important == friend?.religion_important) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.religion_visit == friend?.religion_visit) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.religion_accept == friend?.religion_accept) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.food_taste == friend?.food_taste) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.food_like == friend?.food_like) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.food_dislike == friend?.food_dislike) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.food_vegetarian == friend?.food_vegetarian) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.food_spicy == friend?.food_spicy) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
      if (user?.food_diet == friend?.food_diet) {
        setEtcPoint(prev => prev + 100 / 10)
        setTotalPoint(prev => prev + (100 / 38))
      }
    }

  }, [otherFriendLoading, friend?.career_goal, friend?.contact, friend?.contactcycle,
    friend?.datecycle, friend?.dateromance, friend?.drink, friend?.food_diet,
    friend?.food_dislike, friend?.food_like, friend?.food_spicy,
    friend?.food_taste, friend?.food_vegetarian, friend?.friendmeeting,
    friend?.health, friend?.hobbyshare, friend?.hotplace,
    friend?.living_charming, friend?.living_consume, friend?.living_pet,
    friend?.living_smoke, friend?.living_tatoo, friend?.living_weekend,
    friend?.longdistance, friend?.mbti_ei, friend?.mbti_jp,
    friend?.mbti_sn, friend?.mbti_tf, friend?.opfriend,
    friend?.passwordshare, friend?.religion, friend?.religion_accept,
    friend?.religion_important, friend?.religion_visit, friend?.tour,
    friend?.tourlike, friend?.tourpurpose, friend?.wedding,
    friend?.wedding_dating, user?.career_goal, user?.contact,
    user?.contactcycle, user?.datecycle, user?.dateromance, user?.drink,
    user?.food_diet, user?.food_dislike, user?.food_like,
    user?.food_spicy, user?.food_taste, user?.food_vegetarian,
    user?.friendmeeting, user?.health, user?.hobbyshare, user?.hotplace,
    user?.living_charming, user?.living_consume, user?.living_pet,
    user?.living_smoke, user?.living_tatoo, user?.living_weekend,
    user?.longdistance, user?.mbti_ei, user?.mbti_jp, user?.mbti_sn,
    user?.mbti_tf, user?.opfriend, user?.passwordshare, user?.religion,
    user?.religion_accept, user?.religion_important,
    user?.religion_visit, user?.tour, user?.tourlike,
    user?.tourpurpose, user?.wedding, user?.wedding_dating])

  return (
    <>
      <div className='w-full mb-2 flex flex-col items-center'>
        <div className='p-3 rounded-lg w-full bg-gradient-to-r from-violet-200/50 to-pink-200/50 shadow-md border border-solid border-slate-100 flex flex-col items-center'>

          <h2 className='w-full pt-2 text-lg text-blue-900'>{friend?.nickname}님과 나와의 성향 매칭율</h2>
          <div className='text-sm text-gray-700 text-left w-full'>동일한 질문에 대해 동일한 응답시 매칭율이 올라가며,<br />
            해당 이성의 능력이나 매력을 평가하는 요소가 아니기에,<br /> 재미로 참고만 해주시기 바랍니다^^</div>
          <p className='text-sm text-pink-600 w-full pb-2'>(평균 매칭율 : 17.5%)</p>
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-white shadow text-[--pygm-four] p-2'>
                <FaDiceFour
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-800 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text'>MBTI</span>
                <span className='text-blue-700 font-semibold text-md'>
                  {mbtiPoint?.toFixed(1)}%
                </span>
              </span>
            </span>
          </div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-white shadow text-[--pygm-four] p-2'>
                <MdInterests
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-800 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text'>취미생활</span>
                <span className='text-blue-700 font-semibold text-md'>
                  {hobbyPoint?.toFixed(1)}%
                </span>
              </span>
            </span>
          </div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-white shadow text-[--pygm-four] p-2'>
                <ImManWoman
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-800 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text'>연애성향 및 결혼관</span>
                <span className='text-blue-700 font-semibold text-md'>
                  {weddingPoint?.toFixed(1)}%
                </span>
              </span>
            </span>
          </div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-white shadow text-[--pygm-four] p-2'>
                <FaBriefcase
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-800 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text'>경력목표와 생활정보</span>
                <span className='text-blue-700 font-semibold text-md'>
                  {careerPoint?.toFixed(1)}%
                </span>
              </span>
            </span>
          </div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-white shadow text-[--pygm-four] p-2'>
                <MdChurch
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-800 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text'>기타정보(종교, 식습관 등)</span>
                <span className='text-blue-700 font-semibold text-md'>
                  {etcPoint?.toFixed(1)}%
                </span>
              </span>
            </span>
          </div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-pink-200 shadow text-[--pygm-four] p-2'>
                <TbSum
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-800 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-sm font-light text'>총 평균 매칭율</span>
                <span className='text-pink-700 font-semibold text-lg'>
                  {totalPoint?.toFixed(1)}%
                </span>
              </span>
            </span>
          </div>

        </div>
      </div>
    </>
  );
};

export default index;
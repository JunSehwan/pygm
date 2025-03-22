import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { MdSchool } from "react-icons/md";
import { FaBuilding } from "react-icons/fa";
import { FaDiceFour } from "react-icons/fa";
import { MdInterests } from "react-icons/md";
import { BiSolidDrink } from "react-icons/bi";
import { GiMuscleUp } from "react-icons/gi";
import { MdRestaurantMenu } from "react-icons/md";
import { BsAirplaneFill } from "react-icons/bs";


const index = () => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <>
      <div className='w-full mb-2 flex flex-col items-center'>
        <div className='p-3 rounded-lg w-full bg-white shadow-md border border-solid border-slate-100 flex flex-col items-center'>

          <h2 className='w-full py-2 text-lg text-blue-600'>성향정보</h2>

          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaDiceFour
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>MBTI</span>
                <span>
                  {friend?.mbti_ei}{friend?.mbti_sn}{friend?.mbti_tf}{friend?.mbti_jp}
                </span>
              </span>
            </span>

            {/* 구분선 */}
            <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>
          </div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdInterests
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>취미나 특기</span>
                <span className='whitespace-pre-wrap w-full text-sm'>
                  {friend?.hobby ? friend?.hobby : "내용 없음"}
                </span></span>
            </span>
          </div>

          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <BiSolidDrink
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>음주 빈도</span>
                <span>
                  {(() => {
                    switch (friend?.drink) {
                      case '1': return (<span className="">전혀 없음</span>)
                      case '2': return (<span className="">월 1회 미만</span>)
                      case '3': return (<span className="">월 1회</span>)
                      case '4': return (<span className="">주 1회</span>)
                      case '5': return (<span className="">주 2~3회</span>)
                      case '6': return (<span className="">주 3~4회</span>)
                      case '7': return (<span className="">주 5회 이상</span>)
                      default: null;
                    }
                  })(friend?.drink)}
                </span></span>
            </span>
          </div>


          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <GiMuscleUp
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>평소 운동횟수</span>
                <span>
                  {(() => {
                    switch (friend?.health) {
                      case '1': return (<span className="">전혀 안함</span>)
                      case '2': return (<span className="">아주 가끔</span>)
                      case '3': return (<span className="">주 1회</span>)
                      case '4': return (<span className="">주 2~3회</span>)
                      case '5': return (<span className="">주 4~5회</span>)
                      case '6': return (<span className="">매일</span>)
                      default: null;
                    }
                  })(friend?.health)}
                </span></span>
            </span>
          </div>


          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdRestaurantMenu
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>줄을 서서라도 맛집을 가는 것을 선호하는 편인가요?</span>
                <span>
                  {(() => {
                    switch (friend?.hotplace) {
                      case '1': return (<span className="">관심 없음</span>)
                      case '2': return (<span className="">집 근처면 가끔 가는수준</span>)
                      case '3': return (<span className="">가끔씩 맛집 방문</span>)
                      case '4': return (<span className="">맛집탐방 매니아</span>)
                      default: null;
                    }
                  })(friend?.hotplace)}
                </span></span>
            </span>
          </div>

          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <BsAirplaneFill
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>여행을 선호하나요?</span>
                <span>
                  {(() => {
                    switch (friend?.tour) {
                      case '1': return (<span className="">관심없음</span>)
                      case '2': return (<span className="">수년에 1회</span>)
                      case '3': return (<span className="">년 1~2회</span>)
                      case '4': return (<span className="">년 3~6회</span>)
                      case '5': return (<span className="">년 7~12회</span>)
                      case '6': return (<span className="">월 1회 이상</span>)
                      default: null;
                    }
                  })(friend?.tour)}
                </span></span>
            </span>
          </div>

          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <BsAirplaneFill
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>선호하는 여행은?</span>
                <span>
                  {(() => {
                    switch (friend?.tourlike) {
                      case '1': return (<span className="">관심없음</span>)
                      case '2': return (<span className="">국내여행</span>)
                      case '3': return (<span className="">해외여행</span>)
                      case '4': return (<span className="">어디든 좋음</span>)
                      default: null;
                    }
                  })(friend?.tourlike)}
                </span></span>
            </span>
          </div>

          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <BsAirplaneFill
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>여행의 주된 목적은?</span>
                <span>
                  {(() => {
                    switch (friend?.tourpurpose) {
                      case '1': return (<span className="">주로 관광</span>)
                      case '2': return (<span className="">주로 휴양</span>)
                      case '3': return (<span className="">새로운 경험과 문화접촉</span>)
                      case '4': return (<span className="">사람들과의 관계</span>)
                      case '5': return (<span className="">일상의 해방</span>)
                      case '6': return (<span className="">도전과 탐험</span>)
                      default: null;
                    }
                  })(friend?.tourpurpose)}
                </span></span>
            </span>
          </div>

          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdInterests
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>취미를 공유하는 것에 대해 어떻게 생각하나요?</span>
                <span>
                  {(() => {
                    switch (friend?.hobbyshare) {
                      case '1': return (<span className="">상대방의 취미엔 신경안씀</span>)
                      case '2': return (<span className="">한 개 정도는 공유하고 싶다</span>)
                      case '3': return (<span className="">많은 취미를 함께하고 싶다</span>)
                      case '4': return (<span className="">생각해 본 적 없음</span>)
                      default: null;
                    }
                  })(friend?.hobbyshare)}
                </span></span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default index;
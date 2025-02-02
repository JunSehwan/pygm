import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { ImManWoman } from "react-icons/im";
import { MdOutlineSocialDistance } from "react-icons/md";
import { MdDateRange } from "react-icons/md";
import { GiLovers } from "react-icons/gi";
import { BsChatSquareHeartFill } from "react-icons/bs";
import { FaLock } from "react-icons/fa";
import { GiEngagementRing } from "react-icons/gi";
import { GiCycle } from "react-icons/gi";
import { FaHeartCircleBolt } from "react-icons/fa6";
import { BsFillEmojiFrownFill } from "react-icons/bs";



const index = () => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <div className='w-full mb-2 flex flex-col items-center'>
      <div className='p-3 rounded-lg w-full bg-white shadow-md border border-solid border-slate-100 flex flex-col items-center'>

        <h2 className='w-full py-2 text-lg text-blue-600'>연애 및 결혼관</h2>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <ImManWoman
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>이성친구가 많은 편인가요?</span>
              <span>
                {(() => {
                  switch (friend?.opfriend) {
                    case '1': return (<span className="">전혀 없음</span>)
                    case '2': return (<span className="">한 두명</span>)
                    case '3': return (<span className="">몇 명 있음</span>)
                    case '4': return (<span className="">많은 편이다</span>)
                    default: null;
                  }
                })(friend?.opfriend)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>


        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <BsFillEmojiFrownFill
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>연인이 다른 이성과 단 둘이 만나도 될까요?</span>
              <span>
                {(() => {
                  switch (friend?.friendmeeting) {
                    case '1': return (<span className="">절대불가</span>)
                    case '2': return (<span className="">차 한잔 정도 가능</span>)
                    case '3': return (<span className="">같이 식사 한끼정도 가능</span>)
                    case '4': return (<span className="">문화생활을 함께 하는 정도 가능</span>)
                    case '5': return (<span className="">술 한 잔 가능</span>)
                    case '6': return (<span className="">상관 없음</span>)
                    default: null;
                  }
                })(friend?.friendmeeting)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>


        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <MdOutlineSocialDistance
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>장거리연애에 대해서 어떻게 생각하나요?</span>
              <span>
                {(() => {
                  switch (friend?.longdistance) {
                    case '1': return (<span className="">절대불가</span>)
                    case '2': return (<span className="">가능하지만 자신은 없음</span>)
                    case '3': return (<span className="">가능한 편</span>)
                    case '4': return (<span className="">웬만하면 가능</span>)
                    default: null;
                  }
                })(friend?.longdistance)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <MdDateRange
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>선호하는 데이트(만남)의 주기는?</span>
              <span>
                {(() => {
                  switch (friend?.datecycle) {
                    case '1': return (<span className="">한달에 1회미만</span>)
                    case '2': return (<span className="">한달에 1회</span>)
                    case '3': return (<span className="">격주 1회</span>)
                    case '4': return (<span className="">주1~2회</span>)
                    case '5': return (<span className="">주3~4회</span>)
                    case '6': return (<span className="">주5~7회</span>)
                    default: null;
                  }
                })(friend?.datecycle)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <GiLovers
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>어떤 연애스타일을 추구하나요?</span>
              <span>
                {(() => {
                  switch (friend?.dateromance) {
                    case '1': return (<span className="">같이 산책하는 등 소소한 행복</span>)
                    case '2': return (<span className="">항상 설레는 연애</span>)
                    case '3': return (<span className="">새로운 경험을 함께하는 연애</span>)
                    case '4': return (<span className="">현실적, 안정적인 연애</span>)
                    default: null;
                  }
                })(friend?.dateromance)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <BsChatSquareHeartFill
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>연애할 때 연락은 얼마나 중요한가요?</span>
              <span>
                {(() => {
                  switch (friend?.contact) {
                    case '1': return (<span className="">전혀 중요하지 않다</span>)
                    case '2': return (<span className="">크게 중요하지 않음</span>)
                    case '3': return (<span className="">연애 초기에만 중요한 편</span>)
                    case '4': return (<span className="">중요한 편이다</span>)
                    case '5': return (<span className="">매우 중요하다</span>)
                    default: null;
                  }
                })(friend?.contact)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <GiCycle
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>연애를 할 때 선호하는 연락주기는?</span>
              <span>
                {(() => {
                  switch (friend?.contactcycle) {
                    case '1': return (<span className="">매번 어디든 상황공유</span>)
                    case '2': return (<span className="">최소 아침, 저녁에는 연락필요</span>)
                    case '3': return (<span className="">이따금씩 한번씩</span>)
                    case '4': return (<span className="">하루에 한 번 정도</span>)
                    case '5': return (<span className="">상관 없다</span>)
                    default: null;
                  }
                })(friend?.contactcycle)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaLock
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>연인에게 내 휴대폰 비밀번호 공유가 가능한가요?</span>
              <span>
                {(() => {
                  switch (friend?.passwordshare) {
                    case '1': return (<span className="">프라이버시는 지켜줘야 한다</span>)
                    case '2': return (<span className="">알려줘도 상관없다</span>)
                    default: null;
                  }
                })(friend?.passwordshare)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <GiEngagementRing
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>인연이 생긴다면 결혼생각이 얼마나 있나요?</span>
              <span>
                {(() => {
                  switch (friend?.wedding) {
                    case '1': return (<span className="">아직 관심없음</span>)
                    case '2': return (<span className="">원하지만 아직 계획은 없음</span>)
                    case '3': return (<span className="">1~2년내 가능</span>)
                    case '4': return (<span className="">당장이라도 가능</span>)
                    default: null;
                  }
                })(friend?.wedding)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaHeartCircleBolt
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>결혼 전에 적절하다고 판단하는 연애 기간은?</span>
              <span>
                {(() => {
                  switch (friend?.wedding_dating) {
                    case '1': return (<span className="">크게 중요하지 않음</span>)
                    case '2': return (<span className="">3년 이상</span>)
                    case '3': return (<span className="">1년 ~ 3년</span>)
                    case '4': return (<span className="">6개월 ~ 1년</span>)
                    case '5': return (<span className="">6개월이내 가능</span>)
                    case '6': return (<span className="">3개월이내 가능</span>)
                    default: null;
                  }
                })(friend?.wedding_dating)}
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

      </div>
    </div>
  );
};

export default index;
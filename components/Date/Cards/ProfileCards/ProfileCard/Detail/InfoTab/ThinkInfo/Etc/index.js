import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { MdChurch } from "react-icons/md";
import { GiCycle } from "react-icons/gi";
import { BsHourglassSplit } from "react-icons/bs";
import { BiSolidGame } from "react-icons/bi";
import { FaRegThumbsUp } from "react-icons/fa6";
import { FaRegThumbsDown } from "react-icons/fa6";
import { FaLeaf } from "react-icons/fa";
import { MdSoupKitchen } from "react-icons/md";
import { FaRunning } from "react-icons/fa";



const index = () => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <>
      <div className='w-full mb-2 flex flex-col items-center'>
        <div className='p-3 rounded-lg w-full bg-white shadow-md border border-solid border-slate-100 flex flex-col items-center'>

          <h2 className='w-full py-2 text-lg text-blue-600'>기타정보</h2>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdChurch
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>본인에게 종교는 얼마나 큰 의미인가요?</span>
                <span>
                  {(() => {
                    switch (friend?.religion_important) {
                      case '1': return (<span className="">무교</span>)
                      case '2': return (<span className="">큰 의미는 없음</span>)
                      case '3': return (<span className="">이따금씩 의지하는 수준</span>)
                      case '4': return (<span className="">매우 중요한 의미</span>)
                      case '5': return (<span className="">내 인생의 가장 우선순위</span>)
                      default: null;
                    }
                  })(friend?.religion_important)}
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
                <span className='text-xs font-light text-slate-500'>종교행사에 참석하는 빈도는 어떻게 되나요?</span>
                <span>
                  {(() => {
                    switch (friend?.religion_visit) {
                      case '1': return (<span className="">무교</span>)
                      case '2': return (<span className="">거의 참석 안함</span>)
                      case '3': return (<span className="">월 1회 이하</span>)
                      case '4': return (<span className="">월 2~3회</span>)
                      case '5': return (<span className="">주 1회</span>)
                      case '6': return (<span className="">주 2회 이상</span>)
                      default: null;
                    }
                  })(friend?.religion_visit)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <BsHourglassSplit
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>내 연인이 종교활동에 참여하는 것에 대해서 어떻게 생각하나요?</span>
                <span>
                  {(() => {
                    switch (friend?.religion_accept) {
                      case '1': return (<span className="">무교만 가능</span>)
                      case '2': return (<span className="">안 했으면 한다</span>)
                      case '3': return (<span className="">아주 가끔은 괜찮다</span>)
                      case '4': return (<span className="">월 1회</span>)
                      case '5': return (<span className="">월 2~3회</span>)
                      case '6': return (<span className="">주 1회</span>)
                      case '7': return (<span className="">상관 없음</span>)
                      default: null;
                    }
                  })(friend?.religion_accept)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <BiSolidGame
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>입맛이 까다로운 편이신가요?</span>
                <span>
                  {(() => {
                    switch (friend?.food_taste) {
                      case '1': return (<span className="">가리는게 없음</span>)
                      case '2': return (<span className="">몇가지 빼고는 다 잘먹음</span>)
                      case '3': return (<span className="">까다로운 편</span>)
                      case '4': return (<span className="">매우 까다로움</span>)
                      default: null;
                    }
                  })(friend?.food_taste)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaRegThumbsUp
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>어떤 음식종류를 가장 선호하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.food_like) {
                      case '1': return (<span className="">돼지고기</span>)
                      case '2': return (<span className="">소고기</span>)
                      case '3': return (<span className="">치킨</span>)
                      case '4': return (<span className="">중식</span>)
                      case '5': return (<span className="">돈까스</span>)
                      case '6': return (<span className="">회</span>)
                      case '7': return (<span className="">초밥</span>)
                      case '8': return (<span className="">피자</span>)
                      case '9': return (<span className="">패스트푸드</span>)
                      case '10': return (<span className="">찜,탕류</span>)
                      case '11': return (<span className="">족발,보쌈</span>)
                      case '12': return (<span className="">떡볶이 등 분식류</span>)
                      case '13': return (<span className="">감자탕</span>)
                      case '14': return (<span className="">한식류</span>)
                      case '15': return (<span className="">기타</span>)
                      default: null;
                    }
                  })(friend?.food_like)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaRegThumbsDown
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>못 먹는 음식을 선택해주세요.</span>
                <span>
                  {(() => {
                    switch (friend?.food_dislike) {
                      case '1': return (<span className="">가리는 것 없음</span>)
                      case '2': return (<span className="">비린내나는 음식</span>)
                      case '3': return (<span className="">소고기</span>)
                      case '4': return (<span className="">돼지고기</span>)
                      case '5': return (<span className="">닭고기</span>)
                      case '6': return (<span className="">채소류</span>)
                      case '7': return (<span className="">생선류</span>)
                      case '8': return (<span className="">날것류</span>)
                      case '9': return (<span className="">곱창/내장 등</span>)
                      case '10': return (<span className="">고수</span>)
                      case '11': return (<span className="">향신료 강한 음식</span>)
                      case '12': return (<span className="">매운 음식</span>)
                      case '13': return (<span className="">징그러운 비주얼</span>)
                      case '14': return (<span className="">냄새가 강한 음식</span>)
                      default: null;
                    }
                  })(friend?.food_dislike)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaLeaf
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>채식주의자인가요?</span>
                <span>
                  {(() => {
                    switch (friend?.food_vegetarian) {
                      case '1': return (<span className="">채식주의자다</span>)
                      case '2': return (<span className="">채식을 주로 먹는다</span>)
                      case '3': return (<span className="">채식주의자가 아니다</span>)
                      case '4': return (<span className="">채식을 선호하지 않는다</span>)
                      default: null;
                    }
                  })(friend?.food_vegetarian)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdSoupKitchen
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>매운 음식을 선호하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.food_spicy) {
                      case '1': return (<span className="">정말 못 먹는다</span>)
                      case '2': return (<span className="">있으면 먹는 정도</span>)
                      case '3': return (<span className="">가끔 찾아먹는다</span>)
                      case '4': return (<span className="">즐겨 먹는다</span>)
                      case '5': return (<span className="">매운맛 매니아</span>)
                      default: null;
                    }
                  })(friend?.food_spicy)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaRunning
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>다이어트 식단을 하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.food_diet) {
                      case '1': return (<span className="">관심없다</span>)
                      case '2': return (<span className="">현재 하지 않는다</span>)
                      case '3': return (<span className="">이따금씩 식단을 한다</span>)
                      case '4': return (<span className="">진행중이다</span>)
                      case '5': return (<span className="">매끼마다 식단 중</span>)
                      default: null;
                    }
                  })(friend?.food_diet)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>



        </div>

      </div>

    </>
  );
};

export default index;
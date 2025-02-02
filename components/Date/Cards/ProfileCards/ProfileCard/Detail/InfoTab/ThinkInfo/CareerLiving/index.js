import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaBriefcase } from "react-icons/fa";
import { MdFreeBreakfast } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { MdOutlinePets } from "react-icons/md";
import { FaPaintBrush } from "react-icons/fa";
import { MdOutlineSmokeFree } from "react-icons/md";
import { GiCharm } from "react-icons/gi";



const index = () => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <>
      <div className='w-full mb-2 flex flex-col items-center'>
        <div className='p-3 rounded-lg w-full bg-white shadow-md border border-solid border-slate-100 flex flex-col items-center'>

          <h2 className='w-full py-2 text-lg text-blue-600'>경력/생활정보</h2>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaBriefcase
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>미래의 경력목표가 있나요?</span>
                <span>
                  {(() => {
                    switch (friend?.career_goal) {
                      case '1': return (<span className="">꾸준히 지금 일을 계속한다</span>)
                      case '2': return (<span className="">학위 또는 자격취득</span>)
                      case '3': return (<span className="">이직 또는 취업</span>)
                      case '4': return (<span className="">사업</span>)
                      case '5': return (<span className="">카페나 자영업</span>)
                      case '6': return (<span className="">투자, 재테크</span>)
                      case '7': return (<span className="">투잡</span>)
                      case '8': return (<span className="">관심 없음</span>)
                      default: null;
                    }
                  })(friend?.career_goal)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdFreeBreakfast
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>주말에는 주로 어떤 활동을 하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.living_weekend) {
                      case '1': return (<span className="">집에서 휴식</span>)
                      case '2': return (<span className="">산책과 운동</span>)
                      case '3': return (<span className="">친구만나기</span>)
                      case '4': return (<span className="">학습(직무/재테크 등)</span>)
                      case '5': return (<span className="">취미생활</span>)
                      case '6': return (<span className="">봉사활동</span>)
                      case '7': return (<span className="">드라이브</span>)
                      case '8': return (<span className="">게임</span>)
                      case '9': return (<span className="">기타</span>)
                      default: null;
                    }
                  })(friend?.living_weekend)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaShoppingCart
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>본인의 소비습관은 어떤가요?</span>
                <span>
                  {(() => {
                    switch (friend?.living_consume) {
                      case '1': return (<span className="">자린고비</span>)
                      case '2': return (<span className="">필요한것만 사는 편</span>)
                      case '3': return (<span className="">이따금씩 플랙스!</span>)
                      case '4': return (<span className="">고민없이 플랙스!</span>)
                      case '5': return (<span className="">스트레스 해소로 플랙스!</span>)
                      default: null;
                    }
                  })(friend?.living_consume)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdOutlinePets
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>반려동물을 키우는 것에 대해서 어떻게 생각하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.living_pet) {
                      case '1': return (<span className="">매우 싫다</span>)
                      case '2': return (<span className="">반려동물은 그닥...</span>)
                      case '3': return (<span className="">크게 상관없다</span>)
                      case '4': return (<span className="">매우 긍정적</span>)
                      case '5': return (<span className="">동물에 따라 다름</span>)
                      default: null;
                    }
                  })(friend?.living_pet)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <FaPaintBrush
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>타투(문신)에 대해서 어떻게 생각하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.living_tatoo) {
                      case '1': return (<span className="">매우 싫다</span>)
                      case '2': return (<span className="">한 두개는 괜찮다</span>)
                      case '3': return (<span className="">괜찮다</span>)
                      case '4': return (<span className="">멋지다고 생각한다</span>)
                      case '5': return (<span className="">나 역시 타투 경험이 있다</span>)
                      default: null;
                    }
                  })(friend?.living_tatoo)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <MdOutlineSmokeFree
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>흡연에 대해서 어떻게 생각하시나요?</span>
                <span>
                  {(() => {
                    switch (friend?.living_smoke) {
                      case '1': return (<span className="">긍정적이다</span>)
                      case '2': return (<span className="">크게 상관없다</span>)
                      case '3': return (<span className="">전자담배는 괜찮다</span>)
                      case '4': return (<span className="">조금은 부정적이다</span>)
                      case '5': return (<span className="">끊으면 좋겠다</span>)
                      case '6': return (<span className="">매우 싫다</span>)
                      case '7': return (<span className="">생각해 본 적 없다</span>)
                      default: null;
                    }
                  })(friend?.living_smoke)}
                </span></span>
            </span>
          </div>
          {/* 구분선 */}
          <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

          <div className='w-full flex flex-row justify-start items-center my-1'>
            <span className='p-1 pr-3'>
              <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
                <GiCharm
                  className='w-6 h-6'
                />
              </div>
            </span>
            <span className='text-left font-normal text-md text-gray-600 w-full'>
              <span className="w-full flex flex-col items-start">
                <span className='text-xs font-light text-slate-500'>가장 큰 나의 매력포인트는?</span>
                <span>
                  {(() => {
                    switch (friend?.living_charming) {
                      case '1': return (<span className="">귀여움</span>)
                      case '2': return (<span className="">섹시함</span>)
                      case '3': return (<span className="">청순함</span>)
                      case '4': return (<span className="">새침함</span>)
                      case '5': return (<span className="">순둥이</span>)
                      case '6': return (<span className="">앙칼짐</span>)
                      case '7': return (<span className="">터프함</span>)
                      case '8': return (<span className="">시크함</span>)
                      case '9': return (<span className="">쿨함</span>)
                      case '10': return (<span className="">싸가지</span>)
                      case '11': return (<span className="">듬직함</span>)
                      case '12': return (<span className="">병맛</span>)
                      case '13': return (<span className="">겸손함</span>)
                      case '14': return (<span className="">느끼함</span>)
                      case '15': return (<span className="">유머러스</span>)
                      case '16': return (<span className="">유치함</span>)
                      case '17': return (<span className="">진지함</span>)
                      case '18': return (<span className="">집중력</span>)
                      case '19': return (<span className="">배려심</span>)
                      case '20': return (<span className="">착함</span>)
                      case '21': return (<span className="">로맨틱</span>)
                      case '22': return (<span className="">자유분방함</span>)
                      case '23': return (<span className="">섬세함</span>)
                      default: null;
                    }
                  })(friend?.living_charming)}
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
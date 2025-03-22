import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { MdSchool } from "react-icons/md";
import { FaBuilding } from "react-icons/fa";


const index = () => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();

  return (
    <div className='w-full my-2 flex flex-col items-center'>
      <div className='p-3 rounded-lg w-full bg-white shadow-md border border-solid border-slate-100 flex flex-col items-center'>

        <h2 className='w-full py-2 text-lg text-blue-600'>학력 및 경력정보</h2>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <MdSchool
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>학력</span>
              <span>
                {(() => {
                  switch (friend?.education) {
                    case '1': return (<span className="">초등학교 졸업</span>)
                    case '2': return (<span className="">중학교 졸업</span>)
                    case '3': return (<span className="">고등학교 졸업</span>)
                    case '4': return (<span className="">전문대 재학중</span>)
                    case '5': return (<span className="">전문대 졸업</span>)
                    case '6': return (<span className="">특수/기타학교 재학중</span>)
                    case '7': return (<span className="">특수/기타학교 졸업</span>)
                    case '8': return (<span className="">4년제대학 재학</span>)
                    case '9': return (<span className="">4년제대학 졸업</span>)
                    case '10': return (<span className="">대학원 재학</span>)
                    case '11': return (<span className="">석사</span>)
                    case '12': return (<span className="">박사</span>)
                    default: null;
                  }
                })(friend?.education)}
              </span></span>
          </span>
        </div>

        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <MdSchool
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>졸업학교</span>
              <span>
                {friend?.school_open === true ? friend?.school : "미공개"}
              </span></span>
          </span>
        </div>
        
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>
        
        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaBuilding
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>직업</span>
              <span>
                {(() => {
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
                })(friend?.job)}
              </span></span>
          </span>
        </div>
        
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaBuilding
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>재직회사명</span>
              <span>
                {friend?.company_open === true ? friend?.company : "미공개"}
              </span></span>
          </span>
        </div>

        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaBuilding
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>주요업무</span>
              <span className='whitespace-pre-wrap w-full text-sm'>
                {friend?.duty ? friend?.duty : "내용 없음"}
              </span></span>
          </span>
        </div>

        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaBuilding
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>연봉수준</span>
              <span>
                {(() => {
                  switch (friend?.salary) {
                    case '20': return (<span className="">비공개</span>)
                    case '1': return (<span className="">2,000만원 이하</span>)
                    case '2': return (<span className="">2,000 ~ 2,500만원</span>)
                    case '3': return (<span className="">2,500 ~ 3,000만원</span>)
                    case '4': return (<span className="">3,000 ~ 3,500만원</span>)
                    case '5': return (<span className="">3,500 ~ 4,000만원</span>)
                    case '6': return (<span className="">4,000 ~ 4,500만원</span>)
                    case '7': return (<span className="">4,500 ~ 5,000만원</span>)
                    case '8': return (<span className="">5,000 ~ 5,500만원</span>)
                    case '9': return (<span className="">5,500 ~ 6,000만원</span>)
                    case '10': return (<span className="">6,000 ~ 7,000만원</span>)
                    case '11': return (<span className="">7,000 ~ 8,000만원</span>)
                    case '12': return (<span className="">8,000 ~ 9,000만원</span>)
                    case '13': return (<span className="">9,000 ~ 1억원</span>)
                    case '14': return (<span className="">1억원 이상</span>)
                    default: null;
                  }
                })(friend?.salary)}
              </span></span>
          </span>
        </div>

      </div>
    </div>
  );
};

export default index;
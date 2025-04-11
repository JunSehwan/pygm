import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import hangjungdong from 'components/Common/Address';
import { BsFillPersonVcardFill } from "react-icons/bs";
import { FaCalendarDays } from "react-icons/fa6";
import { TiHomeOutline } from "react-icons/ti";
import { MdOutlineMapsHomeWork } from "react-icons/md";
import { GiGreekTemple } from "react-icons/gi";


const index = () => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const { sido, sigugun, dong } = hangjungdong;
  const sigugunList = hangjungdong?.sigugun;
  const resultArr = [];
  sigugunList?.map((v) => {
    v?.sido == friend?.address_sido ? resultArr?.push(v) : null
  }, [friend?.address_sido])

  const [defaultSido] = sido?.filter((item) => item?.sido == friend?.address_sido, [])
  const [defaultSigugun] = sigugun?.filter((item) => item?.sido == friend?.address_sido && item?.sigugun == friend?.address_sigugun, [])

  const resultComArr = [];
  sigugunList?.map((v) => {
    v?.sido == friend?.company_location_sido ? resultComArr?.push(v) : null
  }, [friend?.company_location_sido])

  const [defaultComSido] = sido?.filter((item) => item?.sido == friend?.company_location_sido, [])
  const [defaultComSigugun] = sigugun?.filter((item) => item?.sido == friend?.company_location_sido && item?.sigugun == friend?.company_location_sigugun, [])

  return (
    <div className='w-full my-2 flex flex-col items-center'>
      <div className='p-3 rounded-lg w-full bg-white shadow-md border border-solid border-slate-100 flex flex-col items-center'>

        <h2 className='w-full py-2 text-lg text-blue-600'>기본정보</h2>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <BsFillPersonVcardFill
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-bold text-xl text-black w-full'>
            {friend?.nickname}
          </span>
        </div>

        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <FaCalendarDays
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-semibold text-lg text-gray-600 w-full'>
            {friend?.birthday?.year}년생
          </span>
        </div>

        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <TiHomeOutline
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>거주지</span>
              <span>
                {(() => {
                  switch (friend?.address_sido) {
                    case '11': return (<span className="">서울특별시</span>)
                    case '12': return (<span className="">인천광역시</span>)
                    case '13': return (<span className="">경기도</span>)

                    case '21': return (<span className="">충청북도</span>)
                    case '22': return (<span className="">대전광역시</span>)
                    case '23': return (<span className="">세종특별자치시</span>)
                    case '24': return (<span className="">충청남도</span>)

                    case '32': return (<span className="">강원도</span>)

                    case '41': return (<span className="">광주광역시</span>)
                    case '42': return (<span className="">전라북도</span>)
                    case '43': return (<span className="">전라남도</span>)

                    case '51': return (<span className="">대구광역시</span>)
                    case '52': return (<span className="">경상북도</span>)
                    case '53': return (<span className="">경상남도</span>)
                    case '54': return (<span className="">울산광역시</span>)
                    case '55': return (<span className="">부산광역시</span>)

                    case '60': return (<span className="">제주특별자치도</span>)
                    default: null;
                  }
                })(friend?.address_sido)}
                <span className='pl-2 '>{defaultSigugun?.codeNm}</span>
              </span></span>
          </span>
        </div>

        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <MdOutlineMapsHomeWork
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>근무지</span>
              <span>
                {(() => {
                  switch (friend?.company_location_sido) {
                    case '11': return (<span className="">서울특별시</span>)
                    case '12': return (<span className="">인천광역시</span>)
                    case '13': return (<span className="">경기도</span>)

                    case '21': return (<span className="">충청북도</span>)
                    case '22': return (<span className="">대전광역시</span>)
                    case '23': return (<span className="">세종특별자치시</span>)
                    case '24': return (<span className="">충청남도</span>)

                    case '32': return (<span className="">강원도</span>)

                    case '41': return (<span className="">광주광역시</span>)
                    case '42': return (<span className="">전라북도</span>)
                    case '43': return (<span className="">전라남도</span>)

                    case '51': return (<span className="">대구광역시</span>)
                    case '52': return (<span className="">경상북도</span>)
                    case '53': return (<span className="">경상남도</span>)
                    case '54': return (<span className="">울산광역시</span>)
                    case '55': return (<span className="">부산광역시</span>)

                    case '60': return (<span className="">제주특별자치도</span>)
                    default: null;
                  }
                })(friend?.company_location_sido)}
                <span className='pl-2 '>{defaultComSigugun?.codeNm}</span>
              </span></span>
          </span>
        </div>
        {/* 구분선 */}
        <div className='w-[70%] border-none my-1 border-gray-100 h-0'></div>

        <div className='w-full flex flex-row justify-start items-center my-1'>
          <span className='p-1 pr-3'>
            <div className='rounded-2xl bg-slate-200 text-[--pygm-four] p-2'>
              <GiGreekTemple
                className='w-6 h-6'
              />
            </div>
          </span>
          <span className='text-left font-normal text-md text-gray-600 w-full'>
            <span className="w-full flex flex-col items-start">
              <span className='text-xs font-light text-slate-500'>종교</span>
              <span>
                {(() => {
                  switch (friend?.religion) {
                    case '1': return (<span className="">무교</span>)
                    case '2': return (<span className="">기독교</span>)
                    case '3': return (<span className="">천주교</span>)
                    case '4': return (<span className="">불교</span>)
                    case '5': return (<span className="">원불교</span>)
                    case '6': return (<span className="">유교</span>)
                    case '7': return (<span className="">대종교</span>)
                    case '8': return (<span className="">천도교</span>)
                    case '9': return (<span className="">대순리진회</span>)
                    case '10': return (<span className="">이슬람교</span>)
                    case '11': return (<span className="">힌두교</span>)
                    case '12': return (<span className="">유대교</span>)
                    case '13': return (<span className="">기타</span>)
                    default: null;
                  }
                })(friend?.religion)}
              </span></span>
          </span>
        </div>

      </div>
    </div>
  );
};

export default index;
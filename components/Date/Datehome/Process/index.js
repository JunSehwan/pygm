import React from 'react';
import Image from 'next/image';
import dating_process from '/public/image/dating_home_process.png';
import { FaKissWinkHeart } from "react-icons/fa";
import { ImProfile } from "react-icons/im";
import { FaAddressCard } from "react-icons/fa";
import { FaPeopleArrows } from "react-icons/fa";
import Link from 'next/link';

const index = () => {
  return (
    <div className='w-full mb-4 bg-gradient-to-b from-slate-100 to-white'>

      <div className="mb-10 w-full mx-auto px-4" data-aos="fade-right">
        <div className='w-full mx-auto px-3 rounded-md bg-white shadow-inner py-3'>
          <h2 className="my-3 text-lg font-semibold text-gray-900 dark:text-white">이런 분들께 추천드립니다.</h2>
          <ul className="max-w-md space-y-2 text-gray-500 list-inside dark:text-gray-400">
            <li className="flex items-center">
              <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
              </svg>
              20-30대 남녀 솔로인 분
            </li>
            <li className="flex items-center">
              <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
              </svg>
              신중하게 검증된 이성을 만나고 싶으신 분
            </li>
            <li className="flex items-center">
              <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
              </svg>
              금액에 큰 부담없이 인연을 만나고 싶으신 분
            </li>
          </ul>
        </div>
      </div>

      <div className='w-full mx-auto px-4' data-aos="fade-right">
        <p className='w-full text-md pb-2 text-gray-400'>
          외모와 능력, 가치관의 맞춤형 소개팅
        </p>
        <p className='w-full text-3xl text-black font-bold'>
          단 한번을 만나더라도<br />
          의미있는 만남을 가져보세요!
        </p>
        <div className='w-full my-3 flex justify-center'>
          <Image
            src={dating_process}
            width={360}
            alt="PYGM_Process_dating"
            height={360}
            unoptimized
            priority>
          </Image>
        </div>
      </div>

      <div className='w-full mx-auto px-6 mb-6' data-aos="fade-right">
        <ol className="relative text-gray-500 border-l border-solid border-s border-gray-200 dark:border-gray-700 dark:text-gray-400">
          <li className="mb-10 ms-6">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-gray-700">
              <ImProfile
                className="text-gray-500"
                size={18}
              />
            </span>
            <h3 className="font-medium leading-tight">프로필 작성하기</h3>
            <p className="text-sm">연애관련 재밌는 질문들에 응답하면서 프로필을 작성해주세요.</p>
          </li>
          <li className="mb-10 ms-6">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-gray-700">
              <FaAddressCard
                className="text-gray-500"
                size={18}
              />
            </span>
            <h3 className="font-medium leading-tight">이성 소개받기</h3>
            <p className="text-sm">매주 새로운 이성을 소개받을 수 있습니다. 나와 잘 맞는 이성을 찾아보세요.</p>
          </li>
          <li className="mb-10 ms-6">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-gray-700">
              <FaKissWinkHeart
                className="text-gray-500"
                size={18}
              />
            </span>
            <h3 className="font-medium leading-tight">윙크 보내기</h3>
            <p className="text-sm">호감가는 이성을 찾았다면 윙크를 보내보세요! 상대방이 윙크를 받고 마찬가지로 윙크를 보낸다면 매칭은 성사됩니다.</p>
          </li>
          <li className="ms-6">
            <span className="absolute flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full -start-4 ring-4 ring-white dark:ring-gray-900 dark:bg-gray-700">
              <FaPeopleArrows
                className="text-gray-500"
                size={18}
              />
            </span>
            <h3 className="font-medium leading-tight">매칭 후 연락처 공유</h3>
            <p className="text-sm">매칭이 되면 연락처가 공유됩니다. 이성과의 즐거운 만남을 가져보세요!</p>
          </li>
        </ol>
      </div>

      <div className='w-full py-4' >
        <div className="flex flex-col justify-center sm:flex-row sm:space-y-0 w-full" data-aos="zoom-in">
          <Link href="/date/profile" className="w-[50%] mx-auto inline-flex justify-center items-center py-4 text-base font-medium text-center text-white rounded-lg bg-violet-500 hover:bg-opacity-70 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900">
            시작하기
            <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
            </svg>
          </Link>
          {/* <a href="#" className="inline-flex justify-center hover:text-gray-900 items-center py-3 px-5 sm:ms-4 text-base font-medium text-center text-white rounded-lg border border-white hover:bg-gray-100 focus:ring-4 focus:ring-gray-400">
            더 알아보기
          </a> */}

        </div>
        <p className='w-full text-lg text-center py-6 text-blue-600'>
          이제 시작해볼까요?
        </p>
      </div>
    </div>
  );
};

export default index;
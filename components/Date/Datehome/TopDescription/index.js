import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const index = () => {
  return (
    <section className="bg-center bg-no-repeat bg-[url('/image/date_home_topsection.jpg')] bg-gray-500 bg-blend-multiply">
      <div className="px-4 mx-auto max-w-screen-xl text-center py-32">
        <h1 className="mb-6 text-5xl font-extrabold tracking-tight leading-none text-white md:text-5xl lg:text-6xl">
          올인원 소개팅
        </h1>
        <p className="mb-6 text-lg font-normal text-gray-300">
          간단하게 흥미로운 질문에 답하고,
          <br />
          이성의 생각과 라이프스타일을
          <br />
          디테일하게 확인할 수 있습니다.
        </p>

      
        <div className="flex flex-col justify-center sm:flex-row sm:space-y-0 w-full">
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
      </div>
    </section>
  );
};

export default index;
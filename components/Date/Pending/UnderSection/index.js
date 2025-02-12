import { useRouter } from 'next/router';
import React, { useCallback } from 'react';

const index = () => {

  const router = useRouter();

  const goProfile = useCallback(() => {
    router.push("/date/profile")
  }, [router])

  return (
    <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')] py-6">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight leading-none text-gray-900 md:text-3xl dark:text-white">승인 대기중입니다.</h1>
        <p className="mb-8 text-lg font-normal text-gray-500 px-3 dark:text-gray-200">프로필을 검토 후,<br/> 12시간내 승인이 진행됩니다.</p>
        <form className="w-full max-w-md mx-auto">
          <div className="mb-2 text-sm font-medium text-gray-900 dark:text-white">조금만 기다리시면 승인문자가 발송됩니다.</div>
          <div className="flex w-full items-center justify-center">
            {/* <button
              type="button"
              onClick={goProfile}
              className="text-white end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
              프로필 수정하기</button> */}
          </div>
        </form>
      </div>
      <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full top-0 left-0 z-0"></div>
    </section>
  );
};

export default index;
import Image from "next/image";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import React, { useCallback } from "react";

const TopDescription = () => {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  const onClickStart = useCallback(() => {
    if (
      user?.date_profile_finished &&
      !user?.date_pending &&
      !user?.date_sleep &&
      !user?.withdraw
    ) {
      router.push("/date/cards");
    } else {
      router.push("/date/profile");
    }
  }, [router, user]);

  return (
    <section className="flex flex-col items-center justify-center text-center px-4 py-10 bg-gradient-to-b from-white to-blue-50 rounded-xl shadow-sm">
      {/* 제목 및 설명 */}
      <h2 className="text-3xl font-extrabold leading-snug text-gray-900 mb-4">
        피그말리온 <br />
        <span className="text-blue-600">올인원 소개팅</span>
      </h2>

      <p className="text-gray-600 text-base mb-6">
        간단하게 흥미로운 질문에 답하고,
        <br />
        이성의 생각과 라이프스타일을
        <br />
        디테일하게 확인할 수 있습니다.
      </p>

      {/* CTA 버튼 */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
        <button
          onClick={onClickStart}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold shadow-md transition"
        >
          지금 시작하기
        </button>
        {/* <button
          onClick={() => router.push("/about")}
          className="w-full sm:w-auto px-6 py-3 border border-blue-600 text-blue-600 rounded-full font-semibold hover:bg-blue-50 transition"
        >
          서비스 소개 보기
        </button> */}
      </div>

      {/* 강조 포인트 */}
      <div className="flex justify-center gap-5 text-sm text-gray-600 mt-6">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 text-lg">✓</span>
          <span>여성 안심 검증</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-yellow-500 text-lg">★</span>
          <span>1회 매칭 보장</span>
        </div>
      </div>

      {/* 일러스트 이미지 */}
      <div className="mt-8">
        <Image
          src="/image/date_home_topsection.png" // 방금 만든 일러스트
          alt="소개팅 일러스트"
          width={360}
          height={260}
          className="rounded-xl drop-shadow-xl mx-auto"
          priority
          unoptimized
        />
      </div>
    </section>
  );
};

export default TopDescription;



// import Image from 'next/image';
// import Link from 'next/link';
// import { useRouter } from 'next/router';
// import React, { useCallback } from 'react';
// import { useSelector } from 'react-redux';

// const index = () => {
//   const router = useRouter();
//   const { user } = useSelector(state => state.user);
//   const onClickStart = useCallback(() => {
//     if (user?.date_profile_finished == true && !user?.date_pending && !user?.date_sleep && !user?.withdraw) {
//       router.push("/date/cards")
//     }
//     else {
//       router.push("/date/profile")
//     }
//   }, [router, user?.date_profile_finished, user?.date_pending, user?.date_sleep, user?.withdraw])

//   return (
//     <section className="bg-center bg-no-repeat bg-[url('/image/date_home_topsection.jpg')] bg-gray-500 bg-blend-multiply">
//       <div className="px-4 mx-auto max-w-screen-xl text-center py-32">
//         <h1 className="mb-6 text-5xl font-extrabold tracking-tight leading-none text-white md:text-5xl lg:text-6xl">
//           올인원 소개팅
//         </h1>
//         <p className="mb-6 text-lg font-normal text-gray-300">
//           간단하게 흥미로운 질문에 답하고,
//           <br />
//           이성의 생각과 라이프스타일을
//           <br />
//           디테일하게 확인할 수 있습니다.
//         </p>


//         <div className="flex flex-col justify-center sm:flex-row sm:space-y-0 w-full">
//           <button
//             onClick={onClickStart}
//             className="w-[50%] mx-auto inline-flex justify-center items-center py-4 text-base font-medium text-center text-white rounded-lg bg-blue-500 hover:bg-opacity-70 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900">
//             시작하기
//             <svg className="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
//               <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
//             </svg>
//           </button>
//           {/* <a href="#" className="inline-flex justify-center hover:text-gray-900 items-center py-3 px-5 sm:ms-4 text-base font-medium text-center text-white rounded-lg border border-white hover:bg-gray-100 focus:ring-4 focus:ring-gray-400">
//             더 알아보기
//           </a> */}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default index;
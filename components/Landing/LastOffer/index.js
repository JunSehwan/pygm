import { useRouter } from 'next/router';
import React, { useCallback } from 'react';

export default function LastOffer() {

    const router = useRouter();
    const goSignup = useCallback(() => {
      router.push("/signup")
    }, [router])

  return (
    <section className="bg-gradient-to-r from-pink-600 to-red-500 text-white py-20 text-center">
      <h2 className="text-3xl font-bold mb-4" data-aos="zoom-in">
        매주 3명, <br/> 당신의 인연을 만나보세요.
      </h2>
      <p className="text-lg mb-8" data-aos="fade-up" data-aos-delay="100">
        올인원 소개팅, 지금 바로 신청하세요!
      </p>
      <button
        onClick={goSignup}
        className="inline-block bg-white text-pink-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 transition"
        data-aos="zoom-in"
        data-aos-delay="200"
      >
        지금 시작하기
      </button>
    </section>
  );
}

// import Image from 'next/image';
// import Link from 'next/link';
// import React from 'react';
// // import hero from '/public/image/landing_hero.png';
// import Last from '/public/image/landing_last.png';
// import Last_2 from '/public/image/landing_last_2.png';
// import Last_3 from '/public/image/landing_last_3.png';
// import styled from 'styled-components';
// import { useRouter } from 'next/router';
// import { useCallback } from 'react';

// const Neon = styled.div`
//   color: #fff;
//   text-shadow:
//       0 0 3px #fff,
//       0 0 5px #fff,
//       0 0 8px #fff,
//       0 0 14px #ffe880,
//       0 0 22px #ffe880;
// `

// const index = () => {
//   const router = useRouter();
//   const goSignup = useCallback(() => {
//     router.push("/signup")
//   }, [router])
//   const goLogin = useCallback(() => {
//     router.push("/login")
//   }, [router])

//   return (
//     <section className="relative bg-black">
//       <div className="mx-auto">
//         {/* Last content */}
//         <div className="pb-3 pt-24 md:pb-4 md:pt-28">
//           {/* Section header */}
//           <div
//             data-aos="zoom-y-out"
//             data-aos-delay={300}
//             className="pb-2 text-center md:pb-3 px-4">
//             <p className='text-xl md:text-3xl text-white'>
//               외모와 능력, 가치관까지 All in One 소개팅
//             </p>
//             <h1
//               className="italic mb-6 border-y text-4xl text-white font-bold [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]"
//               data-aos="zoom-y-out"
//               data-aos-delay={150}
//             >
//               <Neon>All in One 소개팅</Neon>
//             </h1>
//             <div className="mx-auto max-w-3xl">
//               <p
//                 className="mb-8 text-md text-gray-500 md:text-lg"
//                 data-aos="zoom-y-out"
//                 data-aos-delay={300}
//               >
//                 단 한번을 만나더라도 <br />
//                 의미있는 만남을 가져보세요!
//               </p>

//             </div>
//           </div>
//           {/* Last image */}
//           <div
//             className="mx-auto max-w-3xl"
//             data-aos="zoom-y-out"
//             data-aos-delay={600}
//           >
//             <div className="relative">

//               <div className='w-full pt-3 pb-4 md:pb-12'>
//                 <div className='flex flex-row justify-center gap-3'
//                   data-aos="zoom-y-out"
//                   data-aos-delay={300}
//                 >
//                   <button
//                     className='px-5 py-2 bg-transparent border-solid border-[1px] border-white text-white rounded-lg text-lg hover:bg-gray-300 hover:text-black'
//                     onClick={goLogin}
//                   >
//                     로그인
//                   </button>
//                   <button
//                     className='px-5 py-2 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-800'
//                     onClick={goSignup}
//                   >
//                     바로 시작하기
//                   </button>
//                 </div>
//               </div>

//               <div className="relative mb-8 flex w-full items-center justify-center">
//                 {/* <Image
//                   src={Last}
//                   className='rounded-lg shadow-lg mt-[-22px]'
//                   width={0}
//                   height={0}
//                   sizes="80vw"
//                   style={{ width: '50%', height: 'auto' }}
//                   alt="hero"
//                   priority
//                   unoptimized
//                 /> */}
//                 <div className="grid gap-4">
//                   {/* <div className='w-full flex items-center justify-center'>
//                     <Image
//                       className="h-auto max-w-[320px] rounded-lg"
//                       priority
//                       unoptimized
//                       src={Last}
//                       alt="service_picture" />
//                   </div> */}
//                   <div
//                     className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2 md:px-6"
//                     data-aos="zoom-y-out"
//                     data-aos-delay={300}
//                   >
//                     <div>
//                       <Image
//                         className="h-auto max-w-full rounded-lg"
//                         priority
//                         unoptimized
//                         src={Last}
//                         alt="service_picture" />
//                     </div>
//                     <div>
//                       <Image
//                         className="h-auto max-w-full rounded-lg"
//                         priority
//                         unoptimized
//                         src={Last_2}
//                         alt="service_picture" />
//                     </div>
//                     <div>
//                       <Image
//                         className="h-auto max-w-full rounded-lg"
//                         priority
//                         unoptimized
//                         src={Last_3}
//                         alt="service_picture" />
//                     </div>
//                   </div>
//                 </div>

//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//     </section>
//   );
// };

// export default index;
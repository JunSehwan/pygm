// components/DatingIntro.js
import React from 'react';

const DatingIntro = () => {
  return (
    <section className="bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-bold text-slate-900">무제한 소개</h3>
            <p className="mt-2 text-sm text-slate-500">여러 이성을 무제한으로 소개받을 수 있습니다. <br />마음에 드는 사람에게는 윙크보내기!</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-bold text-slate-900">성향·가치관 확인</h3>
            <p className="mt-2 text-sm text-slate-500">MBTI, 라이프스타일, 경력 등으로 디테일한 매칭<br/>내 가치관이 이성에게는 몇 점인지 확인할 수 있어요!</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow">
            <h3 className="text-lg font-bold text-slate-900">안심 검증</h3>
            <p className="mt-2 text-sm text-slate-500">재직/신분 검증 절차로 안전한 만남을 제공합니다.<br/>꼼꼼한 확인 후, 프로필 승인!</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DatingIntro;


// import React, { useCallback } from 'react';
// import Cards from '/public/image/datecards.png';
// import Image from 'next/image';
// import { useRouter } from 'next/router';

// const index = () => {
//   const router = useRouter();
//   const goSignup = useCallback(() => {
//     router.push("/signup")
//   }, [router])
//   const goLogin = useCallback(() => {
//     router.push("/login")
//   }, [router])



//   return (
//     <section className='bg-[#161617] w-full relative'>
//       <div className='mx-auto'>
//         <div className="py-2 md:py-4 w-full mx-auto flex items-center justify-center">
//           <div className="py-6 md:py-10 max-w-[860px] w-full mx-6 rounded-lg text-center px-3 md:px-8 ">
//             <div className='flex flex-col md:flex-row justify-between items-center'>
//               <div className='flex flex-col items-center text-left'>
//                 <div
//                   className="mb-6"
//                   data-aos="zoom-y-out"
//                 >
//                   <p className='text-white font-bold text-2xl md:text-4xl w-full'>
//                     피그말리온 올인원 소개팅!
//                   </p>
//                 </div>
//                 <div className="w-full">
//                   <p
//                     className="text-md text-gray-500 md:text-lg pb-6 md:pb-0"
//                     data-aos="zoom-y-out"
//                     data-aos-delay={300}
//                   >
//                     간단하게 흥미로운 질문에 답하고,<br />
//                     이성의 생각과 라이프스타일을<br />
//                     디테일하게 확인할 수 있습니다.
//                   </p>
//                 </div>
//               </div>
//               <div className="relative flex items-center justify-center
//             w-[240px] h-[240px] overflow-hidden rounded-lg 
//             "
//                 data-aos="zoom-y-out"
//                 data-aos-delay={300}
//               >
//                 <Image
//                   src={Cards}
//                   className='rounded-lg'
//                   width={320}
//                   height={320}
//                   // sizes="30vw"
//                   // style={{ width: '50%', height: 'auto' }}
//                   alt="hero"
//                   priority
//                   unoptimized
//                 />
//               </div>
//             </div>
//             <div
//               data-aos="zoom-y-out"
//               data-aos-delay={300}
//               className='w-full mt-4 border-solid border-t-[2px] border-white/50 '></div>
//             <div className='w-full pt-6'>
//               <div className='flex flex-row justify-center gap-3'
//                 data-aos="zoom-y-out"
//                 data-aos-delay={300}
//               >
//                 <button
//                   className='px-5 py-2 bg-transparent border-solid border-[1px] border-white text-white rounded-lg text-lg hover:bg-gray-300 hover:text-black'
//                   onClick={goLogin}
//                 >
//                   로그인
//                 </button>
//                 <button
//                   className='px-5 py-2 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-800'
//                   onClick={goSignup}
//                 >
//                   바로 시작하기
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default index;



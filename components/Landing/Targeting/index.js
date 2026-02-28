import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
// import hero from '/public/image/landing_hero.png';
import Hero from '/public/image/landing.png';
import styled from 'styled-components';
import { IoLocation } from "react-icons/io5";
import { MdCalendarMonth } from "react-icons/md";
import { MdRecommend } from "react-icons/md";

export default function Targeting() {
  const targets = [
    "외모보다 가치관이 중요한 분",
    "첫인상으로 끌리는 연애를 원하시는 분",
    "매주 꾸준히 이성을 만나고 싶은 분",
    "자연스러운 대화 중심 만남을 원하는 분",
  ];

  return (
    <section className="bg-slate-50 py-10 text-slate-700 text-center px-2">
      <h2 className="text-3xl font-bold mb-10" data-aos="fade-up">
        이런 분께 추천합니다
      </h2>
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-1 gap-3">
        {targets.map((t, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-xl p-6 hover:bg-gray-300 transition"
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            {t}
          </div>
        ))}
      </div>

      <div className='w-full py-4 md:py-8'>
        <div className="grid grid-cols-1 gap-2 lg:gap-3 lg:grid-cols-3">
          <div
            className="justify-center text-slate-700 border border-solid border-slate-300 rounded-lg p-3">
            <div
              className="flex justify-center lg:justify-start text-slate-700">
              <IoLocation
                className='text-slate-300 w-10 h-10'

              />
            </div>
            <h2 className="text-2xl text-primary-dark-blue py-4 lg:text-2xl lg:font-bold">
              거주지
            </h2>
            <p className="text-neutral-grayish-blue text-sm font-light text-slate-500 lg:text-base leading-5">
              서울/경기/인천 등 수도권 거주자 추천
              {/* <br />(지방에 거주중인 분들도 가입은 가능하지만 소개는 조금 늦어질 수 있습니다) */}
            </p>
          </div>
          <div
            className="justify-center text-slate-700 border border-solid border-slate-300 rounded-lg p-3">
            <div
              className="flex justify-center lg:justify-start text-slate-700">
              <MdCalendarMonth
                className='text-slate-300 w-10 h-10'

              />
            </div>
            <h2 className="text-2xl text-primary-dark-blue py-4 lg:text-2xl lg:font-bold">
              추천 연령대
            </h2>
            <p className="text-neutral-grayish-blue text-sm font-light text-slate-500 lg:text-base leading-5">
              20대 후반, 30대까지 연령대를 추천드립니다.<br />(40대 초까지 가능)
            </p>
          </div>
          <div
            className="justify-center text-slate-700 border border-solid border-slate-300 rounded-lg p-3">
            <div
              className="flex justify-center lg:justify-start text-slate-700">
              <MdRecommend
                className='text-slate-300 w-10 h-10'

              />
            </div>
            <h2 className="text-2xl text-primary-dark-blue py-4 lg:text-2xl lg:font-bold">
              성향
            </h2>
            <p className="text-neutral-grayish-blue text-sm font-light text-slate-500 lg:text-base leading-5">
              시간/에너지 낭비를 싫어하고, <br />신중한 만남을 원하신다면 <br />피그말리온 올인원 소개팅을 이용해보세요!
            </p>
          </div>
        </div>
      </div>
      
    </section>
  );
}

// import Image from 'next/image';
// import Link from 'next/link';
// import React from 'react';
// // import hero from '/public/image/landing_hero.png';
// import Hero from '/public/image/landing.png';
// import styled from 'styled-components';
// import { IoLocation } from "react-icons/io5";
// import { MdCalendarMonth } from "react-icons/md";
// import { MdRecommend } from "react-icons/md";

// const Neon = styled.div`
//   color: #fff;
//   text-shadow:
//       0 0 3px #fff,
//       0 0 5px #fff,
//       0 0 8px #fff,
//       0 0 14px #ffe880,
//       0 0 22px #ffe880,
//       0 0 24px #8951ff,
//       0 0 35px #8951ff,
//       0 0 42px #8951ff;

// `

// const index = () => {
//   return (
//     <section className="relative bg-[#161617]">
//       <div className="mx-auto">
//         {/* Hero content */}
//         <div className="pb-6 pt-24 md:pb-8 md:pt-28 mx-auto px-4 max-w-[1080px]">

//           <div className="container text-center lg:text-left">
//             <h2 className="text-3xl lg:text-4xl text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-300/50 font-bold w-full pb-5">
//               어떤 분들이 가입하면 좋을까요?
//             </h2>
//             <p className="text-neutral-grayish-blue text-sm lg:text-base leading-5 text-white">
//               현재 화려한 싱글로 살아가고 계신 다양한 남녀분들 환영합니다! <br />직장인, 프리랜서, 전문직, 대학원생, 자영업자, 스타트업 분들 <br />모두가 새로운 인연을 찾아보세요!
//             </p>
//             <div className='w-full py-4 md:py-8'>
//               <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
//                 <div
//                   className="justify-center text-white border border-solid border-white rounded-lg p-3">
//                   <div
//                     className="flex justify-center lg:justify-start text-white">
//                     <IoLocation
//                       className='text-gray-200 w-10 h-10'

//                     />
//                   </div>
//                   <h2 className="text-2xl text-primary-dark-blue py-4 lg:text-2xl lg:font-bold">
//                     거주지
//                   </h2>
//                   <p className="text-neutral-grayish-blue text-sm font-light text-gray-400 lg:text-base leading-5">
//                     서울/경기/인천 등 수도권 거주자 추천<br />(지방에 거주중인 분들도 가입은 가능하지만 소개는 조금 늦어질 수 있습니다)
//                   </p>
//                 </div>
//                 <div
//                   className="justify-center text-white border border-solid border-white rounded-lg p-3">
//                   <div
//                     className="flex justify-center lg:justify-start text-white">
//                     <MdCalendarMonth
//                       className='text-gray-200 w-10 h-10'

//                     />
//                   </div>
//                   <h2 className="text-2xl text-primary-dark-blue py-4 lg:text-2xl lg:font-bold">
//                     추천 연령대
//                   </h2>
//                   <p className="text-neutral-grayish-blue text-sm font-light text-gray-400 lg:text-base leading-5">
//                     20대 후반, 30대까지 연령대를 추천드립니다.<br />(40대 초까지 가능)
//                   </p>
//                 </div>
//                 <div
//                   className="justify-center text-white border border-solid border-white rounded-lg p-3">
//                   <div
//                     className="flex justify-center lg:justify-start text-white">
//                     <MdRecommend
//                       className='text-gray-200 w-10 h-10'

//                     />
//                   </div>
//                   <h2 className="text-2xl text-primary-dark-blue py-4 lg:text-2xl lg:font-bold">
//                     성향
//                   </h2>
//                   <p className="text-neutral-grayish-blue text-sm font-light text-gray-400 lg:text-base leading-5">
//                     시간/에너지 낭비를 싫어하고, <br />신중한 만남을 원하신다면 <br />피그말리온 올인원 소개팅을 이용해보세요!
//                   </p>
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



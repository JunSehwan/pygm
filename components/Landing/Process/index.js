import React from 'react';

export default function Process() {
  const steps = [
    { step: 1, title: "가입 & 프로필 작성", desc: "자신의 가치관과 취향을 등록합니다." },
    { step: 2, title: "매주 3명 소개", desc: "정교한 매칭을 통해 매주 3명의 이성을 추천받습니다." },
    { step: 3, title: "윙크보내기", desc: "호감가는 이성을 찾았다면 윙크를 보내보세요!" },
    { step: 4, title: "매칭 & 대화", desc: "서로 선택 시 연락처가 교환되고, 인연이 시작됩니다." },
  ];

  return (
    <section className="bg-white text-gray-600 py-20">
      <h2 className="text-3xl font-bold text-center mb-12" data-aos="fade-up">
        올인원 소개팅 절차
      </h2>
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
        {steps.map((s, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center"
            data-aos="fade-up"
            data-aos-delay={i * 100}
          >
            <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white w-14 h-14 flex items-center justify-center rounded-full mb-4 text-xl font-bold">
              {s.step}
            </div>
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-gray-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


// import Image from 'next/image';
// import Link from 'next/link';
// import React from 'react';

// import { FaPenNib } from "react-icons/fa";
// import { FaHandshake } from "react-icons/fa";
// import { FaKissWinkHeart } from "react-icons/fa";
// import { FaAddressCard } from "react-icons/fa6";


// const index = () => {
//   return (
//     <section className="relative bg-[#161617]">
//       <div className="mx-auto max-w-[1200px] px-8 md:px-12">
//         {/* Hero content */}
//         <div className="pb-6 pt-8 md:pb-8 md:pt-12">
//           <ol data-aos="fade-right" className="relative border-dashed border-l-[1px] border-gray-200">
//             <li 
//             className="mb-10 ms-8"
//             // data-aos="fade-right"
//             >
//               <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
//                 <FaPenNib
//                   className='w-5 h-5 text-blue-800'>
//                 </FaPenNib>
//               </span>
//               <h3 className="flex items-center mb-1 text-lg font-semibold text-white">
//                 <span className="text-yellow-400">STEP 1</span> &nbsp;&nbsp;프로필 작성하기
//                 <span className="bg-blue-200 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm ms-3">3분완성</span>
//               </h3>
//               <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
//                 연애관련 재밌는 질문들에 응답하면서 프로필을 작성해주세요.
//               </time>
//               <p className="mb-4 text-xs text-purple-300 font-normal">
//                 (Spec, MBTI, 연애/결혼관 등)
//               </p>
//             </li>
//             <li 
//             className="mb-10 ms-8"
//             // data-aos="fade-right"
//             >
//               <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
//                 <FaHandshake
//                   className='w-5 h-5 text-blue-800'>
//                 </FaHandshake>
//               </span>
//               <h3 className="mb-1 text-lg font-semibold text-white">
//                 <span className="text-yellow-400">STEP 2</span> &nbsp;이성 소개받기
//               </h3>
//               <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
//                 매주 새로운 이성을 소개받을 수 있습니다. 나와 잘 맞는 이성을 찾아보세요.
//               </time>
//               <p className="text-xs text-purple-300 font-normal">
//                 (상대방의 외모와 가치관, 성향과 경력까지 한 눈에!)
//               </p>
//             </li>
//             <li 
//             className="mb-10 ms-8"
//             // data-aos="fade-right"
//             >
//               <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
//                 <FaKissWinkHeart
//                   className='w-5 h-5 text-blue-800'>
//                 </FaKissWinkHeart>
//               </span>
//               <h3 className="mb-1 text-lg font-semibold text-white">
//                 <span className="text-yellow-400">STEP 3</span> &nbsp;윙크 보내기
//               </h3>
//               <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
//                 호감가는 이성을 찾았다면 윙크를 보내보세요!
//               </time>
//               <p className="text-xs text-purple-300 font-normal">
//                 상대방이 윙크를 받고 마찬가지로 윙크를 보낸다면 매칭은 성사됩니다.
//               </p>
//             </li>
//             <li 
//             className="ms-8"
//             // data-aos="fade-right"
//             >
//               <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
//                 <FaAddressCard
//                   className='w-5 h-5 text-blue-800'>
//                 </FaAddressCard>
//               </span>
//               <h3 className="mb-1 text-lg font-semibold text-white">
//                 <span className="text-yellow-400">STEP 4</span> &nbsp;매칭 후 연락처 공유
//               </h3>
//               <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
//                 매칭이 되면 연락처가 공유됩니다.
//               </time>
//               <p className="text-xs text-purple-300 font-normal">
//                 이성과의 즐거운 만남을 가져보세요!
//               </p>
//             </li>
//           </ol>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default index;
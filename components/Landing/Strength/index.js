// import React from 'react';

// export default function Strength() {
//   const strengths = [
//     { title: "가치관 매칭", desc: "나와 맞는 연애 가치관을 가진 사람과 매칭" },
//     { title: "성향 분석", desc: "MBTI와 대화 성향을 반영한 최적의 조합" },
//     { title: "외모 선택", desc: "첫인상으로 판단하는 ‘눈픽 게임’" },
//     { title: "능력형 매칭", desc: "전문직/능력 중심 남성 프로필 확인" },
//   ];

//   return (
//     <section className="bg-gray-900 py-20 text-white text-center">
//       <h2 className="text-3xl font-bold mb-10" data-aos="fade-up">올인원 매칭 시스템</h2>
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
//         {strengths.map((s, i) => (
//           <div
//             key={i}
//             className="bg-gray-800 rounded-2xl p-6 hover:bg-gray-700 transition"
//             data-aos="fade-up"
//             data-aos-delay={i * 100}
//           >
//             <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
//             <p className="text-gray-300">{s.desc}</p>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }


import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
// import hero from '/public/image/landing_hero.png';
import { IoIosInfinite } from "react-icons/io";
import { RiMapPinUserFill } from "react-icons/ri";
import { AiFillSafetyCertificate } from "react-icons/ai";
import { FaCoins } from "react-icons/fa";
import { FaRegFaceGrimace } from "react-icons/fa6";
import { FaSadCry } from "react-icons/fa";


const index = () => {
  return (
    <section className="relative bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-16 text-center md:pb-20">
            <h2 className="text-3xl font-bold text-gray-700 md:text-4xl">
              왜 올인원 소개팅인가?
            </h2>
          </div>
          {/* Grid */}
          <div className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3 *:relative *:p-6 *:before:absolute *:before:bg-gray-300 *:before:[block-size:100vh] *:before:[inline-size:1px] *:before:[inset-block-start:0] *:before:[inset-inline-start:-1px] *:after:absolute *:after:bg-gray-300 *:after:[block-size:1px] *:after:[inline-size:100vw] *:after:[inset-block-start:-1px] *:after:[inset-inline-start:0] md:*:p-10">
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-600">
                <IoIosInfinite
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span className='font-semibold text-lg text-blue-500'>무제한 이성소개</span>
              </h3>
              <p className="text-[15px] text-slate-500">
                영혼의 단짝을 만나기 전까지 이성은 무료로 무제한 소개해드립니다.
                다양한 이성의 프로필을 확인하고 호감가는 이성에게 호감표시로 '윙크'를 보내보세요.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-600">
                <RiMapPinUserFill
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span className='font-semibold text-lg text-blue-500'>외모, 경력, 가치관까지!</span>
              </h3>
              <p className="text-[15px] text-slate-500">
                경력과 가치관을 입력하여 나와 맞는 인연을 좀 더 디테일하게 살펴볼 수 있습니다.
                또한, 나의 성향과 가치관이 어울리다고 생각하는 이성이 어느정도인지,
                내 가치관 평가점수는 어느정도인지 확인해 볼 수 있습니다.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-600">
                <AiFillSafetyCertificate
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span className='font-semibold text-lg text-blue-500'>철저한 신원검증!</span>
              </h3>
              <p className="text-[15px] text-slate-500">
                특히 여성분들은 안심하세요! 프로필등록 후, 피그말리온의 검증단계를 거쳐야 가입이 완료됩니다.
                검증 단계에서 명함이나 재직을 증명할 수 있는 서류를 직접 한 분씩 검토합니다.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-600">
                <FaCoins
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span className='font-semibold text-lg text-blue-500'>저렴하게!</span>
              </h3>
              <p className="text-[15px] text-slate-500">
                이성을 한 분 소개받으려면 타 서비스에서는 7만원에서 10만원까지 값비싼 비용을 감당해야 합니다.
                피그말리온 소개팅에서는 나와 맞는 인연을 부담없이 만나보실 수 있습니다!
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-600">
                <FaRegFaceGrimace
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span className='font-semibold text-lg text-blue-500'>민감한 질문까지!</span>
              </h3>
              <p className="text-[15px] text-slate-500">
                타투, 종교 등 조금은 민감한 질문에 대한 답변까지도 피그말리온 소개팅에서는 먼저 확인해 볼 수 있습니다.
                헛되이 소개팅을 나갔다가 가치관이 안 맞아서 낭패를 보는 시간낭비를 줄일 수 있습니다.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-600">
                <FaSadCry
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span className='font-semibold text-lg text-blue-500'>긴 솔로생활을 경험한 운영자입니다.</span>
              </h3>
              <p className="text-[15px] text-slate-500">
                긴 솔로경험, 그리고 미팅, 소개팅 등 수없이 경험해본 운영자가 이성을 좀 더 자연스럽고 효과적으로 만나기 위해 도와드립니다.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section >
  );
};

export default index;
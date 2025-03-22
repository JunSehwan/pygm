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
    <section className="relative bg-black">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-16 text-center md:pb-20">
            <h2 className="text-3xl font-bold text-gray-200 md:text-4xl">
              왜 올인원 소개팅인가?
            </h2>
          </div>
          {/* Grid */}
          <div className="grid overflow-hidden sm:grid-cols-2 lg:grid-cols-3 *:relative *:p-6 *:before:absolute *:before:bg-gray-800 *:before:[block-size:100vh] *:before:[inline-size:1px] *:before:[inset-block-start:0] *:before:[inset-inline-start:-1px] *:after:absolute *:after:bg-gray-800 *:after:[block-size:1px] *:after:[inline-size:100vw] *:after:[inset-block-start:-1px] *:after:[inset-inline-start:0] md:*:p-10">
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <IoIosInfinite
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span>무제한 이성 무료소개</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                영혼의 단짝을 만나기 전까지 이성은 무제한으로 소개해드립니다.
                다양한 이성의 프로필을 확인하고 호감가는 이성에게 호감표시로 '윙크'를 보내보세요.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <RiMapPinUserFill
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span>외모와 경력, 가치관을 동시에!</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                경력과 가치관을 입력하여 나와 맞는 인연을 좀 더 디테일하게 살펴볼 수 있습니다.
                또한, 나의 성향과 가치관이 어울리다고 생각하는 이성이 어느정도인지,
                내 가치관 평가점수는 어느정도인지 확인해 볼 수 있습니다.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <AiFillSafetyCertificate
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span>철저한 신원검증!</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                특히 여성분들은 안심하세요! 프로필등록 후, 피그말리온의 검증단계를 거쳐야 가입이 완료됩니다.
                검증 단계에서 명함이나 재직을 증명할 수 있는 서류를 직접 한 분씩 검토합니다.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <FaCoins
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span>타 서비스보다 저렴하게!</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                이성을 한 분 소개받으려면 타 서비스에서는 7만원에서 10만원까지 값비싼 비용을 감당해야 합니다.
                피그말리온 소개팅에서는 나와 맞는 인연을 부담없이 만나보실 수 있습니다!
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <FaRegFaceGrimace
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span>직접 물어보기 민감한 질문까지!</span>
              </h3>
              <p className="text-[15px] text-gray-400">
                타투, 종교 등 조금은 민감한 질문에 대한 답변까지도 피그말리온 소개팅에서는 먼저 확인해 볼 수 있습니다.
                헛되이 소개팅을 나갔다가 가치관이 안 맞아서 낭패를 보는 시간낭비를 줄일 수 있습니다.
              </p>
            </article>
            <article
              data-aos="zoom-y-out"
              data-aos-delay={300}>
              <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                <FaSadCry
                  className="fill-blue-500"
                  height={16}
                  width={16}
                />
                <span>긴 솔로생활을 경험한 운영자입니다.</span>
              </h3>
              <p className="text-[15px] text-gray-400">
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
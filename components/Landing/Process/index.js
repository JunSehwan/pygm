import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { FaPenNib } from "react-icons/fa";
import { FaHandshake } from "react-icons/fa";
import { FaKissWinkHeart } from "react-icons/fa";
import { FaAddressCard } from "react-icons/fa6";


const index = () => {
  return (
    <section className="relative bg-[#161617]">
      <div className="mx-auto max-w-[1200px] px-8 md:px-12">
        {/* Hero content */}
        <div className="pb-6 pt-8 md:pb-8 md:pt-12">
          <ol data-aos="fade-right" className="relative border-dashed border-l-[1px] border-gray-200">
            <li 
            className="mb-10 ms-8"
            // data-aos="fade-right"
            >
              <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                <FaPenNib
                  className='w-5 h-5 text-blue-800'>
                </FaPenNib>
              </span>
              <h3 className="flex items-center mb-1 text-lg font-semibold text-white">
                <span className="text-yellow-400">STEP 1</span> &nbsp;&nbsp;프로필 작성하기
                <span className="bg-blue-200 text-blue-800 text-sm font-medium me-2 px-2.5 py-0.5 rounded-sm ms-3">3분완성</span>
              </h3>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                연애관련 재밌는 질문들에 응답하면서 프로필을 작성해주세요.
              </time>
              <p className="mb-4 text-xs text-purple-300 font-normal">
                (Spec, MBTI, 연애/결혼관 등)
              </p>
            </li>
            <li 
            className="mb-10 ms-8"
            // data-aos="fade-right"
            >
              <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                <FaHandshake
                  className='w-5 h-5 text-blue-800'>
                </FaHandshake>
              </span>
              <h3 className="mb-1 text-lg font-semibold text-white">
                <span className="text-yellow-400">STEP 2</span> &nbsp;이성 소개받기
              </h3>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                매주 새로운 이성을 소개받을 수 있습니다. 나와 잘 맞는 이성을 찾아보세요.
              </time>
              <p className="text-xs text-purple-300 font-normal">
                (상대방의 외모와 가치관, 성향과 경력까지 한 눈에!)
              </p>
            </li>
            <li 
            className="mb-10 ms-8"
            // data-aos="fade-right"
            >
              <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                <FaKissWinkHeart
                  className='w-5 h-5 text-blue-800'>
                </FaKissWinkHeart>
              </span>
              <h3 className="mb-1 text-lg font-semibold text-white">
                <span className="text-yellow-400">STEP 3</span> &nbsp;윙크 보내기
              </h3>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                호감가는 이성을 찾았다면 윙크를 보내보세요!
              </time>
              <p className="text-xs text-purple-300 font-normal">
                상대방이 윙크를 받고 마찬가지로 윙크를 보낸다면 매칭은 성사됩니다.
              </p>
            </li>
            <li 
            className="ms-8"
            // data-aos="fade-right"
            >
              <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -start-3 ring-8 ring-white">
                <FaAddressCard
                  className='w-5 h-5 text-blue-800'>
                </FaAddressCard>
              </span>
              <h3 className="mb-1 text-lg font-semibold text-white">
                <span className="text-yellow-400">STEP 4</span> &nbsp;매칭 후 연락처 공유
              </h3>
              <time className="block mb-2 text-sm font-normal leading-none text-gray-400">
                매칭이 되면 연락처가 공유됩니다.
              </time>
              <p className="text-xs text-purple-300 font-normal">
                이성과의 즐거운 만남을 가져보세요!
              </p>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
};

export default index;
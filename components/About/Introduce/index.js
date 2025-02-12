/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { motion } from 'framer-motion';
import { BsFillCheckCircleFill } from 'react-icons/bs'

// const fields = ['2022년 예비창업패키지 선정', 'Love for clean code', 'Remote work aficionado', 'Amateur astronomer'];
const index = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.8 }}
      className="mt-24"
    >
      <div className="pt-8 md:pb-auto">
        <div className="py-4">
          <div className="container mx-auto max-w-[420px] px-2">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-center text-3xl text-blue-600 leading-10 font-extrabold">
                {/* 넥스트퍼스에서는 <br />인간과 인간사이에 <br />
                가장 자연스러우면서 <br />즐거운 만남을 제공 드리겠습니다. */}

                <p className='text-blue-500'>Human to Human !</p>
                <p className='text-blue-600'>The Most Natural !</p>
                <p className='text-blue-700'>The Most Exciting !</p>

              </h2>
              <div className='w-full border-solid border-0 border-b-[1px] border-gray-300 h-0 my-4'></div>
              <p className="text-gray-600 mx-auto text-lg leading-8">
                가장 효율적이고 현실적인 소개팅,<br />
                타지에서도 외롭지 않으며<br />
                항상 이웃과 더불어 살도록 돕는 반상회,<br />
                그외에도 다양한 서비스를 제공하고자 합니다.
              </p>
              <div className="mt-8">
                <div className="flex gap-4 items-center py-2 font-bold">
                  <BsFillCheckCircleFill className="w-5 h-5 text-slate-700" />
                  <p className="m-px text-slate-700">2024년 피그말리온 소개팅서비스 개시</p>
                </div>
                <div className="flex gap-4 items-center py-2 font-bold">
                  <BsFillCheckCircleFill className="w-5 h-5 text-slate-700" />
                  <p className="m-px text-slate-700">2025년 2월 웹서비스(pygm.co.kr) 오픈</p>
                </div>
              </div>

              <div className='w-full border-solid border-0 border-b-[1px] border-gray-300 h-0 my-4'></div>

              <div className='mt-5 mb-3 w-full text-gray-500 text-sm text-left'>
                <img className='w-12 size-12 text-xl h-12' src="/logo/pygm.png" alt="pygm_logo"></img>
                <p>넥스트퍼스(피그말리온)</p>
                <p>사업자 등록번호 : 755-55-00702</p>
                <p>대표|개인정보 관리 책임자 : 전세환</p>
                <p>서울특별시 광진구 광나루로17길 14-6, 101-2호(군자동)</p>
                <p>계좌 :하나은행 112-891138-99107 (예금주 : 전세환)</p>
              </div>
            </div>
            {/* <div className="justify-center items-center w-full">
              <div className="space-y-4 text-center">
                <img className="w-64 h-64 mx-auto object-cover rounded-xl md:w-40 md:h-40 lg:w-48 lg:h-48"
                  src="/image/cto.png" alt="woman" loading="lazy" width="420" height="605" />
                <div>
                  <h4 className="text-2xl">전세환</h4>
                  <span className="block text-sm text-gray-300">CEO-Founder</span>
                  <span className="block text-sm text-gray-300/70">건국대학교 경영학과 졸</span>
                  <span className="block text-sm text-gray-300/70">린나이코리아(주) 인사부(`14 ~ `19)</span>
                </div>
              </div>
            </div> */}

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default index;
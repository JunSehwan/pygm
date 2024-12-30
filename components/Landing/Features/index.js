import React from 'react';
import { BsFillFilePostFill } from 'react-icons/bs';
import { FaStreetView } from 'react-icons/fa';
import { FcAssistant, FcBusinessman } from 'react-icons/fc';
import { MdStarRate } from 'react-icons/md';
import { TbHandFinger } from 'react-icons/tb';

const index = () => {



  return (
    <section className="relative">

      {/* Section background (needs .relative class on parent and next sibling elements) */}
      <div className="absolute inset-0 top-1/2 md:mt-24 lg:mt-0 bg-gray-900 pointer-events-none" aria-hidden="true"></div>
      <div className="absolute left-0 right-0 bottom-0 m-auto w-px p-px h-20 bg-gray-200 transform translate-y-1/2"></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="py-12 md:py-20">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
            <h2 className="text-3xl font-extrabold leading-tight mb-4">이제, 간단하고 흥미롭게!</h2>
            <p className="text-xl text-gray-600">원하는 팀에 합류하기 위한 '준비단계'부터 도와드립니다. 어떤 스킬을 좀 더 학습해야 할 지 안내받을 수 있습니다.</p>
          </div>

          {/* Items */}
          <div className="max-w-sm mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start md:max-w-2xl lg:max-w-none">

            {/* 1st item */}
            <div className="relative flex flex-col items-center p-6 bg-white rounded shadow-xl" data-aos="zoom-in-right">
              <div className='rounded-full w-[54px] h-[54px] mb-2 -mt-1 bg-blue-600 flex items-center justify-center'>
                <FaStreetView className="w-9 h-9 p-1 text-white" />
              </div>
              <h4 className="text-xl font-bold leading-snug tracking-tight mb-1">눈에 띄는 인터페이스</h4>
              <p className="text-gray-600 text-center">포트폴리오, 자기소개 영상으로 내 능력을 표현할 수 있습니다.</p>
            </div>

            {/* 2nd item */}
            <div className="relative flex flex-col items-center p-6 bg-white rounded shadow-xl" data-aos="zoom-in-left">
              <div className='rounded-full w-[54px] h-[54px] mb-2 -mt-1 bg-blue-600 flex items-center justify-center'>
                <TbHandFinger className="w-9 h-9 p-1 text-white" />
              </div>
              <h4 className="text-xl font-bold leading-snug tracking-tight mb-1">콕!콕! 기능</h4>
              <p className="text-gray-600 text-center">지금 당장 채용하지 않아도 '예비 입사예정자'를 제안하여 장기적인 인재 확보가 가능합니다.</p>
            </div>

            {/* 3rd item */}
            <div className="relative flex flex-col items-center p-6 bg-white rounded shadow-xl" data-aos="zoom-in-right">
              <div className='rounded-full w-[54px] h-[54px] mb-2 -mt-1 bg-blue-600 flex items-center justify-center'>
                <MdStarRate className="w-9 h-9 p-1 text-white" />
              </div>
              <h4 className="text-xl font-bold leading-snug tracking-tight mb-1">스펙평가</h4>
              <p className="text-gray-600 text-center">내 능력수준을 평가받으면서 실제 제안받는 연봉수준을 확인할 수 있습니다.</p>
            </div>

            {/* 4th item */}
            <div className="relative flex flex-col items-center p-6 bg-white rounded shadow-xl" data-aos="zoom-in-left">
              <div className='rounded-full w-[54px] h-[54px] mb-2 -mt-1 bg-blue-600 flex items-center justify-center'>
                <BsFillFilePostFill className="w-9 h-9 p-1 text-white" />
              </div>
              <h4 className="text-xl font-bold leading-snug tracking-tight mb-1">팀의 소식</h4>
              <p className="text-gray-600 text-center">팀소식 포스팅을 통해 희망하는 팀에서의 일상을 느낄 수 있습니다.</p>
            </div>

            {/* 5th item */}
            <div className="relative flex flex-col items-center p-6 bg-white rounded shadow-xl" data-aos="zoom-in-right">
              <div className='rounded-full w-[54px] h-[54px] mb-2 -mt-1 bg-blue-600 flex items-center justify-center'>
                <FcBusinessman className="w-9 h-9 p-1 text-white" />
              </div>
              <h4 className="text-xl font-bold leading-snug tracking-tight mb-1">수시채용 맞춤형 서비스</h4>
              <p className="text-gray-600 text-center">수시채용을 진행하기 편리한 인터페이스로 구성하고 있습니다.</p>
            </div>

            {/* 6th item */}
            <div className="relative flex flex-col items-center p-6 bg-white rounded shadow-xl" data-aos="zoom-in-left">
              <div className='rounded-full w-[54px] h-[54px] mb-2 -mt-1 bg-blue-600 flex items-center justify-center'>
                <FcAssistant className="w-9 h-9 p-1 text-white" />
              </div>
              <h4 className="text-xl font-bold leading-snug tracking-tight mb-1">시각적 어필이 필요한 직무에 추천</h4>
              <p className="text-gray-600 text-center">서비스직, 디자인, 영상편집 등의 직군 채용에 JOBCOC을 활용해보세요!</p>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default index;
/* eslint-disable @next/next/no-img-element */
import React, { useState, useRef, useEffect } from 'react';
import Transition from 'components/Common/Transition';
import { ImProfile } from 'react-icons/im';
import { MdPersonSearch } from 'react-icons/md';
import { FaComment } from 'react-icons/fa';

function Features() {

  const [tab, setTab] = useState(1);
  useEffect(() => {
    setInterval(() => setTab(prev =>
      prev < 3 ? prev + 1 : 1), 4000);
  }, [])
  const tabs = useRef(null);

  const heightFix = () => {
    if (tabs.current.children[tab]) {
      tabs.current.style.height = tabs.current.children[tab - 1].offsetHeight + 'px'
    }
  }

  useEffect(() => {
    heightFix()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  return (
    <section className="relative md:h-auto h-[76rem]">

      {/* Section background (needs .relative class on parent and next sibling elements) */}
      <div className="absolute inset-0 bg-slate-100 pointer-events-none pb-16" aria-hidden="true"></div>
      <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-slate-200 transform -translate-y-1/2"></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 md:pt-20">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <h1 className="text-3xl font-extrabold leading-tight mb-4">
              <span className='text-blue-600'>무제한으로</span> 인연을 찾아보기
            </h1>
            <p className="text-xl text-gray-600">상대방의 외모와 능력뿐만 아니라 가치관까지 확인해보세요! </p>
          </div>

          {/* Section content */}
          {/* <div className="md:grid md:grid-cols-12 md:gap-6"> */}
          <div className="">

            {/* Content */}
            <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6" data-aos="fade-right">
              <div className="w-full mb-4">
                <h3 className="text-2xl w-full text-center font-bold leading-tight bg-gradient-to-r from-pink-400 via-red-500 to-pink-400 inline-block text-transparent bg-clip-text">
                  왜, 피그말리온 소개팅인가요?
                </h3>
                {/* <p className="text-xl text-gray-600">
                  <span className="text-red-500">잠깐!</span> 지금 구직의사가 없다고 하더라도, 콕콕 기능을 통해 좀 더 내 커리어 경력을 쌓은 후, 희망하는 팀에 합류할 수 있는 기회를 얻을 수 있습니다.
                </p> */}
              </div>


              {/* Tabs buttons */}
              <div className="mb-0" data-aos="zoom-in-up">
                <a
                  className={`flex items-center text-lg w-full p-5 rounded border transition duration-300 ease-in-out mb-3 ${tab !== 1 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`}
                  onClick={(e) => { e.preventDefault(); setTab(1); }}
                >
                  <div>
                    <div className="font-bold leading-snug text-lg mb-1">나와 이성의 경력과 가치관을 동시에!</div>
                    <div className="text-gray-600 text-md">경력과 가치관을 입력하여 나와 맞는 인연을 좀 더 디테일하게 살펴볼 수 있습니다. 
                      또한, 다른 참가자들에 비해 상대적으로 내 위치가 어느정도인지 확인해 볼 수 있습니다.</div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
                    <ImProfile className={`${tab === 1 && "fill-black"} w-4 h-4 fill-current`} />
                  </div>
                </a>
                <a
                  className={`flex items-center text-lg w-full p-5 rounded border transition duration-300 ease-in-out mb-3 ${tab !== 2 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`}
                  onClick={(e) => { e.preventDefault(); setTab(2); }}
                >
                  <div>
                    <div className="font-bold leading-snug text-lg mb-1">철저한 신원검증!</div>
                    <div className="text-gray-600 text-md ">프로필 정보등록 후, 검증단계를 거쳐야 가입이 완료됩니다.
                      검증 단계에서 명함이나 재직을 증명할 수 있는 서류를 직접 검토합니다.
                      {/* 인재를 채용할 뿐만 아니라 콕!콕! 기능을 통해 향후 TO가 날 경우 가장 빠르게 입사를 제안할 수 있습니다. */}
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
                    <MdPersonSearch className={`${tab === 2 && "fill-black"} w-4 h-4 fill-current`} />
                  </div>
                </a>
                <a
                  className={`flex items-center text-lg w-full p-5 rounded border transition duration-300 ease-in-out mb-3 ${tab !== 3 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`}
                  onClick={(e) => { e.preventDefault(); setTab(3); }}
                >
                  <div>
                    <div className="font-bold leading-snug text-lg mb-1">타 서비스보다 저렴하게!</div>
                    <div className="text-gray-600 text-md">
                      이성을 한 분 소개받으려면 최소 7만원에서 10만원까지 값비싼 비용을 감당해야 합니다.
                      피그말리온 소개팅에서는 나와 맞는 인연을 부담없이 만나보실 수 있습니다!
                      {/* JOBCOC은 수시로 인재를 채용하는 과정을 최소화하여 간편함을 드립니다. */}
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
                    <FaComment className={`${tab === 3 && "fill-black"} w-4 h-4 fill-current`} />
                  </div>
                </a>
              </div>
            </div>

            {/* Tabs items */}
            <div className="max-w-xl md:max-w-none md:w-full mx-auto pb-[26px] md:order-1" data-aos="zoom-y-out" ref={tabs}>
              <div className="relative flex flex-col text-center lg:text-right">
                {/* Item 1 */}
                <Transition
                  show={tab === 1}
                  appear={true}
                  className="w-full"
                  enter="transition ease-in-out duration-700 transform order-first"
                  enterStart="opacity-0 translate-y-4"
                  enterEnd="opacity-100 translate-y-0"
                  leave="transition ease-in-out duration-300 transform absolute"
                  leaveStart="opacity-100 translate-y-0"
                  leaveEnd="opacity-0 -translate-y-4"
                >
                  <div className="relative inline-flex flex-col">
                    <img className="md:max-w-[100%] mx-auto rounded-2xl" src='/image/date_careers.png' width="600" height="462" alt="date_Careers bg" />
                  </div>
                </Transition>
                {/* Item 2 */}
                <Transition
                  show={tab === 2}
                  appear={true}
                  className="w-full flex justify-start sm:block"
                  enter="transition ease-in-out duration-700 transform order-first"
                  enterStart="opacity-0 translate-y-4"
                  enterEnd="opacity-100 translate-y-0"
                  leave="transition ease-in-out duration-300 transform absolute"
                  leaveStart="opacity-100 translate-y-0"
                  leaveEnd="opacity-0 -translate-y-4"
                >
                  <div className="relative inline-flex flex-col">
                    <img className="md:max-w-[100%] mx-auto rounded-2xl" src='/image/date_identity.jpg' width="600" height="462" alt="date_Identity bg" />
                  </div>
                </Transition>
                {/* Item 3 */}
                <Transition
                  show={tab === 3}
                  appear={true}
                  className="w-full"
                  enter="transition ease-in-out duration-700 transform order-first"
                  enterStart="opacity-0 translate-y-4"
                  enterEnd="opacity-100 translate-y-0"
                  leave="transition ease-in-out duration-300 transform absolute"
                  leaveStart="opacity-100 translate-y-0"
                  leaveEnd="opacity-0 -translate-y-4"
                >
                  <div className="relative inline-flex flex-col">
                    <img className="md:max-w-[100%] mx-auto rounded-2xl" src='/image/date_economy.png' width="600" height="462" alt="date_Economy bg" />
                  </div>
                </Transition>
              </div>
            </div >

          </div >

        </div >
      </div >
    </section >
  );
}

export default Features;
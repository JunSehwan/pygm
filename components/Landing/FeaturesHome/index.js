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
    <section className="relative md:h-auto h-[96rem]">

      {/* Section background (needs .relative class on parent and next sibling elements) */}
      <div className="absolute inset-0 bg-gray-100 pointer-events-none mb-16" aria-hidden="true"></div>
      <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-gray-200 transform -translate-y-1/2"></div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="pt-12 md:pt-20">

          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <h1 className="text-3xl font-extrabold leading-tight mb-4">
              <span className='text-blue-600'>'3분안에'</span> 개성있는 프로필 만들기
            </h1>
            <p className="text-xl text-gray-600">재빨리 프로필을 만들고 내 커리어에 대한 조언을 듣고, 입사제의를 받아보세요.</p>
          </div>

          {/* Section content */}
          <div className="md:grid md:grid-cols-12 md:gap-6">

            {/* Content */}
            <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6" data-aos="fade-right">
              <div className="md:pr-4 lg:pr-12 xl:pr-16 mb-14">
                <h3 className="text-3xl font-bold leading-tight mb-3">
                  자, 그럼 시작해볼까요?
                </h3>
                <p className="text-xl text-gray-600">
                  <span className="text-red-500">잠깐!</span> 지금 구직의사가 없다고 하더라도, 콕콕 기능을 통해 좀 더 내 커리어 경력을 쌓은 후, 희망하는 팀에 합류할 수 있는 기회를 얻을 수 있습니다.
                </p>
              </div>
              {/* Tabs buttons */}
              <div className="mb-8 md:mb-0" data-aos="zoom-in-up">
                <a
                  className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${tab !== 1 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`}
                  onClick={(e) => { e.preventDefault(); setTab(1); }}
                >
                  <div>
                    <div className="font-bold leading-snug text-lg mb-1">STEP 1. 개성있는 프로필 만들기</div>
                    <div className="text-gray-600 text-md">포트폴리오나 자기소개 영상을 업로드하여 프로필을 꾸며주세요! 팀담당자라면 디테일한 팀의 장점을 작성하여 입사희망자에게 어필할 수 있습니다.</div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
                    <ImProfile className={`${tab === 1 && "fill-black"} w-4 h-4 fill-current`} />
                  </div>
                </a>
                <a
                  className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${tab !== 2 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`}
                  onClick={(e) => { e.preventDefault(); setTab(2); }}
                >
                  <div>
                    <div className="font-bold leading-snug text-lg mb-1">STEP 2. 팀소식, 다양한 인재탐색</div>
                    <div className="text-gray-600 text-md ">다른 동료들이 제의받은 연봉수준을 확인해보고 기업 팀들의 소식을 들어보세요.
                      팀담당자는 인재카드를 꼼꼼히 살펴보면서 지원자의 능력을 검토해보세요.
                      {/* 인재를 채용할 뿐만 아니라 콕!콕! 기능을 통해 향후 TO가 날 경우 가장 빠르게 입사를 제안할 수 있습니다. */}
                    </div>
                  </div>
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full shadow flex-shrink-0 ml-3">
                    <MdPersonSearch className={`${tab === 2 && "fill-black"} w-4 h-4 fill-current`} />
                  </div>
                </a>
                <a
                  className={`flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${tab !== 3 ? 'bg-white shadow-md border-gray-200 hover:shadow-lg' : 'bg-gray-200 border-transparent'}`}
                  onClick={(e) => { e.preventDefault(); setTab(3); }}
                >
                  <div>
                    <div className="font-bold leading-snug text-lg mb-1">STEP 3. 대화, 그리고 입사제의</div>
                    <div className="text-gray-600 text-md">
                      후보자들이 당신의 기업(팀)에 관심이 있다면 당신의 제안에 수락할 것입니다.
                      대화기능을 활용하여 좀 더 구체적인 채용절차에 대해 얘기해보세요.
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
            <div className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 mb-14 md:mb-0 md:order-1" data-aos="zoom-y-out" ref={tabs}>
              <div className="relative flex flex-col text-center lg:text-right">
                {/* Item 1 */}
                <Transition
                  show={tab === 1}
                  appear={true}
                  className="w-full"
                  enter="transition ease-in-out duration-700 transform order-first"
                  enterStart="opacity-0 translate-y-16"
                  enterEnd="opacity-100 translate-y-0"
                  leave="transition ease-in-out duration-300 transform absolute"
                  leaveStart="opacity-100 translate-y-0"
                  leaveEnd="opacity-0 -translate-y-16"
                >
                  <div className="relative inline-flex flex-col">
                    <img className="md:max-w-none mx-auto rounded-2xl" src='/image/backgroundPicture.jpg' width="600" height="462" alt="Features bg" />
                    <img className="md:max-w-none absolute w-full left-0 md:left-10 transform animate-float rounded-2xl shadow-lg" src='/image/screenshot/new_Profile.png' width="600" height="520" alt="Element" style={{ top: '20%' }} />
                  </div>
                </Transition>
                {/* Item 2 */}
                <Transition
                  show={tab === 2}
                  appear={true}
                  className="w-full flex justify-start sm:block"
                  enter="transition ease-in-out duration-700 transform order-first"
                  enterStart="opacity-0 translate-y-16"
                  enterEnd="opacity-100 translate-y-0"
                  leave="transition ease-in-out duration-300 transform absolute"
                  leaveStart="opacity-100 translate-y-0"
                  leaveEnd="opacity-0 -translate-y-16"
                >
                  <div className="relative inline-flex flex-col">
                    <img className="md:max-w-none mx-auto rounded-2xl sm:w-[320px] w-[240px]" src='/image/screenshot/new_peoplecard.png' width="380" height="462" alt="Features bg" />
                    <img className="md:max-w-none absolute w-[320px] left-[24%] md:left-10 transform animate-float rounded-2xl shadow-lg " src='/image/screenshot/new_posting.png' width="320" height="480" alt="Element" style={{ top: '10%' }} />
                  </div>
                </Transition>
                {/* Item 3 */}
                <Transition
                  show={tab === 3}
                  appear={true}
                  className="w-full"
                  enter="transition ease-in-out duration-700 transform order-first"
                  enterStart="opacity-0 translate-y-16"
                  enterEnd="opacity-100 translate-y-0"
                  leave="transition ease-in-out duration-300 transform absolute"
                  leaveStart="opacity-100 translate-y-0"
                  leaveEnd="opacity-0 -translate-y-16"
                >
                  <div className="relative inline-flex flex-col">
                    <img className="md:max-w-none mx-auto rounded-2xl" src='/image/backgroundPicture45.jpg' width="600" height="462" alt="Features bg" />
                    <img className="md:max-w-none absolute w-full left-0 md:left-10 transform animate-float rounded-2xl shadow-lg" src='/image/screenshot/new_conversation.png' width="600" height="520" alt="Element" style={{ top: '20%' }} />
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
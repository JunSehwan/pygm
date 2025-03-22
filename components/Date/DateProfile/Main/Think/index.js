import React, { useCallback, useEffect, useState } from 'react';
import Mbti from './Mbti';
import Hobby from './Hobby';
import Romance from './Romance';
import CareerLiving from './CareerLiving';
import Etc from './Etc';
import { useSelector } from 'react-redux';



const index = () => {
  //작성 완료시 창 닫음
  const { patchThinkMbtiInfoDone, patchHobbyDone, patchRomanceDone,
    patchCareerLivingDone } = useSelector(state => state.user);

  useEffect(() => {
    if (patchThinkMbtiInfoDone) {
      // setopenMbti(false);
      setopenHobby(true);
    }
  }, [patchThinkMbtiInfoDone])

  useEffect(() => {
    if (patchHobbyDone) {
      // setopenHobby(false);
      setopenRomance(true);
    }
  }, [patchHobbyDone])

  useEffect(() => {
    if (patchRomanceDone) {
      // setopenRomance(false);
      setopenCareerLiving(true);
    }
  }, [patchRomanceDone])

  useEffect(() => {
    if (patchCareerLivingDone) {
      // setopenCareerLiving(false);
      setopenEtc(true);
    }
  }, [patchCareerLivingDone])

  const [openMbti, setopenMbti] = useState(true);
  const onOpenMbti = useCallback(() => {
    setopenMbti(prev => !prev);
  }, [])

  const [openHobby, setopenHobby] = useState(false);
  const onOpenHobby = useCallback(() => {
    setopenHobby(prev => !prev);
  }, [])

  const [openRomance, setopenRomance] = useState(false);
  const onOpenRomance = useCallback(() => {
    setopenRomance(prev => !prev);
  }, [])

  const [openCareerLiving, setopenCareerLiving] = useState(false);
  const onOpenCareerLiving = useCallback(() => {
    setopenCareerLiving(prev => !prev);
  }, [])

  const [openEtc, setopenEtc] = useState(false);
  const onOpenEtc = useCallback(() => {
    setopenEtc(prev => !prev);
  }, [])

  return (
    <div className="w-full p-2">
      <div
        data-collapse="collapse"
        className="block w-full basis-full transition-all duration-500 ease-in-out"
      >

        <div className='w-full' id="accordion-nested-parent" data-accordion="collapse">
          <h2 className='w-full' id="accordion-collapse-heading-1">
            <button onClick={onOpenMbti}
              className={`
              transition-all duration-500 ease-in-out 
              flex items-center justify-between w-full p-5 border-solid
            font-medium rtl:text-right text-slate-500 border border-b-1
             border-slate-200 focus:ring-4 bg-slate-50
             focus:ring-slate-200 dark:focus:ring-slate-800 dark:border-slate-700
              dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3`} data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
              <span>MBTI</span>
              <svg data-accordion-icon className={`w-3 h-3 ${!openMbti && `rotate-180`} transition shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
              </svg>
            </button>
          </h2>
          <div className={`
              ${openMbti ? "max-h-[2400px] h-fit transition-all duration-500 ease-in-out" :
              "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0 "}
              transition duration-500 ease-in-out `}
            id="accordion-collapse-body-1"
            aria-labelledby="accordion-collapse-heading-1">
            <div className={`${!openMbti && "hidden h-0"}py-4 px-2 border border-solid w-full
               border-slate-200 dark:border-slate-700 dark:bg-slate-900 transition-all duration-500 ease-in-out`}>
              <Mbti />
            </div>
          </div>
        </div>
      </div>


      <div
        data-collapse="collapse"
        className="block w-full basis-full transition-all duration-500 ease-in-out"
      >

        <div className='w-full relative' id="accordion-nested-parent" data-accordion="collapse">
          <h2 className='w-full' id="accordion-collapse-heading-1">
            <button onClick={onOpenHobby}
              className={`
              transition-all duration-500 ease-in-out 
              flex items-center justify-between w-full p-5 border-solid
            font-medium rtl:text-right text-slate-500 border border-b-1
             border-slate-200 focus:ring-4 bg-slate-50
             focus:ring-slate-200 dark:focus:ring-slate-800 dark:border-slate-700
              dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3`} data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
              <span>취미생활</span>
              <svg data-accordion-icon className={`w-3 h-3 ${!openHobby && `rotate-180`} transition shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
              </svg>
            </button>
          </h2>
          <div className={`
              ${openHobby ? "max-h-[2400px] h-fit transition-all duration-500 ease-in-out" :
              "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0"}
              transition duration-500 ease-in-out `}
            id="accordion-collapse-body-1"
            aria-labelledby="accordion-collapse-heading-1">
            <div className={`${!openHobby && "hidden h-0"}py-4 px-2 border border-solid w-full
               border-slate-200 dark:border-slate-700 dark:bg-slate-900 transition-all duration-500 ease-in-out`}>
              <Hobby />

            </div>
          </div>

        </div>


        <div className='w-full relative' id="accordion-nested-parent" data-accordion="collapse">
          <h2 className='w-full' id="accordion-collapse-heading-1">
            <button onClick={onOpenRomance}
              className={`
              transition-all duration-500 ease-in-out 
              flex items-center justify-between w-full p-5 border-solid
            font-medium rtl:text-right text-slate-500 border border-b-1
             border-slate-200 focus:ring-4 bg-slate-50
             focus:ring-slate-200 dark:focus:ring-slate-800 dark:border-slate-700
              dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3`} data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
              <span>연애/결혼관</span>
              <svg data-accordion-icon className={`w-3 h-3 ${!openRomance && `rotate-180`} transition shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
              </svg>
            </button>
          </h2>

          <div className={`
              ${openRomance ? "max-h-[2400px] h-fit transition-all duration-500 ease-in-out" :
              "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0"}
              transition duration-500 ease-in-out `}
            id="accordion-collapse-body-1"
            aria-labelledby="accordion-collapse-heading-1">
            <div className={`${!openRomance && "hidden h-0"}py-4 px-2 border border-solid w-full
               border-slate-200 dark:border-slate-700 dark:bg-slate-900 transition-all duration-500 ease-in-out`}>
              <Romance />

            </div>
          </div>

        </div>

        <div className='w-full relative' id="accordion-nested-parent" data-accordion="collapse">
          <h2 className='w-full' id="accordion-collapse-heading-1">
            <button onClick={onOpenCareerLiving}
              className={`
              transition-all duration-500 ease-in-out 
              flex items-center justify-between w-full p-5 border-solid
            font-medium rtl:text-right text-slate-500 border border-b-1
             border-slate-200 focus:ring-4 bg-slate-50
             focus:ring-slate-200 dark:focus:ring-slate-800 dark:border-slate-700
              dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3`} data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
              <span>커리어/생활</span>
              <svg data-accordion-icon className={`w-3 h-3 ${!openCareerLiving && `rotate-180`} transition shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
              </svg>
            </button>
          </h2>

          <div className={`
              ${openCareerLiving ? "max-h-[2400px] h-fit transition-all duration-500 ease-in-out" :
              "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0 "}
              transition duration-500 ease-in-out `}
            id="accordion-collapse-body-1"
            aria-labelledby="accordion-collapse-heading-1">
            <div className={`${!openCareerLiving && "hidden h-0"}py-4 px-2 border border-solid w-full
               border-slate-200 dark:border-slate-700 dark:bg-slate-900 transition-all duration-500 ease-in-out`}>
              <CareerLiving />

            </div>
          </div>

        </div>

        <div className='w-full relative' id="accordion-nested-parent" data-accordion="collapse">
          <h2 className='w-full' id="accordion-collapse-heading-1">
            <button onClick={onOpenEtc}
              className={`
              transition-all duration-500 ease-in-out 
              flex items-center justify-between w-full p-5 border-solid
            font-medium rtl:text-right text-slate-500 border border-b-1
             border-slate-200 focus:ring-4 bg-slate-50
             focus:ring-slate-200 dark:focus:ring-slate-800 dark:border-slate-700
              dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-3`} data-accordion-target="#accordion-collapse-body-1" aria-expanded="true" aria-controls="accordion-collapse-body-1">
              <span>추가질문</span>
              <svg data-accordion-icon className={`w-3 h-3 ${!openEtc && `rotate-180`} transition shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
              </svg>
            </button>
          </h2>

          <div className={`
              ${openEtc ? "max-h-[2400px] h-fit transition-all duration-500 ease-in-out" :
              "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0 "}
              transition duration-500 ease-in-out `}
            id="accordion-collapse-body-1"
            aria-labelledby="accordion-collapse-heading-1">
            <div className={`${!openEtc && "hidden h-0"}py-4 px-2 border border-solid w-full
               border-slate-200 dark:border-slate-700 dark:bg-slate-900 transition-all duration-500 ease-in-out`}>
              <Etc />

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default index;
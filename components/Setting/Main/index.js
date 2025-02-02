import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';
import { FaUserGear } from "react-icons/fa6";
import { AiFillNotification } from "react-icons/ai";
import { FaQuestionCircle } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { MdManageAccounts } from "react-icons/md";

const index = () => {

  const router = useRouter();
  const goNotice = useCallback(() => {
    window.open("https://delightful-quokka-ae8.notion.site/188fb004cc25802b9f81d82447c039eb?pvs=4");
  }, [router])
  const onClickQuestion = useCallback(() => {
    window?.open('https://open.kakao.com/o/sAJwMNCe', '_blank')
  }, [])
  const onClickChangePWD = useCallback(() => {
    router.push('/setting/password')
  }, [router])
  const onClickSleep = useCallback(() => {
    router.push('/setting/sleep')
  }, [router])
  const onClickWithdraw = useCallback(() => {
    router.push('/setting/withdraw')
  }, [router])


  const [openTab, setOpenTab] = useState(false);
  const onToggleTab = useCallback(() => {
    setOpenTab(prev => !prev);
  })
  //매니저 문의하기 / 공지사항 / 내 상태 변경 (잠시 휴식 / 회원탈퇴)

  return (
    <div className="p-3 inline-flex flex-col rounded-md shadow-xs w-full" role="group">
      <div className='w-full my-4 px-2 flex flex-row items-center'>
        <FaUserGear className='text-blue-800 w-6 h-6 mr-2' />
        <span className='text-blue-800 text-2xl text-bold'>설정</span>
      </div>
      <button
        onClick={goNotice}
        type="button"
        className="w-full px-4 text-md text-left mx-auto shadow-md py-6 font-medium text-gray-600 bg-white  
       rounded-t-lg hover:bg-slate-50 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
        dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700
         dark:focus:ring-blue-500 dark:focus:text-white border-solid border-0 border-b-[1px] border-gray-200
         flex flex-row items-center gap-2
         ">
        <AiFillNotification className='size-6' />
        <span>공지사항</span>
      </button>
      <button
        onClick={onClickQuestion}
        type="button"
        className="w-full px-4 text-md text-left mx-auto shadow-md py-6 font-medium text-gray-600 bg-white 
       hover:bg-slate-50 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
        dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 
         dark:focus:ring-blue-500 dark:focus:text-white border-solid border-0 border-b-[1px] border-gray-200
         flex flex-row items-center gap-2
         ">
        <FaQuestionCircle className='size-6' />
        <span>피그말리온 문의하기</span>
      </button>
      <button
        onClick={onClickChangePWD}
        type="button"
        className="w-full px-4 text-md text-left mx-auto shadow-md py-6 font-medium text-gray-600 bg-white 
       hover:bg-slate-50 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
        dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700 
         dark:focus:ring-blue-500 dark:focus:text-white border-solid border-0 border-b-[1px] border-gray-200
         flex flex-row items-center gap-2
         ">
        <RiLockPasswordFill className='size-6' />
        <span>비밀번호 재설정</span>
      </button>
      <button
        onClick={onToggleTab}
        type="button"
        className="w-full px-4 text-md text-left mx-auto shadow-md py-6 font-medium text-gray-600 bg-white 
       hover:bg-slate-50 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
        dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700
         dark:focus:ring-blue-500 dark:focus:text-white justify-between items-center border-solid border-0 border-b-[1px] border-gray-200
         flex flex-row gap-2
         ">
        <span className='flex flex-row items-center gap-2'>
          <MdManageAccounts className='size-6' />
          <span>내 상태변경</span>
        </span>
        <svg data-accordion-icon className={`w-3 h-3 ${!openTab && `rotate-180`} transition shrink-0`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5 5 1 1 5" />
        </svg>
      </button>

      {/* 추가생성 */}

      <div className={`
              ${openTab ? "max-h-[2000px] transition-all duration-500 ease-in-out" :
          "max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-0 "}
              transition duration-500 ease-in-out `}
        id="accordion-collapse-body-1"
        aria-labelledby="accordion-collapse-heading-1">
        <div className={`${!openTab && "hidden h-0"}py-4 border border-solid w-full
               border-slate-200 dark:border-slate-700 dark:bg-slate-900 transition-all duration-500 ease-in-out`}>
          <button
            onClick={onClickSleep}
            type="button"
            className="w-full px-4 text-md text-left mx-auto shadow-sm py-4 font-medium text-gray-600 bg-gray-50
        hover:bg-slate-200 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
        dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700
         dark:focus:ring-blue-500 dark:focus:text-white flex flex-row justify-between items-center border-solid border-0 border-b-[1px] border-gray-200">
            <span className='text-md text-gray-500 font-normal'>
              소개팅 휴면상태
            </span>
          </button>


          <button
            onClick={onClickWithdraw}
            type="button"
            className="w-full px-4 text-md text-left mx-auto shadow-sm py-4 font-medium text-gray-600 bg-gray-50
       rounded-b-lg hover:bg-slate-200 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700
        dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:text-white dark:hover:bg-gray-700
         dark:focus:ring-blue-500 dark:focus:text-white flex flex-row justify-between items-center border-solid border-0 border-b-[1px] border-gray-200">
            <span className='text-md text-gray-500 font-normal'>
              회원탈퇴
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default index;
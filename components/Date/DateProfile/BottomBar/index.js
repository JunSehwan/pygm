import React, { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import profilePic from 'public/image/icon/happiness.png';
// import { BiTransfer } from 'react-icons/bi';
import styled from 'styled-components';
// import { updatePurpose } from 'firebaseConfig';
// import { updateUserPurpose, updatePurposeFalse } from 'slices/user';
import { FaUserCircle, FaBriefcase } from "react-icons/fa";
import { BsChatHeartFill, BsFillCreditCard2FrontFill } from "react-icons/bs";
import { MdBookmarkAdd } from "react-icons/md";

import toast from 'react-hot-toast';
// import Image from 'next/image';
// import ProgressBar from './ProgressBar';
import { useRouter } from 'next/router';
// import IntroModal from './IntroModal';
// import { AiFillSafetyCertificate } from 'react-icons/ai';
// import Expert from '/public/image/icon/expertise.png';
// import { Tooltip } from 'flowbite-react';

const ImageWrapper = styled.div`
width: 100%;
border-radius: 8px;
justify-content: center;
margin: 0 auto;
min-height: 62px;
position: relative;

& > span {
  position: unset !important;
  & .autoimage {
    object-fit: contain !important;
    position: relative !important;
    height: 62px !important;
  }
}
`

const BottomBar = styled.div`
  /* background: white; */
  background: linear-gradient(180deg, rgb(250, 250, 250) 0%, rgb(250, 250, 250) 97.4%, rgb(237, 237, 237) 100%, rgb(237, 237, 237) 100%, rgb(237, 237, 237) 100%);
  box-shadow: 9px 23px 25px 13px rgb(0 0 0 / 10%), 16px 8px 10px 12px rgb(0 0 0 / 10%);
`

const index = (
  {
    onMoveToElement1,
    onMoveToElement2,
    onMoveToElement3,
    onMoveToElement4,
    onMoveToElement5,
    onMoveToElement6,
  }
  // { moveToResume }
) => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const notify = () => toast("업데이트 성공");

  const writeThumbImage = user?.thumbimage?.length >= 2;
  const writeBasicInfo = user?.username && user?.nickname && user?.religion && user?.birthday?.year && user?.birthday?.month && user?.birthday?.day && user?.gender && user?.phonenumber && user?.address_sigugun && user?.address_sido;
  const writeCareerInfo = user?.education && user?.school && user?.job && user?.company && user?.duty && user?.salary && user?.company_location_sido && user?.company_location_sigugun && user?.jobdocument?.length !== 0;

  const goGroup = useCallback(() => {
    router.push('/date/profile/group')
  }, [router])

  const isGroupPage = router?.pathname !== "/date/profile/group/";

  return (
    <>
      {/* // Bottom Bar */}
      <BottomBar aria-label="Bottombar"
        className='block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-gray-50 dark:bg-gray-800
      fixed left-0 bottom-0 right-0 drop-shadow-xl
      '>
        <div className="overflow-y-auto rounded w-full mx-auto max-w-[420px]">
          <div className=''>

            <ul className="flex flex-row items-center justify-between">

              <li className='flex w-full justify-center min-w-[60px]'>
                <button
                  className={`flex items-center justify-center w-full py-[4px] rounded-lg 
                    my-1 text-[12px] font-normal
                    ${writeThumbImage ? `text-blue-600 dark:text-white shadow-inner` :
                      `text-gray-600 dark:text-white`
                    }
                     hover:bg-blue-100 dark:hover:bg-gray-600`}
                  onClick={onMoveToElement1}
                >
                  <div className='flex-shrink-0' >
                    <div

                      className={`w-full flex flex-col justify-center items-center`}>
                      <FaUserCircle
                        className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                      ></FaUserCircle>
                      <span className="mt-1 flex-1 whitespace-nowrap">사진등록</span>
                    </div>
                  </div>
                </button>
              </li>
              <li className='flex w-full justify-center min-w-[60px]'>
                <button
                  className={`flex items-center justify-center w-full py-[4px] rounded-lg 
                    my-1 text-[12px] font-normal
                    ${writeBasicInfo ? `text-blue-600 dark:text-white shadow-inner` :
                      `text-gray-600 dark:text-white`
                    }
                     hover:bg-blue-100 dark:hover:bg-gray-600`}
                  onClick={onMoveToElement2}
                >
                  <div className='flex-shrink-0' >
                    <div

                      className={`w-full flex flex-col justify-center items-center`}>
                      <BsFillCreditCard2FrontFill
                        className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                      ></BsFillCreditCard2FrontFill>
                      <span className="mt-1 flex-1 whitespace-nowrap">기본정보</span>
                    </div>
                  </div>
                </button>
              </li>
              <li className='flex w-full justify-center min-w-[60px]'>
                <button
                  className={`flex items-center justify-center w-full py-[4px] rounded-lg 
                    my-1 text-[12px] font-normal
                    ${writeCareerInfo ? `text-blue-600 dark:text-white shadow-inner` :
                      `text-gray-600 dark:text-white`
                    }
                     hover:bg-blue-100 dark:hover:bg-gray-600`}
                  onClick={onMoveToElement3}
                >
                  <div className='flex-shrink-0 ' >
                    <div
                      className={`w-full flex flex-col justify-center items-center `}>
                      <FaBriefcase
                        className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                      ></FaBriefcase>
                      <span className="mt-1 flex-1 whitespace-nowrap">스펙정보</span>
                    </div>
                  </div>
                </button>
              </li>
              <li className='flex w-full justify-center min-w-[60px]'>
                <button
                  className={`flex items-center justify-center w-full py-[4px] rounded-lg
                     my-1 text-[12px] font-normal text-gray-600 dark:text-white
                      hover:bg-blue-100 dark:hover:bg-gray-600`}
                  onClick={onMoveToElement4}
                >
                  <div className='flex-shrink-0 ' >
                    <div
                      className={`w-full flex flex-col justify-center items-center `}>
                      <BsChatHeartFill
                        className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                      ></BsChatHeartFill>
                      <span className="mt-1 flex-1 whitespace-nowrap">가치관</span>
                    </div>
                  </div>
                </button>
              </li>
              <li className='flex w-full justify-center min-w-[60px]'>
                <div className={`flex items-center justify-center w-full py-[4px] rounded-lg my-1 text-[12px] font-normal text-gray-600 dark:text-white hover:bg-blue-100 dark:hover:bg-gray-600`}>
                  <div className='flex-shrink-0 ' >
                    <button
                      onClick={onMoveToElement5}
                      className={`w-full flex flex-col justify-center items-center `}>
                      <MdBookmarkAdd
                        className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                      ></MdBookmarkAdd>
                      <span className="mt-1 flex-1 whitespace-nowrap">부가정보</span>
                    </button>
                  </div>
                </div>
              </li>

              {/* {!user?.companycomplete ?
                <div className='w-full my-1 text-gray-500 text-base'>
                  <button
                    onClick={openIntroModal}
                    className='flex flex-row px-3 py-2 border-gray-400 border-[1px] border-solid rounded-full hover:bg-gray-100 mx-auto items-center'
                  ><BiTransfer className='mr-0.5' />그룹회원으로 변경</button>
                </div>
                :
                <div className='w-full my-1 text-gray-500 text-base'>
                  <button
                    onClick={goGroup}
                    className='flex flex-row px-3 py-2 border-gray-400 border-[1px] border-solid rounded-full hover:bg-gray-100 mx-auto items-center'
                  ><BiTransfer className='mr-0.5' />그룹페이지</button>
                </div>
              } */}
            </ul>
          </div>
        </div>
      </BottomBar>

      {/* <IntroModal
        introModalOpened={introModalOpened}
        closeIntroModal={closeIntroModal}
      /> */}
    </>
  );
};



export default index;
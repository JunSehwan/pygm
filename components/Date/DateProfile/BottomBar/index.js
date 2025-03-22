import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { writeDateprofile, writeDateprofileDoneFalse } from 'slices/user';
import { FaUserCircle, FaBriefcase } from "react-icons/fa";
import { BsChatHeartFill, BsFillCreditCard2FrontFill } from "react-icons/bs";

import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { finishDate_Profile } from 'firebaseConfig';
import FinishedModal from './FinishedModal';

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
  const { user, writeDateprofileDone } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const notify = () => toast("업데이트 성공");

  const writeThumbImage = user?.thumbimage?.length >= 2;
  const writeBasicInfo = user?.username && user?.nickname && user?.religion && user?.birthday?.year && user?.birthday?.month && user?.birthday?.day && user?.gender && user?.phonenumber && user?.address_sigugun && user?.address_sido;
  const writeCareerInfo = user?.education && user?.school && user?.job && user?.company && user?.duty && user?.salary && user?.company_location_sido && user?.company_location_sigugun && user?.jobdocument?.length !== 0;
  const writeThinkInfo = user?.mbti_ei && user?.hobby && user?.drink && user?.health && user?.interest && user?.career_goal && user?.living_weekend && user?.living_consume && user?.opfriend && user?.friendmeeting && user?.longdistance && user?.religion_important && user?.religion_visit && user?.religion_accept && user?.food_diet;

  const [onFinishedModal, setOpenFinishedModal] = useState(false);

  const onClickFinishedModal = useCallback(() => {
    setOpenFinishedModal(true);
  }, [])

  const onClickFinishedModalClose = useCallback(() => {
    setOpenFinishedModal(false);
  }, [])

  useEffect(() => {
    if (writeThumbImage && writeBasicInfo && writeCareerInfo && writeThinkInfo) {
      if ((!user?.date_profile_finished || user?.date_profile_finished == false)
        || (user?.date_profile_finished == true && user?.date_pending == true)
      ) {
        onClickFinishedModal()
      }
    }
  }, [onClickFinishedModal, writeThumbImage, writeBasicInfo,
    writeCareerInfo, writeThinkInfo, user?.date_profile_finished, user?.date_pending])

  useEffect(() => {
    if (writeDateprofileDone) {
      setOpenFinishedModal(false);
      dispatch(writeDateprofileDoneFalse());
    }
  }, [dispatch, writeDateprofileDone, user?.likes])

  const onFinish = useCallback(async () => {
    const result = await finishDate_Profile();
    dispatch(writeDateprofile(result))
    router.push('/date/pending')
  }, [router, dispatch])

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
                    my-1 text-[12px] font-normal
                    ${writeThinkInfo ? `text-blue-600 dark:text-white shadow-inner` :
                      `text-gray-600 dark:text-white`
                    }
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

            </ul>
          </div>
        </div>
      </BottomBar>

      <FinishedModal
        visible={onFinishedModal}
        onFinish={onFinish}
        onClose={onClickFinishedModalClose}
        title={`프로필 입력을 마쳤습니다!`}
      />
    </>
  );
};



export default index;
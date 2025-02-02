import React, { useCallback, useState, createRef, useEffect } from 'react';
import { TbHandClick } from 'react-icons/tb';
import { FaRegKissWinkHeart } from "react-icons/fa";
import styled, { keyframes } from 'styled-components';
import { updateServiceInfoSeen } from 'firebaseConfig';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

const animate = keyframes`
 from {
    transform: translateX(0) rotate(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) rotate(-45deg);
    opacity: 0;
  }
`
const scale = keyframes`
 from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
`
const Container = styled(motion.div)`
  #double {
    animation: ${scale} 0.5s infinite ease-in-out;
  }
  #slide {
    animation: ${animate} 2s infinite ease-in-out;
    }

@-ms-keyframes spin {
  from {
    -ms-transform: rotate(0deg);
  }
  to {
    -ms-transform: rotate(-45deg);
  }
}

@-moz-keyframes spin {
  from {
    -moz-transform: rotate(0deg);
  }
  to {
    -moz-transform: rotate(-45deg);
  }
}

@-webkit-keyframes spin {
  from {
    -webkit-transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(-45deg);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-45deg);
  }
}
`


const index = () => {
  const { user } = useSelector(state => state.user);
  const [open, setOpen] = useState(true);
  const closeModal = useCallback(() => {
    setOpen(false);
  }, [])
  const noMoreSee = useCallback(async () => {
    await updateServiceInfoSeen(99);
    setOpen(false);
  }, [])

  const modalEl = createRef();
  const handleClickOutside = (event) => {
    if (open === true && !modalEl?.current?.contains(event.target))
      closeModal();
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  return (
    <>
      {open && user?.infoseen !== 99 ?
        <Container
          className="fixed top-0 left-0 z-[9999] flex h-full w-full items-center justify-center bg-slate-800/70"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <div className="w-[100%] justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
          >
            <div className="sticky w-[100%] mx-[12px] max-w-[420px] min-w-[320px]" ref={modalEl}>
              <div className="p-4 border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white/80 outline-none focus:outline-none">
                <div className='flex flex-col gap-4 w-full p-4'>
                  <div className='w-full py-4 flex flex-row gap-3 items-center h-full justify-between'>
                    <div className='p-3'>
                      <TbHandClick
                        id="double"
                        className='w-8 h-8 text-[--pygm-two] ' />
                    </div>
                    <div className="whitespace-normal leading-normal w-full overflow-hidden text-gray-600 dark:text-gray-100 text-left text-md py-2 px-2">
                      각각의 프로필카드를 클릭(터치)시 <br />상세보기가 가능합니다.
                    </div>
                  </div>
                  <h2 className='h-0 border-solid border-b-[1px] border-gray-500/50 w-full'></h2>

                  <div className='w-full py-4 flex flex-row gap-3 items-center h-full justify-between'>
                    <div className='p-3'>
                      <FaRegKissWinkHeart
                        id="double"
                        className='w-8 h-8 text-[--pygm-two]' />
                    </div>
                    <div className="whitespace-normal leading-normal w-full overflow-hidden text-gray-600 dark:text-gray-100 text-left text-md py-2 px-2">
                      윙크보내기(호감표시)를 통해 <br />상대방 이성과 매칭을 할 수 있습니다. <br />매칭후에는 연락처를 교환합니다.
                    </div>
                  </div>
                  {/* <div className='w-full flex flex-col gap-3 items-center h-full justify-between'>
                    <>
                      <TbHandClick
                        id="slide"
                        className='w-8 h-8 text-[--pygm-two] ' />
                      <div className="whitespace-normal leading-normal w-full overflow-hidden text-gray-600 dark:text-gray-100 text-left text-md py-2 px-2">
                        왼쪽으로 슬라이드하면 해당 인물 정보는 더이상 보이지 않습니다.
                      </div>
                    </>
                  </div> */}
                </div>
                <div className="flex items-center justify-center mt-2 gap-4 w-full">
                  <button type="button" onClick={noMoreSee} className="w-full py-2 px-4  bg-[--pygm-three] hover:bg-[--pygm-two] focus:ring-sky-500 focus:ring-offset-sky-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg ">
                    확인
                  </button>
                </div>
                {/* <button type="button" onClick={noMoreSee} className="mt-3 w-full py-2 px-4 text-gray-600 transition ease-in duration-200 font-normal text-xs text-center focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg ">
                  다신 보지않기
                </button> */}
              </div>
            </div>
          </div>
        </Container>
        : null}
    </>
  );
};

export default index;
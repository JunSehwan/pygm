import React from 'react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import BottomBar from './BottomBar';
import Main from './Main';
import {
  useMoveScroll1,
  useMoveScroll2,
  useMoveScroll3,
  useMoveScroll4,
  useMoveScroll5,
  useMoveScroll6
} from 'hooks/useMoveScroll';

const index = () => {
  const router = useRouter();
  const { element1, onMoveToElement1 } = useMoveScroll1();
  const { element2, onMoveToElement2 } = useMoveScroll2();
  const { element3, onMoveToElement3 } = useMoveScroll3();
  const { element4, onMoveToElement4 } = useMoveScroll4();
  const { element5, onMoveToElement5 } = useMoveScroll5();
  const { element6, onMoveToElement6 } = useMoveScroll6();

  return (
    <>
      <div className='flex h-[100vh] w-full'>
        <BottomBar
          onMoveToElement1={onMoveToElement1}
          onMoveToElement2={onMoveToElement2}
          onMoveToElement3={onMoveToElement3}
          onMoveToElement4={onMoveToElement4}
          onMoveToElement5={onMoveToElement5}
          onMoveToElement6={onMoveToElement6}
        />
        <div className='mx-auto w-full max-w-[420px]'>
          {/* {router?.pathname === "/date/profile" ? <Main />
            : router?.pathname === "/date/profile/resume" ? */}
          <Main
            element1={element1}
            element2={element2}
            element3={element3}
            element4={element4}
            element5={element5}
            element6={element6}
          />
          {/* : null} */}
        </div>
      </div>
      <Toaster
        position='bottom-center'
        toastOptions={{
          //   className: '',
          style: {
            // border: '1px solid #713200',
            // padding: '16px',
            color: 'white',
            background: 'rgba(0,0,0,0.76)'
          },
        }}
      />
    </>
  );
};

export default index;
import React from 'react';
import GoBack from 'components/Common/GoBack';
import ThumbimageCarousel from './ThumbimageCarousel';
import CopyAlert from './CopyAlert';
import BottomLikeBar from './BottomLikeBar';
import { Toaster } from 'react-hot-toast';
import InfoTab from './InfoTab';

const index = () => {

  return (
    <>
      <div className='flex h-[100vh] w-full'>
        <div className='mx-auto w-full max-w-[420px]'>
          <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
            <div className='w-full mb-2'>
              <GoBack />
            </div>
            <ThumbimageCarousel />
            <CopyAlert />
            <InfoTab />
            <div className='w-full flex px-2 items-center justify-center'>
              <BottomLikeBar />
            </div>
          </div>
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
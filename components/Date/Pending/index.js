import React from 'react';
import UpperImage from './UpperImage';
import UnderSection from './UnderSection';
import { Toaster } from 'react-hot-toast';

const index = () => {

  return (
    <>
      <div className='flex h-[100vh] w-full'>
        <div className='mx-auto w-full max-w-[420px]'>
          <div className='w-full pb-[24px] md:pb-auto'>
            <UpperImage />
            <UnderSection />
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
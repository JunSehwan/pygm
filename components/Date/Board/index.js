import React from 'react';
import { useRouter } from 'next/router';
import UpperDescription from './UpperDescription';
import { Toaster } from 'react-hot-toast';
import Main from './Main';

const index = () => {
  const router = useRouter();

  return (
    <>
      <div className='flex h-[100vh] w-full'>

        <div className='mx-auto w-full max-w-[420px]'>
          <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
            <UpperDescription />
            <Main />
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
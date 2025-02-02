import React from 'react';
import GoBack from 'components/Common/GoBack';
import Main from './Main';

const index = () => {
  return (
    <div className='flex h-[100vh] w-full'>
      <div className='mx-auto w-full max-w-[420px]'>
        <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
          <GoBack />
          <Main />
        </div>
      </div>
    </div>
  );
};

export default index;
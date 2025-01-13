import React from 'react';
import TopDescription from './TopDescription';
import Strength from './Strength';
import Process from './Process';

const index = () => {
  return (
    <div className='mt-[--navbar-height] w-full'>
      <div className='max-w-[32rem] container mx-auto'>
        <div className='flex justify-center my-3 flex-col'>
          <TopDescription />
          <Strength />
          <Process />
        </div>
      </div>
    </div>
  );
};

export default index;
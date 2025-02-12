import Image from 'next/image';
import React from 'react';

const index = () => {
  return (
    <div className='w-full py-6 mx-auto px-3 flex items-center justify-center relative'>
      <div className='w-full relative flex flex-col items-center justify-center'>
        <Image
          alt="waiting"
          width="0"
          height="0"
          // sizes="50vw"
          unoptimized
          className='w-[420px] rounded-xl shadow-inner animate-pulse'
          src="/image/waiting.png" />
      </div>
    </div>
  );
};

export default index;
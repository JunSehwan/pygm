import React from 'react';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { FcSearch } from "react-icons/fc";

const Empty = ({ title, text, subtext }) => {
  return (
    <div className='w-full flex mx-auto px-2'>
      <div className="h-full text-center mt-[0.6rem] mx-2 w-full">
        <div className="flex h-full flex-col p-4 py-6 bg-white shadow rounded-md w-full">
          <div className="w-[100%] py-3 text-[--pygm-four] flex justify-center items-center">
            <Image
              className='object-cover'
              src="/image/icon/empty.png"
              alt="wink_image"
              unoptimized
              size={60}
              width={68}
              height={68}
            />
          </div>
          <div className='w-[100%] flex flex-col py-2'>
            <p className="text-gray-400 dark:text-gray-200 text-sm px-4">
              {title}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

Empty.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
};
export default Empty;
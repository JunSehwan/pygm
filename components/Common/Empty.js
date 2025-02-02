import React from 'react';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { BsWatch } from "react-icons/bs";

const Empty = ({ title, text, subtext }) => {
  return (
    <div className='w-[100%] '>
      <div className="h-full text-center mt-[1.2rem] mx-2">
        <div className="flex h-full flex-col p-4 py-8 bg-slate-100 rounded-md ">
          <div className="w-[100%] py-3 text-[--pygm-four] flex justify-center items-center">
            <BsWatch
              size={80}
            />
          </div>
          {title && <p className="text-[--pygm-three] dark:text-gray-100 font-bold text-2xl font-base mt-4">
            {title}
          </p>}
          <div className='w-[100%] flex flex-col py-4'>
            <p className="text-[--pygm-five] dark:text-gray-200 text-md px-4">
              {text}
            </p>
            <p className="text-gray-400 dark:text-gray-200 text-sm px-4">
              {subtext}
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
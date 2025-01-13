import React from 'react';
import emptyicon from 'public/image/icon/empty.png';
import Image from 'next/image';
import PropTypes from 'prop-types';

const Empty = ({ title, text }) => {
  return (
    <>
      <div className="w-full h-full text-center mt-[1.2rem]">
        <div className="flex h-full flex-col">
          <div className="w-max-[150px]">
            <Image
              src={emptyicon}
              unoptimized
              alt="logo"
              width="80"
              height="80"
              className="opacity-75"
            // responsive={30vw}
            // layout="fill"
            />
          </div>
          {title && <p className="text-gray-400 dark:text-gray-200 text-lg font-base mt-4">
            {title}
          </p>}
          <p className="text-gray-400 dark:text-gray-200 text-xs py-2 px-6">
            {text}
          </p>
        </div>
      </div>

    </>
  );
};

Empty.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
};
export default Empty;
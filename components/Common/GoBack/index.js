import React from 'react';
import { useRouter } from 'next/router'
import { IoMdArrowRoundBack } from 'react-icons/io';
import PropTypes from 'prop-types';

const index = ({ title }) => {
  const router = useRouter();

  return (
    <div className='w-max'>
      <div className='flex justify-start items-center'>
        <button className="text-gray-600 p-3 rounded-full hover:bg-gray-100"
          onClick={() => router.back()}
        >
          <IoMdArrowRoundBack className='w-6 h-6' />
        </button>
        {title ?
          <div>
            <h2 className='text-gray-600'>
              {title}
            </h2>
          </div>
          : null}
      </div>
    </div>
  );
};

index.propTypes = {
  title: PropTypes.string,
}

export default index;
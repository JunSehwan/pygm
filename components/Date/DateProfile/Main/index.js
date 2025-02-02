import React from 'react';
import Avatar from './Avatar';
import Basic from './Basic';
import Career from './Career';
import Think from './Think';
import Status from './Status';
// import Keyword from './Keyword';
// import Additional from './Additional';
import { motion } from "framer-motion";

const index = (
  {
    element1,
    element2,
    element3,
    element4,
    element5,
    // element6,
  }
) => {


  return (
    <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}>

        <div className='w-full'>
          <Status />
        </div>
        <div className='w-full flex'>
          <div className="mx-2 w-full flex items-center p-4 my-4 text-sm text-[--pygm-five] border border-blue-300 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:border-blue-800" role="alert">
            <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
            </svg>
            <span className="sr-only">Info</span>
            <div>
              <span className="font-medium">중간중간 나오는 업데이트 버튼을 클릭하여</span>
              <span className="font-medium"><br/>정보를 저장해주세요.</span>
            </div>
          </div>
        </div>
        <div className='w-full' ref={element1}>
          <Avatar />
        </div>
        <div ref={element2}>
          <Basic />
        </div>
        <div ref={element3}>
          <Career />
        </div>
        <div ref={element4}>
          <Think />
        </div>
        {/* <div ref={element5}>
        <Keyword />
      </div>
      <div ref={element6}>
        <Additional />
      </div> */}
      </motion.div>
    </div>
  );
};

export default index;
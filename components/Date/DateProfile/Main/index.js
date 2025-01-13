import React from 'react';
import Avatar from './Avatar';
import Basic from './Basic';
import Career from './Career';
import Think from './Think';
// import Keyword from './Keyword';
// import Additional from './Additional';

const index = (
  {
    element1,
    element2,
    element3,
    element4,
    element5,
    element6,
  }
) => {


  return (
    <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
      <div className='w-full' ref={element1}>
        <Avatar />
      </div>
      <div className='w-full' ref={element2}>
        <Basic />
      </div>
      <div className='w-full' ref={element3}>
        <Career />
      </div>
      <div className='w-full' ref={element4}>
        <Think />
      </div>
      {/* <div className='w-full' ref={element5}>
        <Keyword />
      </div>
      <div className='w-full' ref={element6}>
        <Additional />
      </div> */}
    </div>
  );
};

export default index;
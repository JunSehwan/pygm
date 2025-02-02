import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Hobby from './Hobby';
import Romance from './Romance';
import CareerLiving from './CareerLiving';
import Etc from './Etc';
import Rating from './Rating';
import InfoMatching from './InfoMatching';

const index = () => {

  return (
    <div className='w-full flex flex-col items-center'>
      <div className='p-2 rounded-lg w-full bg-slate-100 shadow-inner border border-solid border-slate-100 flex flex-col items-center'>
        <InfoMatching />
        <Hobby />
        <Romance />
        <CareerLiving />
        <Etc />
        <Rating />
      </div>
    </div>
  );
};

export default index;
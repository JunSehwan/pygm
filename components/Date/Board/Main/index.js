import React from 'react';
import Winked from './Winked';
import Winks from './Winks';
import Couples from './Couples';

const index = () => {


  return (
    <div className='w-full'>
      <div className='w-full'>
        <Couples />
      </div>
      <div className='w-full'>
        <Winked />
      </div>
      <div className='w-full'>
        <Winks />
      </div>
    </div>
  );
};

export default index;
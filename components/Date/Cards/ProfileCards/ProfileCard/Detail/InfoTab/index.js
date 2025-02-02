import React from 'react';
import BasicInfo from './BasicInfo';
import CareerInfo from './CareerInfo';
import ThinkInfo from './ThinkInfo';
// import InfoMatching from './ThinkInfo/InfoMatching';

const index = () => {
  return (
    <div className="w-full my-2">
      {/* <InfoMatching /> */}
      <BasicInfo />
      <CareerInfo />
      <ThinkInfo />
    </div>
  );
};

export default index;
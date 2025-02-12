import React, { useState , useEffect} from 'react';
import TopDescription from './TopDescription';
import Strength from './Strength';
import Process from './Process';
import { useSelector } from 'react-redux';

const index = () => {

  const { user } = useSelector(state => state.user);

  const [display, setDisplay] = useState(false);
  useEffect(() => {
    if (user?.date_profile_finished) {
      setDisplay(true)
    }
  }, [user?.date_profile_finished, display])

  return (
    <div className={`${display ? "mt-[--navbar-height]" : "mt-0"} w-full`}>
      <div className='max-w-[32rem] container mx-auto'>
        <div className='flex justify-center mb-3 flex-col'>
          <TopDescription />
          <Strength />
          <Process />
        </div>
      </div>
    </div>
  );
};

export default index;
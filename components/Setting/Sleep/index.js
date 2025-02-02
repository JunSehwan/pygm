import React, { useEffect } from 'react';
import GoBack from 'components/Common/GoBack';
import Main from './Main';
import toast, { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSleep, updateUserSleepDoneFalse } from 'slices/user';

const index = () => {
  // const updateSleepToast = () => toast('휴면모드 상태변경 완료!');
  // const { user, updateUserSleepDone } = useSelector(state => state.user);
  // const dispatch = useDispatch();

  // useEffect(() => {
  //   if (updateUserSleepDone) {

  //     updateSleepToast();
  //     dispatch(updateUserSleepDoneFalse());
  //   }
  // }, [dispatch, updateUserSleepDone])

  return (
    <>
      <div className='flex h-[100vh] w-full'>
        <div className='mx-auto w-full max-w-[420px]'>
          <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
            <GoBack />
            <Main />
          </div>
        </div>
      </div>
      <Toaster
        position='bottom-center'
        toastOptions={{
          //   className: '',
          style: {
            // border: '1px solid #713200',
            // padding: '16px',
            color: 'white',
            background: 'rgba(0,0,0,0.76)'
          },
        }}
      />
    </>
  );
};

export default index;
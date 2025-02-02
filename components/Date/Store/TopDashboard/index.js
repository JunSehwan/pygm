import React, { useCallback } from 'react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';

const index = () => {

  const router = useRouter();
  const { user } = useSelector(state => state.user);

  const onClickPolicy = useCallback(() => {
    router.push("/policy/date/wink");
  }, [router])


  return (
    <div className='w-full bg-slate-100 rounded-lg my-2 shadow-sm p-4 mt-[--navbar-height]'>
      <h1 className='w-full flex flex-row my-2 py-2 text-xl font-bold'>
        {user?.username}님 반갑습니다!
      </h1>
      <span
        className='flex border-solid border border-1 border-pink-600 flex-row gap-3 items-center justify-start rounded-md bg-pink-100 py-3 px-3 shadow-sm'
      >
        <Image
          alt="wink_image"
          className="object-cover"
          unoptimized
          width={40}
          height={40}
          src="/image/icon/wink.png" />
        <span className=''>
          {/* <span className='text-sm text-pink-600'>윙크&nbsp;</span> */}
          <span className='text-md text-pink-600'>보유 윙크개수 : {user?.wink ? user?.wink : 0}개</span>
        </span>
      </span>

      <div
        className='text-md leading-6 text-gray-600 p-3 rounded-lg bg-white shadow-sm my-3'>
        새로운 만남을 위해 윙크를 구매하세요!<br />
        매칭에 실패하면 보냈던 <span className='text-pink-600'>윙크를 100% 돌려드려요!</span>
      </div>
      <div className='w-full flex justify-end'>
        <button
          className='py-2 px-2 rounded-md bg-white text-gray-500 text-sm font-normal
        hover:bg-gray-200 border-solid border border-1 border-gray-300
        '
          onClick={onClickPolicy}>
          윙크 사용 및 환불정보 바로가기
        </button>
      </div>
    </div>
  );
};

export default index;
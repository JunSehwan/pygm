import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import WinkBuyModal from './WinkBuyModal';
import { send_message } from 'firebaseConfig';

const index = () => {

  const router = useRouter();
  const { user } = useSelector(state => state.user);
  const [winks, setWinks] = useState(0);
  const [openBuyModal, setOpenBuyModal] = useState(false);
  const BuyModalOpen = useCallback(() => {
    setOpenBuyModal(true)
  }, [])
  const BuyModalClose = useCallback(() => {
    setOpenBuyModal(false)
  }, [])

  const goBuyFive = useCallback(async () => {

    setWinks(5);
    BuyModalOpen();
  }, [BuyModalOpen])

  const goBuyThree = useCallback(() => {
    setWinks(3);
    BuyModalOpen();
  }, [BuyModalOpen])
  const goBuyOne = useCallback(() => {
    setWinks(1);
    BuyModalOpen();
  }, [BuyModalOpen])

  const onLike = useCallback(async () => {
    if (winks === 5) {
      // 파이어베이스 5개 문자보내기
      // 그 다음에 모달 닫기
      const result = await send_message("01075781252");
      console.log(result, "결과값");
      return
    } if (winks === 3) {
      // 파이어베이스 3개 문자보내기
      // 그 다음에 모달 닫기
      return
    } if (winks === 1) {

      return
    }
  }, [winks])

  return (
    <>
      <div className='w-full bg-slate-100 rounded-lg my-2 shadow-sm p-3'>
        <div className='text-md leading-6 text-gray-600 rounded-lg shadow-sm my-3'>
          <button
            className='w-full rounded-lg hover:bg-pink-50 p-4 my-2 bg-white hover:shadow-none shadow-md'
            onClick={goBuyFive}
          >
            {/* 첫줄 */}
            <div className='w-full flex flex-row justify-between items-center'>
              <div className='text-left w-full text-md font-normal text-slate-500'>
                [초특가 상품 1]<br />
                <div className='text-left w-full text-xl font-bold text-slate-700'>
                  윙크 5개 꾸러미구매
                </div>
              </div>
              <div className='flex flex-row items-center justify-end gap-[-4px]'>
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
              </div>
            </div>

            {/* 두번째줄 */}
            <div className='mt-3'>
              <div className='w-full flex flex-row items-center justify-start gap-2'>
                <span className='text-md text-gray-400 line-through'>417,000원</span>
                <span className='text-xl text-slate-800'>125,000원</span>
              </div>
              <div className='w-full py-2 flex flex-row items-center justify-start gap-2'>
                <span className='text-md text-pink-600'>70% 대폭할인</span>
              </div>
              <div className='border border-solid border-t-1 border-gray-200 h-0 '></div>
              <div className='w-full flex justify-end mt-2'>
                <span className='text-xl text-blue-800 font-bold'>개당 25,000원</span>
              </div>
            </div>
          </button>


          <button
            className='w-full rounded-lg hover:bg-pink-50 p-4 my-2 bg-white hover:shadow-none shadow-md'
            onClick={goBuyThree}
          >
            {/* 첫줄 */}
            <div className='w-full flex flex-row justify-between items-center'>
              <div className='text-left w-full text-md font-normal text-slate-500'>
                [초특가 상품 2]<br />
                <div className='text-left w-full text-xl font-bold text-slate-700'>
                  윙크 3개 꾸러미구매
                </div>
              </div>
              <div className='flex flex-row items-center justify-end gap-[-4px]'>
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />
                <Image
                  alt="wink_image"
                  className="object-cover mr-[-6px]"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />

              </div>
            </div>

            {/* 두번째줄 */}
            <div className='mt-3'>
              <div className='w-full flex flex-row items-center justify-start gap-2'>
                <span className='text-md text-gray-400 line-through'>225,000원</span>
                <span className='text-xl text-slate-800'>90,000원</span>
              </div>
              <div className='w-full py-2 flex flex-row items-center justify-start gap-2'>
                <span className='text-md text-pink-600'>60% 대폭할인</span>
              </div>
              <div className='border border-solid border-t-1 border-gray-200 h-0 '></div>
              <div className='w-full flex justify-end mt-2'>
                <span className='text-xl text-blue-800 font-bold'>개당 30,000원</span>
              </div>
            </div>
          </button>

          <button
            className='w-full rounded-lg hover:bg-pink-50 p-4 my-2 bg-white hover:shadow-none shadow-md'
            onClick={goBuyOne}
          >
            {/* 첫줄 */}
            <div className='w-full flex flex-row justify-between items-center'>
              <div className='text-left w-full text-md font-normal text-slate-500'>
                [초특가 상품 3]<br />
                <div className='text-left w-full text-xl font-bold text-slate-700'>
                  윙크 1개 단일구매
                </div>
              </div>
              <div className='flex flex-row items-center justify-end gap-[-4px]'>
                <Image
                  alt="wink_image"
                  className="object-cover"
                  unoptimized
                  width={24}
                  height={24}
                  src="/image/icon/wink.png" />

              </div>
            </div>

            {/* 두번째줄 */}
            <div className='mt-3'>
              <div className='w-full flex flex-row items-center justify-start gap-2'>
                <span className='text-md text-gray-400 line-through'>70,000원</span>
                <span className='text-xl text-slate-800'>35,000원</span>
              </div>
              <div className='w-full py-2 flex flex-row items-center justify-start gap-2'>
                <span className='text-md text-pink-600'>50% 대폭할인</span>
              </div>
              <div className='border border-solid border-t-1 border-gray-200 h-0 '></div>
              <div className='w-full flex justify-end mt-2'>
                <span className='text-xl text-blue-800 font-bold'>개당 35,000원</span>
              </div>
            </div>
          </button>
        </div>

      </div>

      <WinkBuyModal
        onClose={BuyModalClose}
        title={`윙크를 ${winks}개 구매하시겠습니까?`}
        visible={openBuyModal}
        winks={winks}
        onLike={onLike}
      />
    </>
  );
};

export default index;
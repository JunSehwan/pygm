import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { FaStar, FaHeart } from "react-icons/fa";
import Rating from 'react-rating';
import { addDateRating } from 'firebaseConfig';
import { plusDateRating } from 'slices/daterating';
import Image from 'next/image';

const index = () => {
  const { user, friend } = useSelector((state) => state.user);
  const { MyRatingList } = useSelector((state) => state.daterating);
  const dispatch = useDispatch();
  const router = useRouter();

  const findReceive = useCallback((element) => {
    if (element?.receiverID === friend?.id) {
      return true;
    }
  }, [friend?.id])

  const dubCheck = MyRatingList?.some(findReceive);

  useEffect(() => {
    setFinish(dubCheck);
  }, [dubCheck, friend, user, MyRatingList])

  const [currentRating, setCurrentRating] = useState(3);
  const [finish, setFinish] = useState(dubCheck);

  const handleRatingChange = useCallback(async (event) => {
    setCurrentRating(event); // Update current rating
    const result = await addDateRating(
      friend?.id, friend?.username, currentRating
    )
    dispatch(plusDateRating(result));
    setFinish(true);
  }, [dispatch, friend?.id, friend?.username, currentRating])




  return (
    <>
      <div className='w-full mb-2 flex flex-col items-center'>
        <div className='p-3 rounded-lg w-full bg-blue-50 shadow-md border border-solid border-slate-100 flex flex-col items-center text-left'>
          <h2 className='w-full pt-2 text-lg text-blue-600'>{friend?.nickname}님의 성향과 가치관이 나와 맞나요?</h2>
          <p className='w-full text-sm text-gray-400 pb-2'>익명의 선호도조사로써 상대방은 누가 평가했는지 전혀 몰라요!</p>

          {!finish ?
            <div className='w-full flex flex-row justify-start items-center my-1'>
              <div className="flex items-center mb-4 justify-center w-full">
                <Rating
                  // onChange={(rate) => handleRatingChange(rate)}
                  onChange={handleRatingChange}
                  value={currentRating}
                  emptySymbol={
                    <Image
                      className="w-10 h-10 icon"
                      alt="stars"
                      width="0"
                      height="0"
                      sizes="100vw"
                      unoptimized
                      src="/image/icon/gray_star.png" />}
                  fullSymbol={
                    <Image
                      className="w-10 h-10 icon"
                      alt="stars"
                      width="0"
                      height="0"
                      sizes="100vw"
                      unoptimized
                      src="/image/icon/star.png" />}
                />
              </div>
            </div>
            :
            (<div className='w-full flex flex-col justify-center bg-white rounded-md shadow-inner py-3'>
              <span className='text-lg font-bold text-slate-700 text-center'>평가완료!</span>
            </div>)}
        </div>
      </div>


    </>
  );
};

export default index;
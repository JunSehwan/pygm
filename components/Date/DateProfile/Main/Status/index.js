import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateHobby } from 'firebaseConfig';
import { patchHobby, patchHobbyFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import { FaFingerprint } from "react-icons/fa";
import { FaRegSave } from "react-icons/fa";
import { FaRegQuestionCircle } from "react-icons/fa";
import styled, { css, keyframes } from 'styled-components';
import Rating from 'react-rating';


const ProgressBar = styled.div`
  width: ${(props) => props.width || 0};
`

const index = () => {

  const { user } = useSelector(state => state.user);
  const { RatingToMeList } = useSelector(state => state.daterating);
  const dispatch = useDispatch();


  const results = RatingToMeList?.map((item) => (item.rate))
  const result = results?.reduce(function add(sum, currValue) {
    return sum + currValue;
  }, 0);
  const average = result / results?.length;

  const widthLength = useCallback((number) => {
    return (results?.filter(element => number == element)?.length * 100 / results?.length)
  }, [results])

  return (
    <>
      {RatingToMeList?.length >= 2 ?
        <div className='pt-3 mx-auto px-2'>
          <div className="rounded-md bg-slate-50 shadow w-full p-3">
            <p className='my-1 text-gray-700 text-[1.2rem] leading-8 font-bold'>
              📊 성향선호 REPORT
            </p>
            <p className='text-sm text-gray-500 my-3'>
              이성과 가치관, 성향이 잘 맞는지 간단하게 확인해보세요.<br />
              내 프로필을 확인한 상대병이 주는 평균치지만<br />
              비공개 정보이며 매칭에 영향은 없으니,
              {/* 나와 맞는 이성 한 명만 나와 잘 맞으면 되는거니, */}
              참고만 해주세요!
            </p>
            <section className=''>
              <div className="flex items-center mb-2 gap-2 w-full flex-row">
                {/* <Rating
                // onChange={(rate) => handleRatingChange(rate)}
                placeholderRating={average || 0}
                fractions={2}
                readonly
                emptySymbol={<img className="w-10 h-10 icon" src="/image/icon/gray_star.png" />}
                fullSymbol={<img className="w-10 h-10 icon" src="/image/icon/star.png" />}
                placeholderSymbol={<img className="w-10 h-10 icon" src="/image/icon/star.png" />}
              /> */}
                <div className='flex flex-row items-center'>
                  <p className="ms-1 text-lg font-bold text-blue-600 dark:text-gray-400">{average}점</p>
                  <p className="ms-1 text-md font-medium text-gray-400 dark:text-gray-400"> / 5점 만점</p>
                </div>
              </div>
              {/* <p className="text-sm font-medium text-gray-500 dark:text-gray-400">1,745 global ratings</p> */}
              <div className="flex items-center mt-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">5 star</div>
                <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded-sm dark:bg-gray-700">
                  <ProgressBar width={`${widthLength(5)}%`} className={`h-5 bg-yellow-300 rounded-sm w-[${widthLength(5)}%]`}></ProgressBar>
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {(results?.filter(element => 5 == element)?.length) * 100 / results?.length || 0}%</div>
              </div>
              <div className="flex items-center mt-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">4 star</div>
                <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded-sm dark:bg-gray-700">
                  <ProgressBar width={`${widthLength(4)}%`} className={`h-5 bg-yellow-300 rounded-sm w-[${widthLength(4)}%]`}></ProgressBar>
                </div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {(results?.filter(element => 4 == element)?.length) * 100 / results?.length || 0}%</div>
              </div>
              <div className="flex items-center mt-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">3 star</div>
                <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded-sm dark:bg-gray-700">
                  <ProgressBar width={`${widthLength(3)}%`} className={`h-5 bg-yellow-300 rounded-sm w-[${(results?.filter(element => 3 == element)?.length) * 100 / results?.length || 0}%]`}></ProgressBar>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {(results?.filter(element => 3 == element)?.length) * 100 / results?.length || 0}%</span>
              </div>
              <div className="flex items-center mt-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">2 star</div>
                <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded-sm dark:bg-gray-700">
                  <ProgressBar width={`${widthLength(2)}%`} className={`h-5 bg-yellow-300 rounded-sm w-[${(results?.filter(element => 2 == element)?.length) * 100 / results?.length || 0}%]`}></ProgressBar>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {(results?.filter(element => 2 == element)?.length) * 100 / results?.length || 0}%</span>
              </div>
              <div className="flex items-center mt-4">
                <div className="text-sm font-medium text-blue-600 dark:text-blue-500 hover:underline">1 star</div>
                <div className="w-2/4 h-5 mx-4 bg-gray-200 rounded-sm dark:bg-gray-700">
                  <ProgressBar width={`${widthLength(1)}%`} className={`h-5 bg-yellow-300 rounded-sm w-[${(results?.filter(element => 1 == element)?.length) * 100 / results?.length || 0}%]`}></ProgressBar>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {(results?.filter(element => 1 == element)?.length) * 100 / results?.length || 0}%</span>
              </div>
            </section >
          </div>
        </div>
        : null}
    </>
  );
};

export default index;
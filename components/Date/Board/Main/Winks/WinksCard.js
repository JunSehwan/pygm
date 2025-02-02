import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Image from 'next/image';
import Spin from 'components/Common/Spin';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import dayjs from "dayjs";

const WinksCard = ({ friend, sido, sigugunList }) => {

  const { user } = useSelector(state => state.user);
  const router = useRouter();
  const resultArr = [];
  // const sigugunFunc = useCallback(() => {
  sigugunList?.map((v) => {
    v?.sido == friend?.address_sido ? resultArr?.push(v) : null
  }, [friend?.address_sido])

  const [defaultSido] = sido?.filter((item) => item?.sido == friend?.address_sido, [])
  const [defaultSigugun] = sigugunList?.filter((item) => item?.sido == friend?.address_sido && item?.sigugun == friend?.address_sigugun, [])

  const goDetail = useCallback(() => {
    if (user) {
      router.push({
        pathname: `/date/cards/${friend?.userID}`,
      });
    } else {
      router.push("/")
    }
  }, [])

  let today = dayjs();
  let expiredDay = dayjs(friend?.startAt).add(7, 'day');
  let gap = Math.ceil(expiredDay?.diff(today, "day", true));
  return (
    <>
      {gap >= 0 &&
        <button
          className='rounded-lg border border-solid border-gray-300 w-full shadow-lg hover:bg-slate-100'
          onClick={goDetail}
        >
          <section className='w-full relative'>
            {/* {loading && <Spin />} */}
            <Image
              className='object-cover w-[200px] h-[200px] rounded-t-lg'
              alt="thumbimage"
              unoptimized
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              width="0"
              height="0"
              sizes="100vw"
              loader={() => friend?.thumbimage?.[0]}
              src={friend?.thumbimage?.[0] || friend?.thumbimage?.[1] || friend?.thumbimage?.[2] || ""}>
            </Image>
            <span className='absolute top-2 right-2 rounded-full px-3 py-1 bg-gray-800/50 text-md font-bold text-white'>D-{Math.ceil(expiredDay?.diff(today, "day", true))}일</span>
          </section>
          <section className='p-2 text-left'>
            <div className='w-full flex flex-col'>
              <span className='text-md font-bold text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]'>
                {friend?.nickname}</span>
              <div className='w-full py-1'>
                <span className='text-gray-500 font-normal text-sm'>{friend?.birthday.year}년생</span>
                <div className='w-full font-normal text-sm text-gray-400'>
                  {(() => {
                    switch (friend?.job) {
                      case '1': return (<span className="">대기업</span>)
                      case '2': return (<span className="">중견기업</span>)
                      case '3': return (<span className="">공기업</span>)
                      case '4': return (<span className="">공무원</span>)
                      case '5': return (<span className="">공공기관</span>)
                      case '6': return (<span className="">외국계</span>)
                      case '7': return (<span className="">전문직</span>)
                      case '8': return (<span className="">금융권</span>)
                      case '9': return (<span className="">교육계</span>)
                      case '10': return (<span className="">프리랜서</span>)
                      case '11': return (<span className="">사업가</span>)
                      case '12': return (<span className="">기타</span>)
                      default: null;
                    }
                  })(friend?.job)}
                </div>
              </div>
            </div>
            <p className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-center text-white bg-[--pygm-five] hover:bg-slate-800 focus:ring-4 focus:outline-none focus:ring-slate-300 dark:bg-slate-200 dark:hover:bg-slate-300 dark:focus:ring-slate-400 dark:text-black">
              <span className="">{(() => {
                switch (friend?.address_sido) {
                  case '11': return (<span className="">서울특별시</span>)
                  case '26': return (<span className="">부산광역시</span>)
                  case '27': return (<span className="">대구광역시</span>)
                  case '28': return (<span className="">인천광역시</span>)
                  case '29': return (<span className="">광주광역시</span>)
                  case '30': return (<span className="">대전광역시</span>)
                  case '31': return (<span className="">울산광역시</span>)
                  case '36': return (<span className="">세종특별자치시</span>)
                  case '41': return (<span className="">경기도</span>)
                  case '42': return (<span className="">강원도</span>)
                  case '43': return (<span className="">충청북도</span>)
                  case '44': return (<span className="">충청남도</span>)
                  case '45': return (<span className="">전라북도</span>)
                  case '46': return (<span className="">전라남도</span>)
                  case '47': return (<span className="">경상북도</span>)
                  case '48': return (<span className="">경상남도</span>)
                  case '50': return (<span className="">제주특별자치도</span>)
                  default: null;
                }
              })(friend?.address_sido)}</span>
              <span className='pl-2 '>{defaultSigugun?.codeNm}</span>
            </p>
          </section>
        </button>
      }
    </>
  );
};

WinksCard.propTypes = {
  friend: PropTypes.object.isRequired,
  sido: PropTypes.arrayOf.isRequired,
  sigugunList: PropTypes.arrayOf.isRequired,
};


export default WinksCard;
import Image from 'next/image';
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import dayjs from "dayjs";

const index = () => {

  const { friend } = useSelector(state => state.user);
  const [current, setCurrent] = useState(0);
  const length = friend?.thumbimage?.length;
  const onNext = useCallback(() => {
    setCurrent(current === length - 1 ? 0 : current + 1);
  }, [current, length])

  const onPrevious = useCallback(() => {
    setCurrent(current === 0 ? length - 1 : current - 1);
  }, [current, length])
  const onNumberImage = useCallback((index) => {
    setCurrent(index);
  }, [])

  let today = dayjs();
  let expiredDay = dayjs(friend?.expired);


  return (
    <div id="indicators-carousel" className="relative w-full" data-carousel="static">
      <div className="relative overflow-hidden rounded-lg h-[420px]">
        {friend && friend?.thumbimage?.length !== 0 && friend?.thumbimage?.map((v, index) => (
          <div key={index + 1}>
            <div
              className={
                index === current ?
                  "transition-all duration-700 ease-in-out" :
                  "transition-all hidden duration-700 ease-in-out"
              }
              data-carousel-item="active" key={index + 1}>
              <Image
                src={friend?.thumbimage?.[index]}
                unoptimized
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                width="0"
                height="0"
                sizes="100vw"
                loader={() => friend?.thumbimage?.[index]}
                className="absolute block w-full h-full object-cover transition-all
              -translate-x-1/2 -translate-y-1/2 ease-in-out top-1/2 left-1/2"
                alt="프로필사진" />
            </div>
            <span className='absolute top-4 right-4 rounded-full px-4 py-2 shadow-md bg-black/50 text-md font-semibold text-white'>D-{Math.ceil(expiredDay?.diff(today, "day", true))}일</span>
          </div>
        ))}
      </div>
      <div className="transition-all ease-in-out absolute z-30 flex -translate-x-1/2 space-x-3 rtl:space-x-reverse bottom-5 left-1/2">
        {friend && friend?.thumbimage?.length !== 0 && friend?.thumbimage?.map((v, index) => (
          <button type="button"
            key={index + 1}
            onClick={() => onNumberImage(index)}
            value={index}
            className=
            {
              index === current ?
                "w-3 h-3 bg-sky-600 hover:bg-slate-500 rounded-full" :
                "w-3 h-3 bg-white hover:bg-gray-200 rounded-full"
            }
            aria-current="true" aria-label={`slide ${index + 1}`}>
          </button>
        ))}
      </div>

      <button
        onClick={onPrevious}
        type="button"
        className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        data-carousel-prev>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
          <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
          </svg>
          <span className="sr-only">Previous</span>
        </span>
      </button>
      <button
        onClick={onNext}
        type="button"
        className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        data-carousel-next>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
          <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
          </svg>
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div >
  );
};

export default index;
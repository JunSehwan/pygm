import Image from 'next/image';
import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { useSwipeable } from 'react-swipeable';
import dayjs from 'dayjs';

const ProtectiveImage = styled(Image)`
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  -moz-user-drag: none;
`;

const Index = () => {
  const { user, friend } = useSelector(state => state.user);
  const [current, setCurrent] = useState(0);
  const length = friend?.thumbimage?.length || 0;

  const onNext = useCallback(() => {
    if (length > 0) setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
  }, [length]);

  const onPrevious = useCallback(() => {
    if (length > 0) setCurrent((prev) => (prev === 0 ? length - 1 : prev - 1));
  }, [length]);

  const onNumberImage = useCallback((index) => setCurrent(index), []);

  // 🔥 Swipe 기능
  const handlers = useSwipeable({
    onSwipedLeft: onNext,
    onSwipedRight: onPrevious,
    preventScrollOnSwipe: true,
    trackMouse: true, // PC에서도 마우스드래그로 가능
  });

  return (
    <div id="indicators-carousel" className="relative w-full" data-carousel="static">
      {/* 스와이프 영역 */}
      <div
        {...handlers}
        className="relative overflow-hidden rounded-lg h-[420px] touch-pan-y select-none"
      >
        {friend?.thumbimage?.map((v, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${index === current
                ? 'opacity-100 translate-x-0 z-20'
                : index < current
                  ? '-translate-x-full opacity-0 z-10'
                  : 'translate-x-full opacity-0 z-10'
              }`}
          >
            <ProtectiveImage
              src={v}
              unoptimized
              loader={() => v}
              alt="프로필사진"
              fill
              className="object-cover transition-transform duration-500"
            />
          </div>
        ))}
      </div>

      {/* 페이지 인디케이터 */}
      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 space-x-3">
        {friend?.thumbimage?.map((_, index) => (
          <button
            key={index}
            onClick={() => onNumberImage(index)}
            className={`w-3 h-3 rounded-full transition-all ${index === current ? 'bg-blue-500 scale-110' : 'bg-white/70'
              }`}
          />
        ))}
      </div>

      {/* 이전/다음 버튼 */}
      <button
        onClick={onPrevious}
        className="absolute top-1/2 left-2 z-30 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full"
      >
        <svg width="10" height="16" viewBox="0 0 6 10" fill="none">
          <path d="M5 1 1 5l4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <button
        onClick={onNext}
        className="absolute top-1/2 right-2 z-30 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full"
      >
        <svg width="10" height="16" viewBox="0 0 6 10" fill="none">
          <path d="m1 9 4-4-4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default Index;

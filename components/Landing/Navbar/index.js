import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useCallback } from 'react';
import logo from '/public/logo/pygm.png';

const index = ({ children }) => {

  // 스크롤 인식, 스타일링
  const [ScrollY, setScrollY] = useState(0); // window? 의 pageYOffset값을 저장 
  const [ScrollActive, setScrollActive] = useState(false);

  function handleScroll() {
    if (ScrollY > 100) {
      setScrollY(window?.pageYOffset);
      setScrollActive(true);
    } else {
      setScrollY(window?.pageYOffset);
      setScrollActive(false);
    }
  }

  useEffect(() => {
    function scrollListener() { window?.addEventListener("scroll", handleScroll); } //  window? 에서 스크롤을 감시 시작
    scrollListener(); // window? 에서 스크롤을 감시
    return () => { window?.removeEventListener("scroll", handleScroll); }; //  window? 에서 스크롤을 감시를 종료
  });

  return (
    <>
      <nav className={`transition-all fixed z-10 bg-white w-full ${ScrollActive === true && "bg-opacity-70 shadow-md backdrop-blur-sm"} `}>
        <div className="mx-auto px-4 sm:px-6">
          <div className={`flex justify-between items-center border-b-1 border-gray-100 py-2 ${ScrollActive === true && "border-0"} justify-start md:space-x-10`}>
            <div className="flex justify-start">
              <Link href="/">
                <div>
                  <span className="sr-only">PYGM</span>
                  <Image
                    src={logo}
                    width={60}
                    alt="logo"
                    height={60}
                    unoptimized
                  />
                </div>
              </Link>
            </div>
            <div className="flex items-center justify-end md:flex-1 lg:w-0"></div>


          </div>
        </div>
      </nav>
      {children}
    </>
  );
};

export default index;
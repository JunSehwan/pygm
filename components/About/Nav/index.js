/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import Link from 'next/link';
import { BiMenuAltRight } from 'react-icons/bi';
import { AiOutlineClose } from 'react-icons/ai';
import { useRouter } from 'next/router';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Header = () => {
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [status, setStatus] = useState(true);
  const menuItems = [
    { name: '피그말리온?', path: '/about', current: router.pathname === "/about" ? true : false },
    { name: '이용약관', path: '/about/Service', current: router.pathname === "/about/Service" ? true : false },
    { name: '개인정보방침', path: '/about/Privacy', current: router.pathname === "/about/Privacy" ? true : false },
  ]
  const changeCurrentStatus = (name) => {
    for (let i = 0; i < menuItems.length; i += 1) {
      if (menuItems[i].name === name) {
        menuItems[i].current = true;
      } else {
        menuItems[i].current = false;
      }
    }
    setStatus(!status);
    setMobileMenu(false);
  };

  return (
    <>
      <header
        className={`flex flex-col z-10 bg-white/90 px-4 py-4 ${mobileMenu ? 'h-fit' : 'h-fit'} fixed top-0 w-full shadow-lg md:flex-row md:justify-between md:px-12 md:h-fit items-center sm:justify-between flex-row`}
      >
        <nav className='flex flex-row justify-between items-center w-full'>
          <Link className="text-xl" href="/about">
            <img className='object-contain w-[52px] h-[52px]' src="/logo/pygm.png" alt="" />
          </Link>
          {/* 모바일 */}
          <div className="text-gray-700 md:hidden mobile-btns">
            <button
              type="button"
              className={classNames(!mobileMenu ? 'block' : 'hidden')}
              onClick={() => setMobileMenu(true)}
            >
              <BiMenuAltRight className="h-6 w-6" />
            </button>
            <button type="button" className={classNames(mobileMenu ? 'block' : 'hidden')} onClick={() => setMobileMenu(false)}>
              <AiOutlineClose className="h-6 w-6" />
            </button>
          </div>
        </nav>

        {/* 데스크탑 */}
        <div className={classNames(mobileMenu ? 'block w-full' : 'hidden', 'md:block w-full')}>
          <ul className="flex flex-col text-center gap-2 items-center md:flex-row w-full">
            {
              menuItems?.map((item) => (
                <li className="whitespace-nowrap w-full py-3" key={item?.name}>
                  <Link href={item?.path} onClick={() => changeCurrentStatus(item?.name)}
                    className={classNames(
                      item?.current
                        ? 'border-b-2 border-gray-700 text-gray-700 pb-1'
                        : 'text-sky-600 w-full',
                      'text-lg hover:text-gray-700 w-full',
                    )}
                    aria-current={item?.current ? 'page' : undefined}
                  >
                    {item?.name}
                  </Link>
                </li>
              ))
            }
          </ul>
        </div>
      </header>
    </>
  );
};

export default Header;
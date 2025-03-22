import Image from 'next/image';
import Link from 'next/link';
import React, { useCallback } from 'react';
import logo from '/public/logo/pygm_white.png';
import { useRouter } from 'next/router';

const index = () => {
  const router = useRouter();
  const onClickSignup = useCallback(() => {
    router.push("/signup")
  }, [router])
  const onClickLogin = useCallback(() => {
    router.push("/login")
  }, [router])

  return (
    <header className="fixed top-0 z-30 w-full">
      <div className="mx-auto w-full">
        <div className="relative flex h-[--navbar-height] items-center justify-between gap-3 bg-black/80 px-4 shadow-lg shadow-black/[0.03] backdrop-blur-sm">
          {/* Site branding */}
          <div className="flex flex-1 items-center">
            <Link href="/">
              <div className='cursor-pointer'>
                <span className="sr-only">PYGM</span>
                <Image
                  src={logo}
                  width={52}
                  alt="logo"
                  height={52}
                  priority
                  unoptimized
                />
              </div>
            </Link>
          </div>

          {/* Desktop sign in links */}
          <ul className="flex flex-1 items-center justify-end gap-3">
            <button
              className='px-3 py-3 text-gray-400 hover:text-white text-md'
              onClick={onClickLogin}
            >
              로그인
            </button>
            <button
              className='px-3 py-3 text-gray-400 hover:text-white text-md'
              onClick={onClickSignup}
            >
              회원가입
            </button>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default index;
// components/Header.js
import Image from 'next/image';
import Link from 'next/link';
import React, { useCallback } from 'react';
import logo from '/public/logo/pygm.png';
import { useRouter } from 'next/router';

const Header = () => {
  const router = useRouter();
  const onClickSignup = useCallback(() => router.push("/signup"), [router]);
  const onClickLogin = useCallback(() => router.push("/login"), [router]);

  return (
    <header className="fixed top-0 z-40 w-full bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3">
              <Image src={logo} width={44} unoptimized height={44} alt="PYGM logo" />
              <span className="text-lg font-bold text-slate-800">Pygmalion</span>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <button
              onClick={onClickLogin}
              className="px-3 py-2 text-sm text-slate-700 hover:text-slate-900"
            >
              로그인
            </button>
            <button
              onClick={onClickSignup}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm shadow hover:bg-blue-700"
            >
              무료로 시작하기
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;

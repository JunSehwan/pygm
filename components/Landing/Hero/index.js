// components/Hero.js
import Image from 'next/image';
import React from 'react';
import HeroImg from '/public/image/landing.png';
import styled from 'styled-components';
import Link from 'next/link';

const Neon = styled.span`
  background: linear-gradient(90deg,#1f8ef1,#7c3aed);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 800;
`;

const Hero = () => {
  return (
    <section className="relative bg-white pt-28 pb-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm text-blue-600 font-semibold mb-3">새로운 방식의 소개팅</p>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              이성과의 만남에 <Neon>Pygmalion</Neon>을 더하다
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              성향, 가치관, MBTI까지 — 매주 3명의 큐레이션으로
              부담 없이 다양한 인연을 경험해보세요. 검증된 회원만 소개합니다.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700">
                지금 무료로 시작하기
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                아이디가 있나요?
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-blue-600 font-bold">✓</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">여성 안심 검증</div>
                  <div className="text-xs text-slate-500">신원·재직 확인</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-orange-500 font-bold">★</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">매칭 보장</div>
                  <div className="text-xs text-slate-500">무제한 소개, 1회 매칭 보장</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="max-w-md w-full bg-gradient-to-b from-white to-slate-50 rounded-2xl p-4">
              <Image src={HeroImg} alt="hero" width={640} height={640} className="rounded-xl" unoptimized />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

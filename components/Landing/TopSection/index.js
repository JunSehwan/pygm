/* eslint-disable @next/next/no-img-element */
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
// import Modal from '../utils/Modal';
import logo from '/public/logo/pygm.png';


const TopSection = () => {

  // const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section className="relative" >
      <div className="hidden md:absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none
      " aria-hidden="true">
        <svg width="1360" height="578" viewBox="0 0 1360 578" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="illustration-01">
              <stop stopColor="#FFF" offset="0%" />
              <stop stopColor="#EAEAEA" offset="77.402%" />
              <stop stopColor="#DFDFDF" offset="100%" />
            </linearGradient>
          </defs>
          <g fill="url(#illustration-01)" fillRule="evenodd">
            <circle cx="1232" cy="128" r="128" />
            <circle cx="155" cy="443" r="64" />
          </g>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-1 sm:px-2">

        <div className="pb-3 md:pt-4 md:pb-2">

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-snug mb-4" data-aos="zoom-y-out">
              가장 자연스럽고<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                재밌는 만남
              </span></h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-l text-gray-600 mb-2" data-aos="zoom-y-out" data-aos-delay="150">
                피그말리온과 함께<br />
                새롭고 소중한 인연을 가장 빠르게 만나보세요
              </p>
              <div className="max-w-xs mx-auto mt-6 sm:max-w-none sm:flex sm:justify-center" data-aos="zoom-y-out" data-aos-delay="300">
                <div className="flex justify-center w-auto">
                  <div className='flex justify-center'>
                    <span className="sr-only">PYGM</span>
                    <Image
                      src={logo}
                      width={120}
                      alt="logo"
                      height={120}
                      unoptimized
                    />
                  </div>
                </div>
                {/* <div>
                  <Link
                    href="/signup">
                    <span className="py-3 px-8 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 w-full mb-4 sm:w-auto sm:mb-0"
                    >
                      무료로 시작하기</span>
                  </Link>
                </div> */}

              </div>
            </div>
          </div>

          {/* <div>
            <div className="relative flex justify-center mb-8" data-aos="zoom-y-out" data-aos-delay="450">
              <div className="flex flex-col justify-center">
                <img className="mx-auto rounded-3xl shadow-2xl" src='/image/screenshot/new_dashboard.png' width="768" height="432" alt="Hero" />
                <svg className="absolute inset-0 max-w-full mx-auto md:max-w-none h-auto" width="768" height="432" viewBox="0 0 768 432" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
                  <defs>
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="hero-ill-a">
                      <stop stopColor="#FFF" offset="0%" />
                      <stop stopColor="#EAEAEA" offset="77.402%" />
                      <stop stopColor="#DFDFDF" offset="100%" />
                    </linearGradient>
                    <linearGradient x1="50%" y1="0%" x2="50%" y2="99.24%" id="hero-ill-b">
                      <stop stopColor="#FFF" offset="0%" />
                      <stop stopColor="#EAEAEA" offset="48.57%" />
                      <stop stopColor="#DFDFDF" stopOpacity="0" offset="100%" />
                    </linearGradient>
                    <radialGradient cx="21.152%" cy="86.063%" fx="21.152%" fy="86.063%" r="79.941%" id="hero-ill-e">
                      <stop stopColor="#4FD1C5" offset="0%" />
                      <stop stopColor="#81E6D9" offset="25.871%" />
                      <stop stopColor="#338CF5" offset="100%" />
                    </radialGradient>
                    <circle id="hero-ill-d" cx="384" cy="216" r="64" />
                  </defs>

                </svg>
              </div>

            </div>



          </div> */}

        </div>

      </div>
    </section>
  )
}

export default TopSection;
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
// import hero from '/public/image/landing_hero.png';
import Hero from '/public/image/landing.png';
import styled from 'styled-components';

const Neon = styled.div`
  color: #fff;
  text-shadow:
      0 0 3px #fff,
      0 0 5px #fff,
      0 0 8px #fff,
      0 0 14px #ffe880,
      0 0 22px #ffe880,
      0 0 24px #8951ff,
      0 0 35px #8951ff,
      0 0 42px #8951ff;

`

const index = () => {
  return (
    <section className="relative bg-black">
      <div className="mx-auto">
        {/* Hero content */}
        <div className="pb-6 pt-24 md:pb-8 md:pt-28">
          {/* Section header */}
          <div className="pb-2 text-center md:pb-3 px-4">
            <div
              className="mb-6 border-y [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]"
              data-aos="zoom-y-out"
            >
            </div>
            <p className='text-xl md:text-3xl text-white'>
              이성과의 만남에 즐거움을 추가하다.
            </p>
            <h1
              className="italic mb-6 border-y text-6xl text-white font-bold [border-image:linear-gradient(to_right,transparent,--theme(--color-slate-300/.8),transparent)1]"
              data-aos="zoom-y-out"
              data-aos-delay={150}
            >
              <Neon>Pygmalion</Neon>
            </h1>
            <div className="mx-auto max-w-3xl">
              <p
                className="mb-8 text-md text-gray-500 md:text-lg"
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                피그말리온은 다양한 요소를 통해 <br />
                이성과의 만남을 좀 더 즐겁게<br />
                주선해주는 문화를 추구합니다.
              </p>

            </div>
          </div>
          {/* Hero image */}
          <div
            className="mx-auto max-w-3xl"
            data-aos="zoom-y-out"
            data-aos-delay={600}
          >
            <div className="relative">
              <div className="relative mb-8 flex w-full items-center justify-center">
                <Image
                  src={Hero}
                  className='rounded-full mt-[-22px]'
                  width={0}
                  height={0}
                  sizes="80vw"
                  style={{ width: '50%', height: 'auto' }}
                  alt="hero"
                  priority
                  unoptimized
                />


              </div>
            </div>
          </div>
        </div>
      </div>
              
    </section>
  );
};

export default index;
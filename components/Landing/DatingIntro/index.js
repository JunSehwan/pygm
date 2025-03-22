import React, { useCallback } from 'react';
import Cards from '/public/image/datecards.png';
import Image from 'next/image';
import { useRouter } from 'next/router';

const index = () => {
  const router = useRouter();
  const goSignup = useCallback(() => {
    router.push("/signup")
  }, [router])
  const goLogin = useCallback(() => {
    router.push("/login")
  }, [router])



  return (
    <section className='bg-[#161617] w-full relative'>
      <div className='mx-auto'>
        <div className="py-2 md:py-4 w-full mx-auto flex items-center justify-center">
          <div className="py-6 md:py-10 max-w-[860px] w-full mx-6 rounded-lg text-center px-3 md:px-8 ">
            <div className='flex flex-col md:flex-row justify-between items-center'>
              <div className='flex flex-col items-center text-left'>
                <div
                  className="mb-6"
                  data-aos="zoom-y-out"
                >
                  <p className='text-white font-bold text-2xl md:text-4xl w-full'>
                    피그말리온 올인원 소개팅!
                  </p>
                </div>
                <div className="w-full">
                  <p
                    className="text-md text-gray-500 md:text-lg pb-6 md:pb-0"
                    data-aos="zoom-y-out"
                    data-aos-delay={300}
                  >
                    간단하게 흥미로운 질문에 답하고,<br />
                    이성의 생각과 라이프스타일을<br />
                    디테일하게 확인할 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="relative flex items-center justify-center
            w-[240px] h-[240px] overflow-hidden rounded-lg 
            "
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                <Image
                  src={Cards}
                  className='rounded-lg'
                  width={320}
                  height={320}
                  // sizes="30vw"
                  // style={{ width: '50%', height: 'auto' }}
                  alt="hero"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div
              data-aos="zoom-y-out"
              data-aos-delay={300}
              className='w-full mt-4 border-solid border-t-[2px] border-white/50 '></div>
            <div className='w-full pt-6'>
              <div className='flex flex-row justify-center gap-3'
                data-aos="zoom-y-out"
                data-aos-delay={300}
              >
                <button
                  className='px-5 py-2 bg-transparent border-solid border-[1px] border-white text-white rounded-lg text-lg hover:bg-gray-300 hover:text-black'
                  onClick={goLogin}
                >
                  로그인
                </button>
                <button
                  className='px-5 py-2 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-800'
                  onClick={goSignup}
                >
                  바로 시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default index;
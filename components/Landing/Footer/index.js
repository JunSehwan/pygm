import React, { useCallback } from 'react';
import Cards from '/public/image/datecards.png';
import Image from 'next/image';
import { useRouter } from 'next/router';
import logo from '/public/logo/pygm_white.png';
import { SiKakaotalk } from "react-icons/si";
import { IoIosCafe } from "react-icons/io";

const index = () => {
  const router = useRouter();
  const goSignup = useCallback(() => {
    router.push("/signup")
  }, [router])
  const goLogin = useCallback(() => {
    router.push("/login")
  }, [router])
  const onClickDetail = useCallback(() => {
    window?.open('/about', '_blank')
  }, [router])



  return (
    <section className='bg-[#161617] w-full relative'>
      <div className='mx-auto px-4 md:px-12'>
        <footer className="bg-primary-dark-blue py-10">
          <div className="container">
            <div className="text-center grid grid-cols-1 justify-items-center gap-6 lg:grid-cols-12 lg:gap-0">
              <div className="flex flex-col justify-between lg:justify-self-start lg:col-span-3">
                <Image
                  src={logo}
                  width={52}
                  alt="logo"
                  height={52}
                  priority
                  unoptimized
                />
                <div className="flex justify-between gap-2 items-center">
                  <a href="https://www.facebook.com/pygmluv"
                    target='_blank'
                  >
                    <svg
                      className="text-gray-300 hover:text-gray-500 fill-current cursor-pointer w-[20px] h-[20px]"
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                    >
                      <title>Facebook</title>
                      <path d="M18.896 0H1.104C.494 0 0 .494 0 1.104v17.793C0 19.506.494 20 1.104 20h9.58v-7.745H8.076V9.237h2.606V7.01c0-2.583 1.578-3.99 3.883-3.99 1.104 0 2.052.082 2.329.119v2.7h-1.598c-1.254 0-1.496.597-1.496 1.47v1.928h2.989l-.39 3.018h-2.6V20h5.098c.608 0 1.102-.494 1.102-1.104V1.104C20 .494 19.506 0 18.896 0z" />
                    </svg>
                  </a>
                  <a href="https://open.kakao.com/o/sAJwMNCe"
                    target='_blank'
                  >
                    <SiKakaotalk
                      className="text-gray-300 hover:text-gray-500 fill-current cursor-pointer w-[20px] h-[20px]"
                      width={20}
                      height={20}
                    >
                      <title>Kakaotalk</title>
                      <path d="M10 0C4.478 0 0 4.477 0 10c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.545 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.522 0 10-4.477 10-10S15.522 0 10 0z" />
                    </SiKakaotalk>
                  </a>
                  <a href="https://www.instagram.com/pygmalion.luv"
                    target='_blank'
                  >
                    <svg
                      className="text-gray-300 hover:text-gray-500 fill-current cursor-pointer w-[20px] h-[20px]"
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={20}
                    >
                      <title>Instagram</title>
                      <path d="M10.333 1.802c2.67 0 2.987.01 4.042.059 2.71.123 3.976 1.409 4.1 4.099.048 1.054.057 1.37.057 4.04 0 2.672-.01 2.988-.058 4.042-.124 2.687-1.386 3.975-4.099 4.099-1.055.048-1.37.058-4.042.058-2.67 0-2.986-.01-4.04-.058-2.717-.124-3.976-1.416-4.1-4.1-.048-1.054-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.124-2.69 1.387-3.977 4.1-4.1 1.054-.048 1.37-.058 4.04-.058zm0-1.802C7.618 0 7.278.012 6.211.06 2.579.227.56 2.242.394 5.877.345 6.944.334 7.284.334 10s.011 3.057.06 4.123c.166 3.632 2.181 5.65 5.816 5.817 1.068.048 1.408.06 4.123.06 2.716 0 3.057-.012 4.124-.06 3.628-.167 5.651-2.182 5.816-5.817.049-1.066.06-1.407.06-4.123s-.011-3.056-.06-4.122C20.11 2.249 18.093.228 14.458.06 13.39.01 13.049 0 10.333 0zm0 4.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.339-9.87a1.2 1.2 0 10-.001 2.4 1.2 1.2 0 000-2.4z" />
                    </svg>
                  </a>
                  <a href="https://cafe.naver.com/pygm"
                    target='_blank'
                  >
                    <IoIosCafe
                      className="text-gray-300 hover:text-gray-500 fill-current cursor-pointer w-[20px] h-[20px]"
                      width={20}
                      height={20}
                    >
                      <title>NaverCafe</title>
                      <path d="M10 0C4.478 0 0 4.477 0 10c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.852 0 1.264.64 1.264 1.408 0 .858-.545 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.223-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.525-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.522 0 10-4.477 10-10S15.522 0 10 0z" />
                    </IoIosCafe>
                  </a>
                  {/* <svg
                    className="text-white hover:text-gray-400 fill-current cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="20"
                  >
                    <title>Youtube</title>
                    <path d="M10.333 0c-5.522 0-10 4.478-10 10 0 5.523 4.478 10 10 10 5.523 0 10-4.477 10-10 0-5.522-4.477-10-10-10zm3.701 14.077c-1.752.12-5.653.12-7.402 0C4.735 13.947 4.514 13.018 4.5 10c.014-3.024.237-3.947 2.132-4.077 1.749-.12 5.651-.12 7.402 0 1.898.13 2.118 1.059 2.133 4.077-.015 3.024-.238 3.947-2.133 4.077zM8.667 8.048l4.097 1.949-4.097 1.955V8.048z" />
                  </svg> */}
                  {/* <svg
                    className="text-white hover:text-gray-400 fill-current cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="18"
                  >
                    <title>Twitter</title>
                    <path d="M20.667 2.797a8.192 8.192 0 01-2.357.646 4.11 4.11 0 001.804-2.27 8.22 8.22 0 01-2.606.996A4.096 4.096 0 0014.513.873c-2.649 0-4.595 2.472-3.997 5.038a11.648 11.648 0 01-8.457-4.287 4.109 4.109 0 001.27 5.478A4.086 4.086 0 011.47 6.59c-.045 1.901 1.317 3.68 3.29 4.075a4.113 4.113 0 01-1.853.07 4.106 4.106 0 003.834 2.85 8.25 8.25 0 01-6.075 1.7 11.616 11.616 0 006.29 1.843c7.618 0 11.922-6.434 11.662-12.205a8.354 8.354 0 002.048-2.124z" />
                  </svg> */}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 py-1 lg:grid-rows-3 text-gray-300 text-sm lg:text-left lg:justify-self-start lg:col-span-5 lg:gap-x-24 lg:grid-flow-col-dense">
                <a className="hover:text-white text-gray-400" href="/about"
                  target='_blank'>
                  About Us
                </a>
                <a className="hover:text-white text-gray-400" href="mailto:admin@pygm.co.kr"
                  target='_blank'>
                  Contact
                </a>
                <a className="hover:text-white text-gray-400" href="https://papillon87.tistory.com/"
                  target='_blank'>
                  Blog
                </a>
                {/* <a className="hover:text-white text-gray-400" href="/about"
                target='_blank'>
                  Careers
                </a> */}
                <a className="hover:text-white text-gray-400" href="/about/Service"
                  target='_blank'>
                  Service Policy
                </a>
                <a className="hover:text-white text-gray-400" href="/about/Privacy"
                  target='_blank'>
                  Privacy Policy
                </a>
              </div>

              <div className="flex flex-col justify-between items-center lg:items-end lg:justify-self-end lg:col-span-4">
                <button
                  className="hover:bg-gray-300 hover:text-black border border-solid border-white px-7 py-3 rounded-full text-neutral-white text-xs text-white mb-7 focus:outline-none focus:ring ring-gray-400"
                  onClick={onClickDetail}
                >
                  서비스정보 더보기
                </button>

                <p className="text-sm text-gray-400">
                  © Nextpus. All Rights Reserved
                </p>
                <p className="text-sm text-gray-400">
                  사업자등록번호 : 755-55-00702 || 대표자명 : 전세환
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default index;
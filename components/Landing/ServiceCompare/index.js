import React, { useCallback } from 'react';
import Cards from '/public/image/datecards.png';
import Image from 'next/image';
import ServiceCard from './ServiceCard';

const index = () => {




  return (
    <section className='bg-black w-full relative'>
      <div className='mx-auto'>
        <div className="pb-6 py-6 md:py-14 w-full mx-auto flex flex-col items-center justify-center">
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='flex flex-col items-center'>
              <div
                className="mb-6 text-center px-4"
                data-aos="zoom-y-out"
              >
                <p className='text-transparent bg-clip-text bg-gradient-to-b from-white to-sky-400/30 font-bold text-2xl md:text-4xl w-full'>
                 가장 효율적이고, 효과적인 서비스를 선택하세요.
                </p>
              </div>
              <div className="w-full text-center px-4">
                <p
                  className="text-md text-gray-300 md:text-lg pb-6 md:pb-0"
                  data-aos="zoom-y-out"
                  data-aos-delay={300}
                >
                  가격 부담없이!<br />
                  좀 더 신중한 만남을!<br />
                </p>
              </div>
            </div>
          </div>
          <div className='w-full flex md:flex-row flex-auto flex-col py-6 gap-3 items-center justify-center px-4'>
            <ServiceCard
              subject="피그말리온 올인원 소개팅"
              price="0원"
              introduce_fee="0원"
              matching_fee={<><span className='line-through'>25,000원</span>&nbsp; ➔ 0원</>}
              main_service="성향진단, 신원검증, 무제한 소개 등"
              ourService={true}
            />
            <ServiceCard 
              subject="결혼정보회사"
              price="200~500만원"
              introduce_fee="50만원/건"
              matching_fee={<span>업체별 상이</span>}
              main_service="신원검증, 만남까지 서비스"
              ourService={false}
            />
            <ServiceCard 
              subject="타소개팅 서비스"
              price="6~12만원"
              introduce_fee="5~10만원/건"
              matching_fee="1만원 이상"
              main_service="소개진행"
              ourService={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default index;
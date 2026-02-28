import React from 'react';
const index = () => {

  return (
    <section className="relative py-20 bg-white text-center text-black">
      <h2 className="text-3xl font-bold mb-6" data-aos="fade-up">
        성향과 가치관까지 확인하는
        <p>올인원 소개팅</p>
      </h2>
      {/* <p className="text-gray-300 mb-10" data-aos="fade-up" data-aos-delay="100">
        첫인상 중심의 ‘눈픽 게임’을 통해 이성을 선택하세요.
      </p> */}
      <div className="max-w-[320px] mx-auto" data-aos="zoom-in">
        <div className="aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-lg max-w-[320px]">
          <video className="w-full" autoPlay loop muted controls>
            <source src="/image/service.mov" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>


  )
}
export default index;

// import React from 'react';

// const index = () => {
//   return (
//     <section className='w-full py-6 md:py-16 bg-white'>
//       <div className='w-full flex justify-center'>
//         <div className='max-w-[320px]'
//           data-aos="zoom-y-out"
//           data-aos-delay={300}>
//           <video className="w-full" autoPlay loop muted controls>
//             <source src="/image/service.mov" type="video/mp4" />
//             Your browser does not support the video tag.
//           </video>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default index;
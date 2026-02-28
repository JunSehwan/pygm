import React from 'react';

export default function ServiceCompare() {
  const features = [
    { name: "가치관 매칭", allinone: "✅", another: "❌", other: "❌" },
    { name: "무료소개", allinone: "✅", another: "❌", other: "❌" },
    { name: "신원검증", allinone: "✅", another: "△", other: "✅" },
    { name: "가격", allinone: "5천원", another: "5-10만원", other: "200-500만원" },
  ];

  return (
    <section className="bg-gray-100 py-20 text-gray-600 text-center">
      <h2 className="text-3xl font-bold mb-10" data-aos="fade-up">서비스 비교</h2>
      <div className="overflow-x-auto max-w-4xl mx-auto" data-aos="zoom-in">
        <table className="w-full text-center border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 py-6">항목</th>
              <th className="p-2 py-6 text-blue-500 bg-blue-200">올인원소개팅</th>
              <th className="p-2 py-6">소개팅APP</th>
              <th className="p-2 py-6">결정사</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f, i) => (
              <tr key={i} className="border-b border-gray-700">
                <td className="p-2 py-8">{f.name}</td>
                <td className="p-2 py-8 text-blue-500 bg-blue-100">{f.allinone}</td>
                <td className="p-2 py-8">{f.another}</td>
                <td className="p-2 py-8">{f.other}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


// import React, { useCallback } from 'react';
// import Cards from '/public/image/datecards.png';
// import Image from 'next/image';
// import ServiceCard from './ServiceCard';

// const index = () => {

//   return (
//     <section className='bg-black w-full relative'>
//       <div className='mx-auto'>
//         <div className="pb-6 py-6 md:py-14 w-full mx-auto flex flex-col items-center justify-center">
//           <div className='flex flex-col md:flex-row justify-between items-center'>
//             <div className='flex flex-col items-center'>
//               <div
//                 className="mb-6 text-center px-4"
//                 data-aos="zoom-y-out"
//               >
//                 <p className='text-transparent bg-clip-text bg-gradient-to-b from-white to-sky-400/30 font-bold text-2xl md:text-4xl w-full'>
//                  가장 효율적이고, 효과적인 서비스를 선택하세요.
//                 </p>
//               </div>
//               <div className="w-full text-center px-4">
//                 <p
//                   className="text-md text-gray-300 md:text-lg pb-6 md:pb-0"
//                   data-aos="zoom-y-out"
//                   data-aos-delay={300}
//                 >
//                   가격 부담없이!<br />
//                   좀 더 신중한 만남을!<br />
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className='w-full flex md:flex-row flex-auto flex-col py-6 gap-3 items-center justify-center px-4'>
//             <ServiceCard
//               subject="피그말리온 올인원 소개팅"
//               price="0원"
//               introduce_fee="0원"
//               matching_fee={<><span className='line-through'>25,000원</span>&nbsp; ➔ 0원</>}
//               main_service="성향진단, 신원검증, 무제한 소개 등"
//               ourService={true}
//             />
//             <ServiceCard 
//               subject="결혼정보회사"
//               price="200~500만원"
//               introduce_fee="50만원/건"
//               matching_fee={<span>업체별 상이</span>}
//               main_service="신원검증, 만남까지 서비스"
//               ourService={false}
//             />
//             <ServiceCard 
//               subject="타소개팅 서비스"
//               price="6~12만원"
//               introduce_fee="5~10만원/건"
//               matching_fee="1만원 이상"
//               main_service="소개진행"
//               ourService={false}
//             />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default index;
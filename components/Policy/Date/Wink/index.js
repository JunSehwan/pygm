import React from 'react';
import GoBack from 'components/Common/GoBack';
import { useRouter } from 'next/router'

const index = () => {

  const router = useRouter();

  return (
    <div className='flex h-[100vh] w-full'>
      <div className='mx-auto w-full max-w-[420px]'>
        <div className='w-full pt-[var(--navbar-height)] pb-[70px] md:pb-auto'>
          <GoBack />
          <section className='w-full my-3 p-3 bg-slate-50'>
            <div className='title py-2 font-bold text-2xl text-pink-700'>피그말리온 윙크 사용안내</div>
            <div className='text font-normal text-md text-gray-700 leading-6'>
              <p>피그말리온 데이팅 시스템에서는 마음에 드는 이성과의 매칭을 위해 윙크가 필요합니다.</p>
              <p>순서에 관계 없이 서로 윙크를 보낸 경우 매칭이 성사됩니다.</p>
              <p>그러나 매칭에 실패하면 윙크를 다시금 반환해드립니다.</p>
            </div>
          </section>
          <section className='w-full my-3 p-3 bg-slate-50'>
            <div className='title py-2 font-bold text-2xl text-pink-700'>윙크는 언제 반환되나요?</div>
            <div className='text font-normal text-md text-gray-700 leading-6'>
              <p>이성과 매칭에 실패한다면 반환해드립니다.</p>
              <p>순서에 관계 없이 서로 윙크를 보낸 경우 매칭이 성사됩니다.</p>
              <p>그러나 매칭에 실패하면 윙크를 다시금 반환해드립니다.</p>
              <ul className="max-w-md my-3 space-y-1 text-gray-500 list-inside dark:text-gray-400">
                <li className="flex items-center">
                  <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                  상대방이 내 윙크를 거절하였을 경우
                </li>
                <li className="flex items-center">
                  <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                  상대방이 7일간 내 윙크에 응답하지 않을 경우
                </li>
                <li className="flex items-center">
                  <svg className="w-3.5 h-3.5 me-2 text-green-500 dark:text-green-400 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                  상대방이 탈퇴하거나 휴면상태로 변경된 경우
                </li>
              </ul>
              <p className='font-semibold text-sky-600'>(위 조건에 해당하는 경우, 100% 반환됩니다.)</p>
            </div>
          </section>

          <section className='w-full my-3 p-3 bg-slate-50'>
            <div className='title py-2 font-bold text-2xl text-pink-700'>윙크 환불금액 안내</div>
            <div className='text font-normal text-md text-gray-700 leading-6'>
              <p className='font-bold'>환불 가격</p><p> = ( 총 윙크 구매 가격 - (윙크 1회 단일구매 가격 * 윙크 사용 개수) ) * ( 윙크 환불 개수 / 잔여 윙크 개수)</p>
              <p className='pt-2'>
                <span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>
                  총 윙크 구매 가격
                </span>
                <span className='text-gray-600 text-sm'>고객이 윙크을 구매한 금액
                </span>
              </p>
              <p className='pt-2'>
                <span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>
                  윙크 1회가격
                </span>
                <span className='text-gray-600 text-sm'>윙크을 1개 단위로 구매했을 때 금액
                </span>
              </p>
              <p className='pt-2'>
                <span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>
                  윙크 사용개수
                </span>
                <span className='text-gray-600 text-sm'>매칭에 성공하여, 소진된 윙크 개수
                </span>
              </p>
              <p className='pt-2'>
                <span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>
                  윙크 환불 개수
                </span>
                <span className='text-gray-600 text-sm'>고객이 환불을 원하는 윙크 개수
                </span>
              </p>
              <p className='pt-2'>
                <span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>
                  잔여 윙크 수
                </span>
                <span className='text-gray-600 text-sm'>취득한 윙크 수 - 사용한 윙크 수
                </span>
              </p>

              <p className='pt-2 font-bold my-2'>매칭에 실패하면 윙크를 다시금 반환해드립니다.</p>
              <p className='pb-2 font-semibold text-sky-600'>(이벤트로 인한 무료윙크는 환불불가)</p>
            </div>
            <div className="flex items-center p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
              <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">위 공식에 따른 환불금액을 산정시 </span>
                환불 가능 금액이 0원 이하일 경우 환불이 불가합니다.
              </div>
            </div>
          </section>
          <section className='w-full my-3 p-3 bg-slate-50'>
            <div className='title py-2 font-bold text-2xl text-pink-700'>피그말리온 윙크 환불방법</div>
            <div className='text font-normal text-md text-gray-700 leading-6'>
              <p className='pt-2'><span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>STEP 1</span>
                <span className='text-gray-600 text-sm'>우측상단 드롭다운 메뉴열기 {`>`} 고객 문의하기</span></p>
              <p className='pt-2'><span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>STEP 2</span>
                <span className='text-gray-600 text-sm'>(오픈 카톡방)'환불 신청' 메시지 전달</span></p>
              <p className='pt-2'><span className='mr-2 px-2 py-1 bg-slate-200 text-sm font-normal text-slate-700 rounded-sm'>STEP 3</span>
                <span className='text-gray-600 text-sm'>담당자 확인 후 3영업일 내 <br />환불 도와드립니다.</span></p>
            </div>
          </section>
          <section className='w-full flex items-center justify-center py-3'>
            <button type="button"
              onClick={() => router.back()}
              className="focus:outline-none w-full mx-2 text-white bg-pink-700 hover:bg-pink-800 focus:ring-4 focus:ring-pink-300 font-medium rounded-md text-sm px-5 py-2.5 mb-2 dark:bg-pink-600 dark:hover:bg-pink-700 dark:focus:ring-pink-900">돌아가기</button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default index;
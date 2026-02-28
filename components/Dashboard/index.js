import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

const index = () => {
  const router = useRouter();
  const onClickDating = useCallback(() => {
    router.push("/date/home");
  }, [router])

  const onClickNeighbor = useCallback(() => {
    window?.open("https://naver.me/5yWIQTSO", '_blank')
  }, [router])


  return (
    <div className='pt-6'>
      <div className="max-w-[32rem] container mx-auto px-2">
        <div className="flex justify-center mt-6 flex-col">
          <h1 className="mb-6 text-3xl font-extrabold leading-none tracking-tight text-center text-gray-700 dark:text-white">원하는 게임을 선택하세요!</h1>

          <div className='my-2 w-full'>
            <button className="w-full" onClick={onClickDating}>
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow-lg md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <Image
                  className="object-contain w-full rounded-t-lg h-64 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg"
                  width="0"
                  height="0"
                  unoptimized
                  size="100vw"
                  src="/image/dashboard_dating.png"
                  alt="dashboard_dating" />
                <div className="flex flex-col justify-between w-full p-4 leading-normal text-left">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight bg-gradient-to-r from-red-400 to-pink-500 text-transparent bg-clip-text dark:text-white">
                    올인원 소개팅
                  </h5>
                  <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    외모와 능력, 가치관을 동시에 검증하는
                    <br />다면 소개팅!<br />

                    프로필만 성의있게 등록해주신다면,<br />
                    나에게 맞는 최고의 이성을 소개해드립니다!<br />

                    {/* 직접 직업인증을 거치며, 상대적으로 어느 등급에 있는지 보여드립니다.
                  또한, 다양한 가치관 질문을 통해 자신과 맞는 이성을 소개받을 수 있습니다. */}
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className='my-2 w-full'>
            <button className="w-full"
              onClick={onClickNeighbor}
            >
              <div className="flex flex-col items-center bg-slate-50 border border-gray-200 rounded-lg shadow-lg md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <Image
                  className="object-contain 
                  
                   w-full rounded-t-lg h-64 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg"
                  src="/image/dashboard_neighbor.png"
                  width="0"
                  height="0"
                  unoptimized
                  size="100vw"
                  alt="dashboard_neighbor" />
                <div className="flex flex-col justify-between w-full p-4 leading-normal text-left">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text dark:text-white">
                    눈픽게임
                  </h5>
                  {/* <p className='text-lg text-gray-400 pb-2 w-full'></p> */}
                  <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    국내최초 관상 매칭 소개팅 게임!<br />
                    산책하면서! 쇼핑하면서! 식사하다가! 이성만나기<br />
                    “안전하게, 짧게, 제대로 고른다”<br />
                    눈픽게임 빠르게 신청해보세요!<br />
                    {/* 내성적(i)성향의 분들께 추천드립니다.<br />
                    일정 기간내에 내 이웃과 <br />
                    무조건적으로 오프라인 만남을 갖습니다.<br /> */}
                  </p>
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default index;
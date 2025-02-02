import React, { useCallback } from 'react';
import { useRouter } from 'next/router';

const index = () => {
  const router = useRouter();
  const onClickDating = useCallback(() => {
    router.push("/date/home");
  }, [router])

  const onClickNeighbor = useCallback(() => {
    router.push("/neighbor/home");
  }, [router])


  return (
    <div className='pt-[--navbar-height]'>
      <div className="max-w-[32rem] container mx-auto">
        <div className="flex justify-center my-3 flex-col">
          <h1 className="mb-4 text-3xl font-extrabold leading-none tracking-tight text-center text-gray-900 md:text-4xl lg:text-4xl dark:text-white">원하는 게임을 선택하세요!</h1>

          <div className='my-2 w-full'>
            <button href="#" className="w-full" onClick={onClickDating}>
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <img className="object-cover w-full rounded-t-lg h-48 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg" src="/image/dashboard_dating.png" alt="" />
                <div className="flex flex-col justify-between w-full p-4 leading-normal text-left">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-700 dark:text-white">
                    미러링 소개팅
                  </h5>
                  <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    능력과 가치관을 동시에 검증하는
                    <br />핀셋형 소개팅!<br />

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
            <button href="#" className="w-full" onClick={onClickNeighbor}>
              <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                <img className="object-cover w-full rounded-t-lg h-48 md:h-auto md:w-48 md:rounded-none md:rounded-s-lg" src="/image/dashboard_neighbor.png" alt="" />
                <div className="flex flex-col justify-between w-full p-4 leading-normal text-left">
                  <h5 className="mb-2 text-2xl font-bold tracking-tight text-blue-700 dark:text-white">
                    일대일 반상회
                  </h5>
                  <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    진실한 동네친구를 사귀어보세요!<br />
                    내성적(i)성향의 분들께 추천드립니다.<br />
                    일정 기간내에 내 이웃과 <br />
                    무조건적으로 오프라인 만남을 갖습니다.<br />
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
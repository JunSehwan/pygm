import React, { useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'components/Common/Modal/Modal';
import Members from 'components/Admin/Date/Members';
import toast from 'react-hot-toast';
import { patchWinkUpDoneFalse } from 'slices/user';

const index = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { friends } = useSelector(state => state.user);
  // const waitingFriend = friends?.f

  const isWaiting = friends?.filter(element => {
    return element?.date_pending == true
      && element?.date_profile_finished == true
      && element?.date_sleep !== true
      && element?.withdraw !== true
  }
  )
  const { patchWinkUpDone } = useSelector(state => state.user);
  const updateDone = () => toast(`업데이트 완료!`);
  useEffect(() => {
    if (patchWinkUpDone) {
      // setWinkError(false);
      // setProfilePendingError(false);
      updateDone();
      // setOpen(false);
      dispatch(patchWinkUpDoneFalse());
    }
  }, [dispatch, patchWinkUpDone])

  const onClickDating = useCallback(() => {
    router.push("/admin/date");
  }, [router])

  const onClickNeighbor = useCallback(() => {
    router.push("/admin/eyepick");
  }, [router])

  // 전체와 차집합
  const difference = friends?.filter(obj1 =>
    !isWaiting?.some(obj2 => obj1?.userID === obj2?.userID));

  difference?.sort((a, b) => {
    if (a.timestamp < b.timestamp) return 1;
    if (a.timestamp > b.timestamp) return -1;
    return 0;
  })


  return (

    <div className='pt-3'>
      <div className="max-w-[32rem] container mx-auto px-2">


        <div className="flex justify-center mt-6 flex-col">
          <h1 className="mb-2 text-3xl font-extrabold leading-none tracking-tight text-center text-gray-700 dark:text-white">관리자페이지</h1>
          <div className='my-2 w-full'>

            <div className="block mb-4 mx-auto border-b border-slate-300 pb-2 max-w-[360px]">
              <p className='block w-full px-4 py-2 text-center text-slate-700 transition-all '>
                새로운 가입자가 <b>{isWaiting?.length}</b>명 있습니다.
              </p>
            </div>

            <div className="relative flex flex-col w-full h-full text-slate-700 bg-white shadow-md rounded-xl bg-clip-border">
              <div className="relative mx-4 mt-4 overflow-hidden text-slate-700 bg-white rounded-none bg-clip-border">
                <div className="flex items-center justify-between ">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">가입리스트</h3>
                    {/* <p className="text-slate-500">프로필작성 완료자</p> */}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 sm:flex-row">
                    {/* <button
                      className="rounded border border-slate-300 py-2.5 px-3 text-center text-xs font-semibold text-slate-600 transition-all hover:opacity-75 focus:ring focus:ring-slate-300 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                      type="button">
                      View All
                    </button> */}
                    {/* <button
                      className="flex select-none items-center gap-2 rounded bg-slate-800 py-2.5 px-4 text-xs font-semibold text-white shadow-md shadow-slate-900/10 transition-all hover:shadow-lg hover:shadow-slate-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                      type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                        strokeWidth="2" className="w-4 h-4">
                        <path
                          d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z">
                        </path>
                      </svg>
                      Add member
                    </button> */}
                  </div>
                </div>

              </div>
              <div className="p-0 overflow-scroll h-[calc(100vh-200px)]">
                <div className="w-full mt-4 text-left table-auto min-w-max">

                  {/* 머릿글 */}
                  <div className='w-full'>
                    <div className='flex flex-row items-center w-full'>
                      <div
                        className="w-full p-4 transition-colors cursor-pointer border-y border-slate-200 bg-slate-50 hover:bg-slate-100">
                        <p
                          className="flex items-center justify-between gap-2 font-sans text-sm font-normal leading-none text-slate-500">
                          Member
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2"
                            stroke="currentColor" aria-hidden="true" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"></path>
                          </svg>
                        </p>
                      </div>



                      {/* <div
                        className="p-4 transition-colors cursor-pointer border-y border-slate-200 bg-slate-50 hover:bg-slate-100">
                        <p
                          className="flex items-center justify-between gap-2 font-sans text-sm font-normal leading-none text-slate-500">
                          info
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2"
                            stroke="currentColor" aria-hidden="true" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"></path>
                          </svg>
                        </p>
                      </div>
                      <div
                        className="p-4 transition-colors cursor-pointer border-y border-slate-200 bg-slate-50 hover:bg-slate-100">
                        <p
                          className="flex items-center justify-between gap-2 font-sans text-sm  font-normal leading-none text-slate-500">
                          wink
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2"
                            stroke="currentColor" aria-hidden="true" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"></path>
                          </svg>
                        </p>
                      </div>
                      <div
                        className="p-4 transition-colors cursor-pointer border-y border-slate-200 bg-slate-50 hover:bg-slate-100">
                        <p
                          className="flex items-center justify-between gap-2 font-sans text-sm  font-normal leading-none text-slate-500">
                          timestamp
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2"
                            stroke="currentColor" aria-hidden="true" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"></path>
                          </svg>
                        </p>
                      </div> */}

                      {/* 목록 */}




                    </div >
                  </div>

                  {/* 목록 */}

                  <div>
                    {isWaiting?.map((v, i) => (
                      <Members
                        user={v}
                        index={i}
                        key={i + 1}
                      />
                    ))}
                  </div>
                  <div className="block mb-2 mx-auto border-solid border-b border-slate-300 pb-2"></div>
                  <div>
                    {difference?.map((v, i) => (
                      <Members
                        user={v}
                        index={i}
                        key={i + 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {/* <div className="flex items-center justify-between p-3">
                <p className="block text-sm text-slate-500">
                  Page 1 of 10
                </p>
                <div className="flex gap-1">
                  <button
                    className="rounded border border-slate-300 py-2.5 px-3 text-center text-xs font-semibold text-slate-600 transition-all hover:opacity-75 focus:ring focus:ring-slate-300 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button">
                    Previous
                  </button>
                  <button
                    className="rounded border border-slate-300 py-2.5 px-3 text-center text-xs font-semibold text-slate-600 transition-all hover:opacity-75 focus:ring focus:ring-slate-300 active:opacity-[0.85] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                    type="button">
                    Next
                  </button>
                </div>
              </div> */}
            </div>





          </div>


        </div>


      </div>
    </div>
  );
};

export default index;
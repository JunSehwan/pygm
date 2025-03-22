import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateThinkMbtiInfo } from 'firebaseConfig';
import { patchThinkMbtiInfo, patchThinkMbtiInfoFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import { FaFingerprint } from "react-icons/fa";

const index = () => {

  const { user, patchThinkMbtiInfoDone } = useSelector(state => state.user);
  const dispatch = useDispatch();


  const writeThumbImage = user?.thumbimage?.length >= 2;
  const writeBasicInfo = user?.username && user?.nickname && user?.religion && user?.birthday?.year && user?.birthday?.month && user?.birthday?.day && user?.gender && user?.phonenumber && user?.address_sigugun && user?.address_sido;
  const writeCareerInfo = user?.education && user?.school && user?.job && user?.company && user?.duty && user?.salary && user?.company_location_sido && user?.company_location_sigugun
  const writeCarrerDocu = user?.jobdocument?.length !== 0;
  const writeMBTI = user?.mbti_ei;
  const writeRomance = user?.opfriend && user?.friendmeeting && user?.longdistance;
  const writeCareerLiving = user?.career_goal && user?.living_weekend && user?.living_consume;
  const writeEtc = user?.religion_important && user?.religion_visit && user?.religion_accept && user?.food_diet;
  const writeHobby = user?.hobby && user?.drink && user?.health && user?.interest;

  const [trueCount, setTrueCount] = useState(0);
  useEffect(() => {
    async function fetchAndSetUser() {
      setTrueCount(0);
      writeThumbImage && setTrueCount(prev => prev + 1)
      writeBasicInfo && setTrueCount(prev => prev + 1)
      writeCareerInfo && setTrueCount(prev => prev + 1)
      writeCarrerDocu && setTrueCount(prev => prev + 1)
      writeMBTI && setTrueCount(prev => prev + 1)
      writeRomance && setTrueCount(prev => prev + 1)
      writeCareerLiving && setTrueCount(prev => prev + 1)
      writeEtc && setTrueCount(prev => prev + 1)
      writeHobby && setTrueCount(prev => prev + 1)
    }
    fetchAndSetUser();
  }, [writeThumbImage,
    writeBasicInfo,
    writeCareerInfo,
    writeCarrerDocu,
    writeMBTI,
    writeRomance,
    writeCareerLiving,
    writeEtc,
    writeHobby])
  
  const updateThinkMbtiInfoDone = () => toast(`MBTI 업데이트 완료! ${trueCount}/9개 섹션 입력완료!`);

  useEffect(() => {
    if (patchThinkMbtiInfoDone) {
      setMbtiError(false);

      updateThinkMbtiInfoDone();
      dispatch(patchThinkMbtiInfoFalse());
    }
  }, [dispatch, patchThinkMbtiInfoDone])

  const [mbtiError, setMbtiError] = useState(false);

  const [mbti_ei, setMbtiei] = useState(user?.mbti_ei || "");
  const onChangeMbti_EI = useCallback((e) => {
    setMbtiei(e.target.value);
    setMbtiError(false);
  }, [])
  const [mbti_sn, setMbtisn] = useState(user?.mbti_sn || "");
  const onChangeMbti_SN = useCallback((e) => {
    setMbtisn(e.target.value);
    setMbtiError(false);
  }, [])
  const [mbti_tf, setMbtitf] = useState(user?.mbti_tf || "");
  const onChangeMbti_TF = useCallback((e) => {
    setMbtitf(e.target.value);
    setMbtiError(false);
  }, [])
  const [mbti_jp, setMbtijp] = useState(user?.mbti_jp || "");
  const onChangeMbti_JP = useCallback((e) => {
    setMbtijp(e.target.value);
    setMbtiError(false);
  }, [])

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!mbti_ei || mbti_ei?.length === 0
    ) {document.getElementById('E').focus();
      return setMbtiError(true);
    }
    if (!mbti_sn || mbti_sn?.length === 0 ) {
      document.getElementById('N').focus();
      return setMbtiError(true);
    }
    if (!mbti_tf || mbti_tf?.length === 0) {
      document.getElementById('T').focus();
      return setMbtiError(true);
    }
    if (!mbti_jp || mbti_jp?.length === 0) {
      document.getElementById('J').focus();
      return setMbtiError(true);
    }


    const res = await updateThinkMbtiInfo(
      mbti_ei, mbti_sn, mbti_tf, mbti_jp
    );
    dispatch(patchThinkMbtiInfo(res))
  }, [mbti_ei, mbti_sn, mbti_tf, mbti_jp,
    dispatch])



  return (
    <>
      <form
        className="w-full"
        onSubmit={onSubmit}
      >
        {/* <p className='my-2 text-gray-500 text-[1.2rem] font-bold leading-8'>MBTI</p> */}

        <div className="py-4">
          {/* <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="mbti">
            본인의 성향을 선택해주세요.
          </label> */}

          <div className="w-full inline-flex rounded-md py-2" role="group">
            <ul className="grid w-full gap-2 grid-cols-2">
              <li>
                <input type="radio"
                  id="E"
                  onChange={onChangeMbti_EI}
                  checked={mbti_ei == "E"}
                  name="mbti_ei"
                  value="E"
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor="E"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                border border-solid
                  bg-white border-gray-200 rounded-lg cursor-pointer 
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">E</div>
                    <div className="w-full text-xs md:text-md">외향적, 단체/개방적</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
              <li>
                <input type="radio"
                  id="I"
                  onChange={onChangeMbti_EI}
                  checked={mbti_ei == "I"}
                  name="mbti_ei"
                  value="I"
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor="I"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                  border border-solid 
                  bg-white border-gray-200 rounded-lg cursor-pointer
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">I</div>
                    <div className="w-full text-xs md:text-md">내향적, 개인/내면적</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
            </ul>

          </div>

          <div className="w-full inline-flex rounded-md py-2" role="group">
            <ul className="grid w-full gap-2 grid-cols-2">
              <li>
                <input type="radio"
                  id="S"
                  onChange={onChangeMbti_SN}
                  checked={mbti_sn == "S"}
                  name="mbti_sn"
                  value="S"
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor="S"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                border border-solid
                  bg-white border-gray-200 rounded-lg cursor-pointer 
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">S</div>
                    <div className="w-full text-xs md:text-md">감각적, 현실/경험적</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
              <li>
                <input type="radio"
                  id="N"
                  onChange={onChangeMbti_SN}
                  checked={mbti_sn == "N"}
                  name="mbti_sn"
                  value="N"
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor="N"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                  border border-solid 
                  bg-white border-gray-200 rounded-lg cursor-pointer
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">N</div>
                    <div className="w-full text-xs md:text-md">직관적, 미래/가능성</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
            </ul>

          </div>

          <div className="w-full inline-flex rounded-md py-2" role="group">
            <ul className="grid w-full gap-2 grid-cols-2">
              <li>
                <input type="radio"
                  id="T"
                  onChange={onChangeMbti_TF}
                  checked={mbti_tf == "T"}
                  name="mbti_tf"
                  value="T"
                  className="hidden peer" />
                <label htmlFor="T"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                border border-solid
                  bg-white border-gray-200 rounded-lg cursor-pointer 
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">T</div>
                    <div className="w-full text-xs md:text-md">이성적, 원칙/논리적</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
              <li>
                <input type="radio"
                  id="F"
                  onChange={onChangeMbti_TF}
                  checked={mbti_tf == "F"}
                  name="mbti_tf"
                  value="F"
                  className="hidden peer" />
                <label htmlFor="F"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                  border border-solid 
                  bg-white border-gray-200 rounded-lg cursor-pointer
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">F</div>
                    <div className="w-full text-xs md:text-md">감정적, 관계/협조적</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
            </ul>

          </div>

          <div className="w-full inline-flex rounded-md py-2" role="group">
            <ul className="grid w-full gap-2 grid-cols-2">
              <li>
                <input type="radio"
                  id="J"
                  onChange={onChangeMbti_JP}
                  checked={mbti_jp == "J"}
                  name="mbti_jp"
                  value="J"
                  className="hidden peer" />
                <label htmlFor="J"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                border border-solid
                  bg-white border-gray-200 rounded-lg cursor-pointer 
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">J</div>
                    <div className="w-full text-xs md:text-md">판단, 계획적/목적성</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                  {/* <svg className="w-5 h-5 ms-3 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg> */}
                </label>
              </li>
              <li>
                <input type="radio"
                  id="P"
                  onChange={onChangeMbti_JP}
                  checked={mbti_jp == "P"}
                  name="mbti_jp"
                  value="P"
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor="P"
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-2 text-gray-500
                  border border-solid 
                  bg-white border-gray-200 rounded-lg cursor-pointer
                 dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500
                 active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    <div className="w-full text-lg font-semibold">P</div>
                    <div className="w-full text-xs md:text-md">인식, 자율/융통성</div>
                  </div>
                  <FaFingerprint
                    className='w-5 h-5 ms-3 rtl:rotate-180 text-gray-400 checked:text-blue-600 checked:border checked:border-blue-600'
                  />
                </label>
              </li>
            </ul>

          </div>

          {mbtiError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">MBTI를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>
        <div className="w-full justify-end flex items-center">
          <button type="submit"
            className="my-2 px-6 text-md py-4 font-bold text-white bg-[#4173f4] hover:bg-[#1C52DC]  focus:outline-none focus:shadow-outline rounded-lg">
            MBTI 업데이트</button>
        </div>

      </form>
    </>
  );
};

export default index;
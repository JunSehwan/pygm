import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateEtc } from 'firebaseConfig';
import { patchEtc, patchEtcFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import { FaFingerprint } from "react-icons/fa";
import { FaRegSave } from "react-icons/fa";

const index = () => {

  const { user, patchEtcDone } = useSelector(state => state.user);
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

  const updateEtcDone = () => toast(`기타질문 업데이트 완료! ${trueCount}/9개 섹션 입력완료!`);

  useEffect(() => {
    if (patchEtcDone) {
      setReligion_importantError(false);
      setReligion_visitError(false);
      setReligion_acceptError(false);
      setFood_tasteError(false);
      setFood_likeError(false);
      setFood_dislikeError(false);
      setFood_vegetarianError(false);
      setFood_spicyError(false);
      setFood_dietError(false);

      updateEtcDone();
      dispatch(patchEtcFalse());
    }
  }, [dispatch, patchEtcDone])

  const [religion_important, setReligion_important] = useState(user?.religion_important || "");
  const [religion_importantError, setReligion_importantError] = useState(false);
  const onChangeReligion_important = useCallback((e) => {
    setReligion_important(e.target.value);
    setReligion_importantError(false);
  }, [])

  const [religion_visit, setReligion_visit] = useState(user?.religion_visit || "");
  const [religion_visitError, setReligion_visitError] = useState(false);
  const onChangeReligion_visit = useCallback((e) => {
    setReligion_visit(e.target.value);
    setReligion_visitError(false);
  }, [])

  const [religion_accept, setReligion_accept] = useState(user?.religion_accept || "");
  const [religion_acceptError, setReligion_acceptError] = useState(false);
  const onChangeReligion_accept = useCallback((e) => {
    setReligion_accept(e.target.value);
    setReligion_acceptError(false);
  }, [])

  const [food_taste, setFood_taste] = useState(user?.food_taste || "");
  const [food_tasteError, setFood_tasteError] = useState(false);
  const onChangeFood_taste = useCallback((e) => {
    setFood_taste(e.target.value);
    setFood_tasteError(false);
  }, [])

  const [food_like, setFood_like] = useState(user?.food_like || "");
  const [food_likeError, setFood_likeError] = useState(false);
  const onChangeFood_like = useCallback((e) => {
    setFood_like(e.target.value);
    setFood_likeError(false);
  }, [])

  const [food_dislike, setFood_dislike] = useState(user?.food_dislike || "");
  const [food_dislikeError, setFood_dislikeError] = useState(false);
  const onChangeFood_dislike = useCallback((e) => {
    setFood_dislike(e.target.value);
    setFood_dislikeError(false);
  }, [])

  const [food_vegetarian, setFood_vegetarian] = useState(user?.food_vegetarian || "");
  const [food_vegetarianError, setFood_vegetarianError] = useState(false);
  const onChangeFood_vegetarian = useCallback((e) => {
    setFood_vegetarian(e.target.value);
    setFood_vegetarianError(false);
  }, [])

  const [food_spicy, setFood_spicy] = useState(user?.food_spicy || "");
  const [food_spicyError, setFood_spicyError] = useState(false);
  const onChangeFood_spicy = useCallback((e) => {
    setFood_spicy(e.target.value);
    setFood_spicyError(false);
  }, [])

  const [food_diet, setFood_diet] = useState(user?.food_diet || "");
  const [food_dietError, setFood_dietError] = useState(false);
  const onChangeFood_diet = useCallback((e) => {
    setFood_diet(e.target.value);
    setFood_dietError(false);
  }, [])


  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!religion_important || religion_important?.length === 0) {
      document.getElementById('religion_important 1').focus();
      return setReligion_importantError(true);
    }
    if (!religion_visit || religion_visit?.length === 0) {
      document.getElementById('religion_visit 1').focus();
      return setReligion_visitError(true);
    }
    if (!religion_accept || religion_accept?.length === 0) {
      document.getElementById('religion_accept 1').focus();
      return setReligion_acceptError(true);
    }
    if (!food_taste || food_taste?.length === 0) {
      document.getElementById('food_taste 1').focus();
      return setFood_tasteError(true);
    }
    if (!food_like || food_like?.length === 0) {
      document.getElementById('food_like 1').focus();
      return setFood_likeError(true);
    }
    if (!food_dislike || food_dislike?.length === 0) {
      document.getElementById('food_dislike 1').focus();
      return setFood_dislikeError(true);
    }
    if (!food_vegetarian || food_vegetarian?.length === 0) {
      document.getElementById('food_vegetarian 1').focus();
      return setFood_vegetarianError(true);
    }
    if (!food_spicy || food_spicy?.length === 0) {
      document.getElementById('food_spicy 1').focus();
      return setFood_spicyError(true);
    }
    if (!food_diet || food_diet?.length === 0) {
      document.getElementById('food_diet 1').focus();
      return setFood_dietError(true);
    }
    const res = await updateEtc(
      religion_important, religion_visit, religion_accept, food_taste, food_like, food_dislike, food_vegetarian,
      food_spicy, food_diet,
    );
    dispatch(patchEtc(res))
  }, [religion_important, religion_visit, religion_accept, food_taste, food_like, food_dislike, food_vegetarian,
    food_spicy, food_diet,
    dispatch])

  const religion_importantArr = ["무교", "큰 의미는 없음", "이따금씩 의지하는 수준", "종교는 매우 중요한 존재", "내 인생의 가장 우선순위"]
  const religion_visitArr = ["무교", "거의 참석 안함", "월 1회 이하", "월 2~3회", "주 1회", "주 2회 이상"]
  const religion_acceptArr = ["무교만 가능", "안했으면 한다", "아주 가끔은 괜찮다", "월 1회", "월 2~3회", "주 1회", "상관 없음"]
  //줄서서라도 맛집을 가는 것을 선호하는 편인가요?
  const food_tasteArr = ["가리는게 없음", "몇가지 빼고는 다 잘먹음", "까다로운 편", "매우 까다로움"]
  //여행을 선호하나요?
  const food_likeArr = ["돼지고기, 소고기", "치킨", "중식", "돈까스", "회", "초밥", "피자", "패스트푸드", "찜,탕", "족발,보쌈", "떡볶이 등 분식", "감자탕", "한식", "기타"]
  //선호하는 여행은?
  const food_dislikeArr = ["가리는 것 없음", "비린내나는 음식", "소고기", "돼지고기", "닭고기", "채소류", "생선류", "날것류", "곱창/내장 등", "고수", "향신료 강한 음식", "매운 음식", "징그러운 비주얼", "냄새가 강한 음식"]
  //여행의 주된 목적은?
  const food_vegetarianArr = ["채식주의자다", "채식을 주로 먹는다", "채식주의자가 아니다", "채식을 싫어한다"]
  //취미를 공유하는것 생각?
  const food_spicyArr = ["정말 못먹는다", "있으면 먹는 정도", "가끔 찾아먹는다", "즐겨 먹는다", "매운맛 매니아"]
  const food_dietArr = ["관심없다", "현재 하지 않는다", "이따금씩 식단을 한다", "진행중이다", "매끼마다 식단 중"]


  return (
    <>
      <form
        className="w-full pb-2"
        onSubmit={onSubmit}
      >
        <h2 className='py-3 text-lg text-gray-700'>종교에 대한 질문</h2>
        <div className="py-1">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="religion_important 1">
            본인에게 종교는 얼마나 큰 의미인가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {religion_importantArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`religion_important ${index + 1}`}
                  onChange={onChangeReligion_important}
                  checked={religion_important == index + 1}
                  name="religion_important"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`religion_important ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {religion_importantError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">종교의 중요성을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>


        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="religion_visit 1">
            종교행사에 참석하는 빈도는 어떻게 되나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {religion_visitArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`religion_visit ${index + 1}`}
                  onChange={onChangeReligion_visit}
                  checked={religion_visit == index + 1}
                  name="religion_visit"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`religion_visit ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {religion_visitError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">종교행사 참석빈도를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="religion_accept">
            내 연인이 종교활동(행사)에 참여하는 것에 대해서 어떻게 생각하나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {religion_acceptArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`religion_accept ${index + 1}`}
                  onChange={onChangeReligion_accept}
                  checked={religion_accept == index + 1}
                  name="religion_accept"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`religion_accept ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {religion_acceptError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">종교에 대한 생각을 답변해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <h2 className='py-3 text-lg text-gray-700'>식습관에 대한 질문</h2>

        <div className="py-1">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="food_taste">
            입맛이 까다로운 편이신가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {food_tasteArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`food_taste ${index + 1}`}
                  onChange={onChangeFood_taste}
                  checked={food_taste == index + 1}
                  name="food_taste"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`food_taste ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {food_tasteError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">식성에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="food_like">
            어떤 음식종류를 가장 선호하시나요?
          </label>
          <ul className="flex w-full gap-2 items-start flex-wrap">
            {food_likeArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`food_like ${index + 1}`}
                  onChange={onChangeFood_like}
                  checked={food_like == index + 1}
                  name="food_like"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 none absolute peer" />
                <label htmlFor={`food_like ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between py-2 px-3 text-gray-500
                         border border-solid rounded-full
                           bg-white border-gray-200 cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {food_likeError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">선호하는 음식종류를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="food_dislike">
            못 먹는 음식을 선택해주세요.
          </label>
          <ul className="flex w-full gap-2 items-start flex-wrap">
            {food_dislikeArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`food_dislike ${index + 1}`}
                  onChange={onChangeFood_dislike}
                  checked={food_dislike == index + 1}
                  name="food_dislike"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 none absolute peer" />
                <label htmlFor={`food_dislike ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between py-2 px-3 text-gray-500
                         border border-solid rounded-full
                           bg-white border-gray-200 cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {food_dislikeError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">못 먹는 음식을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="food_vegetarian">
            채식주의자인가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {food_vegetarianArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`food_vegetarian ${index + 1}`}
                  onChange={onChangeFood_vegetarian}
                  checked={food_vegetarian == index + 1}
                  name="food_vegetarian"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`food_vegetarian ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {food_vegetarianError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">채식에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="food_spicy">
            매운 음식을 선호하시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {food_spicyArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`food_spicy ${index + 1}`}
                  onChange={onChangeFood_spicy}
                  checked={food_spicy == index + 1}
                  name="food_spicy"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`food_spicy ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {food_spicyError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">매운 음식에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="food_diet">
            다이어트 식단을 하시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {food_dietArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`food_diet ${index + 1}`}
                  onChange={onChangeFood_diet}
                  checked={food_diet == index + 1}
                  name="food_diet"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`food_diet ${index + 1}`}
                  className="peer-checked:bg-slate-100 peer-checked:text-blue-600 peer-checked:border peer-checked:border-blue-600 inline-flex transition-all transform items-center justify-between w-full p-3 text-gray-500
                         border border-solid
                           bg-white border-gray-200 rounded-lg cursor-pointer 
                          dark:hover:text-gray-300 dark:border-gray-700 dark:active:text-blue-500 
                          active:border active:border-solid target:border-solid target:border-2 target:border-blue-600 active:border-blue-600 hover:border-blue-600 checked:border-solid checked:border-blue-600 focus:border-blue-600 active:text-blue-600 checked:text-blue-600 focus:text-blue-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 shadow-md">
                  <div className="block">
                    {/* <div className="w-full text-lg font-semibold"></div> */}
                    <div className="w-full text-sm">{v}</div>
                  </div>
                </label>
              </li>
            ))}
          </ul>
          {food_dietError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">다이어트 식단에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>


        <div className="w-full justify-end flex items-center">
          <button type="submit" className="text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30 me-2 mb-2">
            <FaRegSave className="w-5 h-5 me-2 -ms-1" />
            기타설문 업데이트
          </button>

        </div>

      </form>
    </>
  );
};

export default index;
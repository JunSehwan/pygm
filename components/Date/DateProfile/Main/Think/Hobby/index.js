import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateHobby } from 'firebaseConfig';
import { patchHobby, patchHobbyFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import { FaFingerprint } from "react-icons/fa";
import { FaRegSave } from "react-icons/fa";

const index = () => {

  const { user, patchHobbyDone } = useSelector(state => state.user);
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

  const updateHobbyDone = () => toast(`취미분야 업데이트 완료! ${trueCount}/9개 섹션 입력완료!`);

  useEffect(() => {
    if (patchHobbyDone) {
      setHobbyError(false);
      setDrinkError(false);
      setHealthError(false);
      setHotplaceError(false);
      setTourError(false);
      setTourlikeError(false);
      setTourpurposeError(false);
      setHobbyshareError(false);
      setInterestError(false);

      updateHobbyDone();
      dispatch(patchHobbyFalse());
    }
  }, [dispatch, patchHobbyDone])

  const [hobby, setHobby] = useState(user?.hobby || "");
  const [hobbyError, setHobbyError] = useState(false);
  const onChangeHobby = useCallback((e) => {
    setHobby(e.target.value);
    setHobbyError(false);
  }, [])

  const [drink, setDrink] = useState(user?.drink || "");
  const [drinkError, setDrinkError] = useState(false);
  const onChangeDrink = useCallback((e) => {
    setDrink(e.target.value);
    setDrinkError(false);
  }, [])

  const [health, setHealth] = useState(user?.health || "");
  const [healthError, setHealthError] = useState(false);
  const onChangeHealth = useCallback((e) => {
    setHealth(e.target.value);
    setHealthError(false);
  }, [])

  const [hotplace, setHotplace] = useState(user?.hotplace || "");
  const [hotplaceError, setHotplaceError] = useState(false);
  const onChangeHotplace = useCallback((e) => {
    setHotplace(e.target.value);
    setHotplaceError(false);
  }, [])

  const [tour, setTour] = useState(user?.tour || "");
  const [tourError, setTourError] = useState(false);
  const onChangeTour = useCallback((e) => {
    setTour(e.target.value);
    setTourError(false);
  }, [])

  const [tourlike, setTourlike] = useState(user?.tourlike || "");
  const [tourlikeError, setTourlikeError] = useState(false);
  const onChangeTourlike = useCallback((e) => {
    setTourlike(e.target.value);
    setTourlikeError(false);
  }, [])

  const [tourpurpose, setTourpurpose] = useState(user?.tourpurpose || "");
  const [tourpurposeError, setTourpurposeError] = useState(false);
  const onChangeTourpurpose = useCallback((e) => {
    setTourpurpose(e.target.value);
    setTourpurposeError(false);
  }, [])

  const [hobbyshare, setHobbyshare] = useState(user?.hobbyshare || "");
  const [hobbyshareError, setHobbyshareError] = useState(false);
  const onChangeHobbyshare = useCallback((e) => {
    setHobbyshare(e.target.value);
    setHobbyshareError(false);
  }, [])

  const [interest, setInterest] = useState(user?.interest || "");
  const [interestError, setInterestError] = useState(false);
  const onChangeInterest = useCallback((e) => {
    setInterest(e.target.value);
    setInterestError(false);
  }, [])


  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!hobby || hobby?.length === 0) {
      document.getElementById('hobby').focus();
      return setHobbyError(true);
    }
    if (!drink || drink?.length === 0) {
      document.getElementById('drink 1').focus();
      return setDrinkError(true);
    }
    if (!health || health?.length === 0) {
      document.getElementById('health 1').focus();
      return setHealthError(true);
    }
    if (!hotplace || hotplace?.length === 0) {
      document.getElementById('hotplace 1').focus();
      return setHotplaceError(true);
    }
    if (!tour || tour?.length === 0) {
      document.getElementById('tour 1').focus();
      return setTourError(true);
    }
    if (!tourlike || tourlike?.length === 0) {
      document.getElementById('tourlike 1').focus();
      return setTourlikeError(true);
    }
    if (!tourpurpose || tourpurpose?.length === 0) {
      document.getElementById('tourpurpose 1').focus();
      return setTourpurposeError(true);
    }
    if (!hobbyshare || hobbyshare?.length === 0) {
      document.getElementById('hobbyshare 1').focus();
      return setHobbyshareError(true);
    }
    if (!interest || interest?.length === 0) {
      document.getElementById('interest').focus();
      return setInterestError(true);
    }
    const res = await updateHobby(
      hobby, drink, health, hotplace, tour, tourlike, tourpurpose,
      hobbyshare, interest,
    );
    dispatch(patchHobby(res))
  }, [hobby, drink, health, hotplace, tour, tourlike, tourpurpose,
    hobbyshare, interest,
    dispatch])

  const drinkArr = ["전혀 없음", "월 1회 미만", "월 1회", "주 1회", "주 2~3회", "주 3~4회", "주 5회 이상"]
  //평소에 운동을 즐기시나요?
  const healthArr = ["전혀 안함", "아주 가끔", "주 1회", "주 2~3회", "주 4~5회", "매일"]
  //줄서서라도 맛집을 가는 것을 선호하는 편인가요?
  const hotplaceArr = ["관심없음", "집 근처면 가끔 가는수준", "가끔씩 맛집방문", "맛집탐방 매니아"]
  //여행을 선호하나요?
  const tourArr = ["관심없음", "수년에 1회", "년 1~2회", "년 3~6회", "년 7~12회", "월 1회이상"]
  //선호하는 여행은?
  const tourlikeArr = ["관심없음", "국내여행", "해외여행", "어디든 좋음",]
  //여행의 주된 목적은?
  const tourpurposeArr = ["주로 관광", "주로 휴양", "새로운 경험과 문화접촉", "사람들과 관계", "일상의 해방", "도전과 탐험"]
  //취미를 공유하는것 생각?
  const hobbyshareArr = ["상대방의 취미엔 신경안씀", "한 개 정도는 공유하고 싶다", "많은 취미를 함께하고 싶다", "생각해 본 적 없음"]


  return (
    <>
      <form
        className="w-full pb-2"
        onSubmit={onSubmit}
      >
        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="hobby">
            취미나 특기를 간단히 작성해주세요.
          </label>
          <textarea
            id="hobby"
            rows="3"
            maxLength={100}
            onChange={onChangeHobby}
            defaultValue={user?.hobby}
            className="whitespace-pre block p-1.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="취미나 특기를 간단히 작성해주세요"></textarea>

          {hobbyError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">취미나 특기를 작성해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="drink 1">
            음주 빈도는 어떻게 되시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {drinkArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`drink ${index + 1}`}
                  onChange={onChangeDrink}
                  checked={drink == index + 1}
                  name="drink"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`drink ${index + 1}`}
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
          {drinkError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">음주빈도를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="health">
            평소에 운동을 즐기시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {healthArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`health ${index + 1}`}
                  onChange={onChangeHealth}
                  checked={health == index + 1}
                  name="health"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`health ${index + 1}`}
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
          {healthError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">운동빈도를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="hotplace">
            줄을 서서라도 맛집을 가는 것을 선호하는 편인가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {hotplaceArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`hotplace ${index + 1}`}
                  onChange={onChangeHotplace}
                  checked={hotplace == index + 1}
                  name="hotplace"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`hotplace ${index + 1}`}
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
          {hotplaceError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">맛집투어에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="tour">
            여행을 자주 다니는 편입니까?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {tourArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`tour ${index + 1}`}
                  onChange={onChangeTour}
                  checked={tour == index + 1}
                  name="tour"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`tour ${index + 1}`}
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
          {tourError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">여행빈도를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="tourlike">
            선호하는 여행은?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {tourlikeArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`tourlike ${index + 1}`}
                  onChange={onChangeTourlike}
                  checked={tourlike == index + 1}
                  name="tourlike"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`tourlike ${index + 1}`}
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
          {tourlikeError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">여행에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="tourpurpose">
            여행의 주된 목적은 무엇인가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {tourpurposeArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`tourpurpose ${index + 1}`}
                  onChange={onChangeTourpurpose}
                  checked={tourpurpose == index + 1}
                  name="tourpurpose"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`tourpurpose ${index + 1}`}
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
          {tourpurposeError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">여행에 대한 목적을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="hobbyshare">
            연인과 취미를 공유하는 것에 대한 생각은?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {hobbyshareArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`hobbyshare ${index + 1}`}
                  onChange={onChangeHobbyshare}
                  checked={hobbyshare == index + 1}
                  name="hobbyshare"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`hobbyshare ${index + 1}`}
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
          {hobbyshareError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">취미 공유에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="interest">
            최근 관심사가 무엇인가요?
          </label>
          <input
            className={interestError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="interest"
            type="text"
            maxLength={30}
            placeholder="관심사"
            onChange={onChangeInterest}
            defaultValue={user?.interest}
          />
          {interestError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">관심사를 간단하게 작성해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="w-full justify-end flex items-center">
          <button type="submit" className="text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30 me-2 mb-2">
            <FaRegSave className="w-5 h-5 me-2 -ms-1" />
            취미설문 업데이트
          </button>

        </div>

      </form>
    </>
  );
};

export default index;
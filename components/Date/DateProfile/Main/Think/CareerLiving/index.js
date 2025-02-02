import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateCareerLiving } from 'firebaseConfig';
import { patchCareerLiving, patchCareerLivingFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import { FaRegSave } from "react-icons/fa";

const index = () => {

  const { user, patchCareerLivingDone } = useSelector(state => state.user);
  const dispatch = useDispatch();

  const updateCareerLivingDone = () => toast('커리어/생활 업데이트 완료!');

  useEffect(() => {
    if (patchCareerLivingDone) {
      setCareer_goalError(false);
      setLiving_weekendError(false);
      setLiving_consumeError(false);
      setLiving_petError(false);
      setLiving_tatooError(false);
      setLiving_smokeError(false);
      setLiving_charmingError(false);

      updateCareerLivingDone();
      dispatch(patchCareerLivingFalse());
    }
  }, [dispatch, patchCareerLivingDone])

  const [career_goal, setCareer_goal] = useState(user?.career_goal || "");
  const [career_goalError, setCareer_goalError] = useState(false);
  const onChangeCareer_goal = useCallback((e) => {
    setCareer_goal(e.target.value);
    setCareer_goalError(false);
  }, [])

  const [living_weekend, setLiving_weekend] = useState(user?.living_weekend || "");
  const [living_weekendError, setLiving_weekendError] = useState(false);
  const onChangeLiving_weekend = useCallback((e) => {
    setLiving_weekend(e.target.value);
    setLiving_weekendError(false);
  }, [])

  const [living_consume, setLiving_consume] = useState(user?.living_consume || "");
  const [living_consumeError, setLiving_consumeError] = useState(false);
  const onChangeLiving_consume = useCallback((e) => {
    setLiving_consume(e.target.value);
    setLiving_consumeError(false);
  }, [])

  const [living_pet, setLiving_pet] = useState(user?.living_pet || "");
  const [living_petError, setLiving_petError] = useState(false);
  const onChangeLiving_pet = useCallback((e) => {
    setLiving_pet(e.target.value);
    setLiving_petError(false);
  }, [])

  const [living_tatoo, setLiving_tatoo] = useState(user?.living_tatoo || "");
  const [living_tatooError, setLiving_tatooError] = useState(false);
  const onChangeLiving_tatoo = useCallback((e) => {
    setLiving_tatoo(e.target.value);
    setLiving_tatooError(false);
  }, [])

  const [living_smoke, setLiving_smoke] = useState(user?.living_smoke || "");
  const [living_smokeError, setLiving_smokeError] = useState(false);
  const onChangeLiving_smoke = useCallback((e) => {
    setLiving_smoke(e.target.value);
    setLiving_smokeError(false);
  }, [])

  const [living_charming, setLiving_charming] = useState(user?.living_charming || "");
  const [living_charmingError, setLiving_charmingError] = useState(false);
  const onChangeLiving_charming = useCallback((e) => {
    setLiving_charming(e.target.value);
    setLiving_charmingError(false);
  }, [])

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!career_goal || career_goal?.length === 0) {
      document.getElementById('career_goal 1').focus();
      return setCareer_goalError(true);
    }
    if (!living_weekend || living_weekend?.length === 0) {
      document.getElementById('living_weekend 1').focus();
      return setLiving_weekendError(true);
    }
    if (!living_consume || living_consume?.length === 0) {
      document.getElementById('living_consume 1').focus();
      return setLiving_consumeError(true);
    }
    if (!living_pet || living_pet?.length === 0) {
      document.getElementById('living_pet 1').focus();
      return setLiving_petError(true);
    }
    if (!living_tatoo || living_tatoo?.length === 0) {
      document.getElementById('living_tatoo 1').focus();
      return setLiving_tatooError(true);
    }
    if (!living_smoke || living_smoke?.length === 0) {
      document.getElementById('living_smoke 1').focus();
      return setLiving_smokeError(true);
    }
    if (!living_charming || living_charming?.length === 0) {
      document.getElementById('living_charming 1').focus();
      return setLiving_charmingError(true);
    }

    const res = await updateCareerLiving(
      career_goal, living_weekend, living_consume, living_pet, living_tatoo, living_smoke,
      living_charming
    );
    dispatch(patchCareerLiving(res))
  }, [career_goal, living_weekend, living_consume, living_pet, living_tatoo, living_smoke,
    living_charming, dispatch])

  const career_goalArr = ["꾸준히 지금 일을 계속한다", "학위 또는 자격취득", "이직 또는 취업", "사업", "카페나 자영업", "투자, 재테크", "투잡", "관심 없음"]
  const living_weekendArr = ["집에서 휴식", "산책과 운동", "친구만나기", "학습(직무/재테크 등)", "취미생활", "봉사활동", "드라이브", "게임", "기타"]
  const living_consumeArr = ["자린고비", "필요한것만 사는 편", "이따금씩 플랙스!", "고민없이 플랙스!","스트레스 해소로 플랙스!"]
  const living_petArr = ["매우 싫다", "반려동물은 그닥...", "크게 상관없다", "매우 긍정적", "동물에 따라 다름"]
  const living_tatooArr = ["매우 싫다", "한 두개는 괜찮다", "괜찮다", "멋지다고 생각한다", "나 역시 타투 경험이 있다"]
  const living_smokeArr = ["긍정적이다", "크게 상관없다", "전자담배는 괜찮다", "조금은 부정적이다", "끊으면 좋겠다", "매우 싫다","생각해본 적 없다"]
  const living_charmingArr = ["귀여움", "섹시함", "청순함", "새침함", "순둥이", "앙칼짐", "터프함", "시크함", "쿨함", "싸가지", "듬직함", "병맛", "겸손함", "느끼함", "유머러스", "유치함", "진지함", "집중력", "배려심", "착함", "로맨틱","자유분방함","섬세함"]


  return (
    <>
      <form
        className="w-full pb-2"
        onSubmit={onSubmit}
      >
        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="career_goal 1">
            미래의 경력목표가 있나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {career_goalArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`career_goal ${index + 1}`}
                  onChange={onChangeCareer_goal}
                  checked={career_goal == index + 1}
                  name="career_goal"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`career_goal ${index + 1}`}
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
          {career_goalError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">경력목표 대한 질문에 답해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="living_weekend">
            주말에는 주로 어떤 활동을 하시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {living_weekendArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`living_weekend ${index + 1}`}
                  onChange={onChangeLiving_weekend}
                  checked={living_weekend == index + 1}
                  name="living_weekend"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`living_weekend ${index + 1}`}
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
          {living_weekendError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">주말활동 관련 질문에 답해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="living_consume">
            본인의 소비습관은 어떤가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {living_consumeArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`living_consume ${index + 1}`}
                  onChange={onChangeLiving_consume}
                  checked={living_consume == index + 1}
                  name="living_consume"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`living_consume ${index + 1}`}
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
          {living_consumeError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">소비습관 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="living_pet">
            애완동물, 반려동물을 키우는 것에 대해서 어떻게 생각하시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {living_petArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`living_pet ${index + 1}`}
                  onChange={onChangeLiving_pet}
                  checked={living_pet == index + 1}
                  name="living_pet"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`living_pet ${index + 1}`}
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
          {living_petError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">동물을 키우는 것에 대한 질문에 답변해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="living_tatoo">
            타투(문신)에 대해서 어떻게 생각하시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {living_tatooArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`living_tatoo ${index + 1}`}
                  onChange={onChangeLiving_tatoo}
                  checked={living_tatoo == index + 1}
                  name="living_tatoo"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`living_tatoo ${index + 1}`}
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
          {living_tatooError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">타투에 관한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="living_smoke">
            흡연에 대해서 어떻게 생각하시나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {living_smokeArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`living_smoke ${index + 1}`}
                  onChange={onChangeLiving_smoke}
                  checked={living_smoke == index + 1}
                  name="living_smoke"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`living_smoke ${index + 1}`}
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
          {living_smokeError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">흡연에 관한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="living_charming">
            가장 큰 나의 매력포인트는?
          </label>
          <ul className="flex w-full gap-2 items-start flex-wrap">
            {living_charmingArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`living_charming ${index + 1}`}
                  onChange={onChangeLiving_charming}
                  checked={living_charming == index + 1}
                  name="living_charming"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 none absolute peer" />
                <label htmlFor={`living_charming ${index + 1}`}
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
          {living_charmingError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">나의 매력포인트를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>



        <div className="w-full justify-end flex items-center">
          <button type="submit" className="text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30 me-2 mb-2">
            <FaRegSave className="w-5 h-5 me-2 -ms-1" />
            커리어/생활 업데이트
          </button>

        </div>

      </form>
    </>
  );
};

export default index;
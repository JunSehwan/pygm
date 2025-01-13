import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateRomance } from 'firebaseConfig';
import { patchRomance, patchRomanceFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import { FaRegSave } from "react-icons/fa";
import MultiRangeSlider from 'components/Common/MultiRangeSlider';

const index = () => {

  const { user, patchRomanceDone } = useSelector(state => state.user);
  const dispatch = useDispatch();

  const updateRomanceDone = () => toast('연애관 업데이트 완료!');

  useEffect(() => {
    if (patchRomanceDone) {
      setOpfriendError(false);
      setFriendmeetingError(false);
      setLongdistanceError(false);
      setDatecycleError(false);
      setDateromanceError(false);
      setContactError(false);
      setContactcycleError(false);
      setPasswordshareError(false);
      setWeddingError(false);
      setWedding_datingError(false);

      updateRomanceDone();
      dispatch(patchRomanceFalse());
    }
  }, [dispatch, patchRomanceDone])

  const [opfriend, setOpfriend] = useState(user?.opfriend || "");
  const [opfriendError, setOpfriendError] = useState(false);
  const onChangeOpfriend = useCallback((e) => {
    setOpfriend(e.target.value);
    setOpfriendError(false);
  }, [])

  const [friendmeeting, setFriendmeeting] = useState(user?.friendmeeting || "");
  const [friendmeetingError, setFriendmeetingError] = useState(false);
  const onChangeFriendmeeting = useCallback((e) => {
    setFriendmeeting(e.target.value);
    setFriendmeetingError(false);
  }, [])

  const [longdistance, setLongdistance] = useState(user?.longdistance || "");
  const [longdistanceError, setLongdistanceError] = useState(false);
  const onChangeLongdistance = useCallback((e) => {
    setLongdistance(e.target.value);
    setLongdistanceError(false);
  }, [])

  const [datecycle, setDatecycle] = useState(user?.datecycle || "");
  const [datecycleError, setDatecycleError] = useState(false);
  const onChangeDatecycle = useCallback((e) => {
    setDatecycle(e.target.value);
    setDatecycleError(false);
  }, [])

  const [dateromance, setDateromance] = useState(user?.dateromance || "");
  const [dateromanceError, setDateromanceError] = useState(false);
  const onChangeDateromance = useCallback((e) => {
    setDateromance(e.target.value);
    setDateromanceError(false);
  }, [])

  const [contact, setContact] = useState(user?.contact || "");
  const [contactError, setContactError] = useState(false);
  const onChangeContact = useCallback((e) => {
    setContact(e.target.value);
    setContactError(false);
  }, [])

  const [contactcycle, setContactcycle] = useState(user?.contactcycle || "");
  const [contactcycleError, setContactcycleError] = useState(false);
  const onChangeContactcycle = useCallback((e) => {
    setContactcycle(e.target.value);
    setContactcycleError(false);
  }, [])

  const [passwordshare, setPasswordshare] = useState(user?.passwordshare || "");
  const [passwordshareError, setPasswordshareError] = useState(false);
  const onChangePasswordshare = useCallback((e) => {
    setPasswordshare(e.target.value);
    setPasswordshareError(false);
  }, [])

  const [wedding, setWedding] = useState(user?.wedding || "");
  const [weddingError, setWeddingError] = useState(false);
  const onChangeWedding = useCallback((e) => {
    setWedding(e.target.value);
    setWeddingError(false);
  }, [])

  const [wedding_dating, setWedding_dating] = useState(user?.wedding_dating || "");
  const [wedding_datingError, setWedding_datingError] = useState(false);
  const onChangeWedding_dating = useCallback((e) => {
    setWedding_dating(e.target.value);
    setWedding_datingError(false);
  }, [])

  const [prefer_age_min, setPrefer_age_min] = useState(user?.prefer_age_min || "");
  const [prefer_age_max, setPrefer_age_max] = useState(user?.prefer_age_max || "");
  const onChangePrefer_age = useCallback(({ min, max }) => {
    setPrefer_age_min(min)
    setPrefer_age_max(max)
    // setPrefer_age({ min, max });
    // console.log(prefer_age,"prefer")
  }, [])

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!opfriend || opfriend?.length === 0) {
      document.getElementById('opfriend').focus();
      return setOpfriendError(true);
    }
    if (!friendmeeting || friendmeeting?.length === 0) {
      document.getElementById('friendmeeting 1').focus();
      return setFriendmeetingError(true);
    }
    if (!longdistance || longdistance?.length === 0) {
      document.getElementById('longdistance 1').focus();
      return setLongdistanceError(true);
    }
    if (!datecycle || datecycle?.length === 0) {
      document.getElementById('datecycle 1').focus();
      return setDatecycleError(true);
    }
    if (!dateromance || dateromance?.length === 0) {
      document.getElementById('dateromance 1').focus();
      return setDateromanceError(true);
    }
    if (!contact || contact?.length === 0) {
      document.getElementById('contact 1').focus();
      return setContactError(true);
    }
    if (!contactcycle || contactcycle?.length === 0) {
      document.getElementById('contactcycle 1').focus();
      return setContactcycleError(true);
    }
    if (!passwordshare || passwordshare?.length === 0) {
      document.getElementById('passwordshare 1').focus();
      return setPasswordshareError(true);
    }
    if (!wedding || wedding?.length === 0) {
      document.getElementById('wedding 1').focus();
      return setWeddingError(true);
    }
    if (!wedding_dating || wedding_dating?.length === 0) {
      document.getElementById('wedding_dating 1').focus();
      return setWedding_datingError(true);
    }
    const res = await updateRomance(
      opfriend, friendmeeting, longdistance, datecycle, dateromance, contact,
      contactcycle, passwordshare, wedding, wedding_dating, prefer_age_min, prefer_age_max
    );
    dispatch(patchRomance(res))
  }, [opfriend, friendmeeting, longdistance, datecycle, dateromance, contact,
    contactcycle, passwordshare, wedding, wedding_dating, prefer_age_min, prefer_age_max,
    dispatch])

  const opfriendArr = ["전혀없음", "한 두명", "몇명 있음", "많은 편이다"]
  const friendmeetingArr = ["절대불가", "차 한잔 정도", "같이 식사 한끼", "문화생활 함께하기", "술한잔 가능", "상관 없음"]
  const longdistanceArr = ["절대불가", "가능하지만 자신은 없음", "가능한 편", "웬만하면 가능"]
  const datecycleArr = ["한달에 1회미만", "한달에 1회", "격주 1회", "주1~2회", "주3~4회", "주5~7회"]
  const dateromanceArr = ["같이 산책하는 등 소소한 행복", "항상 설레는 연애", "새로운 경험을 함께하는 연애", "현실적, 안정적인 연애"]
  const contactArr = ["크게 신경쓰지 않는디", "매우 중요하다."]
  const contactcycleArr = ["매번 어디든 상황공유", "최소 아침, 저녁에는 연락", "이따금씩 한번씩", "하루에 한번정도"]
  const passwordshareArr = ["절대 안된다", "알려줘도 상관없다"]
  const weddingArr = ["아직 관심없음", "원하지만 계획은 없음", "1~2년내", "당장이라도 가능"]
  const wedding_datingArr = ["크게 중요하지 않음", "3년 이상", "1년~3년", "6개월~1년", "6개월이내 가능", "3개월이내 가능"]


  return (
    <>
      <form
        className="w-full pb-2"
        onSubmit={onSubmit}
      >
        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="opfriend 1">
            이성친구(남사친/여사친)가 많은 편인가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {opfriendArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`opfriend ${index + 1}`}
                  onChange={onChangeOpfriend}
                  checked={opfriend == index + 1}
                  name="opfriend"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`opfriend ${index + 1}`}
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
          {opfriendError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">이성친구에 대한 질문에 답해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="friendmeeting">
            내 연인이 다른 이성친구와 단 둘이 만나도 될까요? 가능하다면 어느정도까지 가능할까요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {friendmeetingArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`friendmeeting ${index + 1}`}
                  onChange={onChangeFriendmeeting}
                  checked={friendmeeting == index + 1}
                  name="friendmeeting"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`friendmeeting ${index + 1}`}
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
          {friendmeetingError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">이성친구 관련 질문에 답해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="longdistance">
            장거리연애에 대해서 어떻게 생각하나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {longdistanceArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`longdistance ${index + 1}`}
                  onChange={onChangeLongdistance}
                  checked={longdistance == index + 1}
                  name="longdistance"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`longdistance ${index + 1}`}
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
          {longdistanceError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">장거리연애에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="datecycle">
            선호하는 데이트(만남)의 주기는?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {datecycleArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`datecycle ${index + 1}`}
                  onChange={onChangeDatecycle}
                  checked={datecycle == index + 1}
                  name="datecycle"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`datecycle ${index + 1}`}
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
          {datecycleError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">데이트의 빈도를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="dateromance">
            어떤 연애스타일을 추구하나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {dateromanceArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`dateromance ${index + 1}`}
                  onChange={onChangeDateromance}
                  checked={dateromance == index + 1}
                  name="dateromance"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`dateromance ${index + 1}`}
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
          {dateromanceError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">추구하는 연애관을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="contact">
            연애할 때 연락은 얼마나 중요한가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {contactArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`contact ${index + 1}`}
                  onChange={onChangeContact}
                  checked={contact == index + 1}
                  name="contact"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`contact ${index + 1}`}
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
          {contactError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">연락에 관한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="contactcycle">
            연애를 할 때 선호하는 연락주기는?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {contactcycleArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`contactcycle ${index + 1}`}
                  onChange={onChangeContactcycle}
                  checked={contactcycle == index + 1}
                  name="contactcycle"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`contactcycle ${index + 1}`}
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
          {contactcycleError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">연락 주기에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="passwordshare">
            연인에게 내 휴대폰 비밀번호 공유가 가능한가요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {passwordshareArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`passwordshare ${index + 1}`}
                  onChange={onChangePasswordshare}
                  checked={passwordshare == index + 1}
                  name="passwordshare"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`passwordshare ${index + 1}`}
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
          {passwordshareError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">비번공유에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="wedding">
            인연이 생긴다면 결혼생각이 얼마나 있나요?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {weddingArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`wedding ${index + 1}`}
                  onChange={onChangeWedding}
                  checked={wedding == index + 1}
                  name="wedding"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`wedding ${index + 1}`}
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
          {weddingError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">결혼에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="wedding_dating">
            결혼 전에 적절하다고 판단하는 연애 기간은?
          </label>
          <ul className="grid w-full gap-2 grid-cols-2">
            {wedding_datingArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`wedding_dating ${index + 1}`}
                  onChange={onChangeWedding_dating}
                  checked={wedding_dating == index + 1}
                  name="wedding_dating"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`wedding_dating ${index + 1}`}
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
          {wedding_datingError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">결혼에 대한 생각을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="wedding_dating">
            선호하는 이성의 연령대는?
          </label>
        </div>
        <MultiRangeSlider
          min={20}
          max={49}
          onChange={({ min, max }) => onChangePrefer_age({ min, max })}
          usermin={user?.prefer_age_min || 20}
          usermax={user?.prefer_age_max || 49}
        />


        <div className="w-full justify-end flex items-center">
          <button type="submit" className="text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30 me-2 mb-2">
            <FaRegSave className="w-5 h-5 me-2 -ms-1" />
            연애/결혼관 업데이트
          </button>

        </div>

      </form>
    </>
  );
};

export default index;
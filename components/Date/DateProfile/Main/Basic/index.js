import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateUserBasicInfo, } from 'firebaseConfig';
import { updateBasicProfile, updateBasicProfileFalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import hangjungdong from 'components/Common/Address';
import { patchThumbimageDoneFalse } from 'slices/user';

const index = () => {

  const { user, updateBasicProfileSuccess, patchThumbimageDone } = useSelector(state => state.user);
  const dispatch = useDispatch();


  const updatenotify = () => toast('이미지 업데이트 완료!');
  useEffect(() => {
    if (patchThumbimageDone) {
      updatenotify();
      dispatch(patchThumbimageDoneFalse())
    }
  }, [dispatch, patchThumbimageDone])

  const updatenotifyProfile = () => toast('프로필 업데이트 완료!');
  // useEffect(() => {
  //   if (patchThumbimageDone) {
  //     updatenotifyProfile();
  //     dispatch(patchThumbimageDoneFalse())
  //   }
  // }, [dispatch, patchThumbimageDone])


  useEffect(() => {
    if (updateBasicProfileSuccess) {
      setUsernameError(false);
      setNicknameError(false);
      setReligionError(false);
      setBirthError(false);
      setTelError(false);
      setGenderError(false);
      setAddressError(false);
      setThumbimageError(false);
      updatenotifyProfile();
      dispatch(updateBasicProfileFalse());
    }
  }, [dispatch, updateBasicProfileSuccess])
  const thumbimage = user?.thumbimage;
  const [thumbimageError, setThumbimageError] = useState(false);

  const [username, setUsername] = useState(user?.username);
  const [usernameError, setUsernameError] = useState(false);
  const onChangeUsername = useCallback((e) => {
    setUsername(e.target.value);
    setUsernameError(false);
  }, [])

  const [nickname, setNickname] = useState(user?.nickname || "");
  const [nicknameError, setNicknameError] = useState(false);
  const onChangeNickname = useCallback((e) => {
    setNickname(e.target.value);
    setNicknameError(false);
  }, [])

  const [religion, setReligion] = useState(user?.religion || "");
  const [religionError, setReligionError] = useState(false);
  const onChangeReligion = useCallback(e => {
    setReligion(e.target.value);
    setReligionError(false);
  }, []);
  // function religion_check(religion) {
  //   var reg = /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
  //   return reg.test(religion);
  // }

  // 생년월일
  const standardYear = 1990;
  const [form, setForm] = useState(
    {
      year: parseInt(user?.birthday?.year),
      month: parseInt(user?.birthday?.month),
      day: parseInt(user?.birthday?.day),
    }
  );

  const onChangeYear = useCallback(
    e => {
      setForm({ ...form, year: e.target.value })
      setBirthError(false)
    },
    [form]
  );
  const onChangeMonth = useCallback(
    e => {
      setForm({ ...form, month: e.target.value })
      setBirthError(false)
    },
    [form]
  );
  const onChangeDay = useCallback(
    e => {
      setForm({ ...form, day: e.target.value })
      setBirthError(false)
    },
    [form]
  );

  const [birthError, setBirthError] = useState(false);
  const now = new Date();
  let yearsArr = [];
  for (let y = now.getFullYear(); y >= 1950; y -= 1) {
    yearsArr?.push(y);
  }
  let monthArr = [];
  for (let m = 1; m <= 12; m += 1) {
    if (m < 10) {
      // 날짜가 2자리로 나타나야 했기 때문에 1자리 월에 0을 붙혀준다
      monthArr?.push("0" + m.toString());
    } else {
      monthArr?.push(m.toString());
    }
  }
  let days = [];
  let date = new Date(form?.year, form?.month, 0).getDate();
  for (let d = 1; d <= date; d += 1) {
    if (d < 10) {
      // 날짜가 2자리로 나타나야 했기 때문에 1자리 일에 0을 붙혀준다
      days?.push("0" + d.toString());
    } else {
      days?.push(d.toString());
    }
  }

  const years = () => {
    const allYears = [];
    const thisYear = new Date().getFullYear();
    for (let i = thisYear; i >= thisYear - 40; i -= 1)
      allYears?.push(<option key={i} value={i}>{i}년</option>);
    return (
      <>
        <option key="" value="">년</option>
        {allYears}
      </>
    );
  };

  const months = () => {
    const monthNames = [
      "1월", "2월", "3월", "4월", "5월", "6월",
      "7월", "8월", "9월", "10월", "11월", "12월",
    ];
    return (
      <>
        <option key="" value="">월</option> {/* 선택창 초기값 */}
        {monthNames?.map((month, i) => (
          <option key={month} value={i + 1}>{month}</option>
        ))}
      </>
    );
  };

  // 전화번호
  const [tel, setTel] = useState(user?.phonenumber);
  const [telError, setTelError] = useState(false);
  const onChangeNumber = useCallback((e) => {
    const regex = /^[0-9\b -]{0,13}$/;
    setTel(e.target.value);
    if (regex.test(e.target.value)) {
      setTelError(false);
    } else {
      setTelError(true);
    }
  }, []);

  // 성별
  const [gender, setGender] = useState(user?.gender || "male");
  const [genderError, setGenderError] = useState(false);
  const onChangeGender = useCallback((e) => {
    setGender(e.target.value);
    setGenderError(false);
  }, []);

  // 주소
  const [address_sigugun, setAddress_sigugun] = useState(user?.address_sigugun || "");
  const [address_sido, setAddress_sido] = useState(user?.address_sido || "");
  const [addressError, setAddressError] = useState(false);
  const onChangeAddress_sigugun = useCallback((e) => {
    setAddress_sigugun(e.target.value);
    setAddressError(false);
  }, []);
  const onChangeAddress_sido = useCallback((e) => {
    setAddress_sido(e.target.value);
    setAddressError(false);
  }, [])

  const { sido, sigugun, dong } = hangjungdong;
  const sigugunList = hangjungdong?.sigugun;
  const resultArr = [];
  // const sigugunFunc = useCallback(() => {
  sigugunList?.map((v) => {
    v?.sido == address_sido ? resultArr?.push(v) : null
  }, [address_sido])


  const [defaultSido] = sido?.filter((item) => item?.sido == user?.address_sido, [])
  const [defaultSigugun] = sigugun?.filter((item) => item?.sido == user?.address_sido && item?.sigugun == user?.address_sigugun, [])

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!username || username?.length === 0) {
      document.getElementById('username').focus();
      return setUsernameError(true);
    }
    if (!nickname || nickname?.length === 0) {
      document.getElementById('nickname').focus();
      return setNicknameError(true);
    }
    if (!thumbimage || thumbimage?.length <= 1) {
      document.getElementById('thumbimage').focus();
      return setThumbimageError(true);
    }
    if (religion == '') {
      document.getElementById('religion 1').focus();
      return setReligionError(true);
    }
    if (gender == '') {
      document.getElementById('gender').focus();
      return setGenderError(true);
    }
    if (form?.year?.length === 0 || form?.month?.length === 0 || form?.day?.length === 0) {
      document.getElementById('birthyear').focus();
      return setBirthError(true);
    }
    if (tel == '') {
      document.getElementById('phone').focus();
      return setTelError(true);
    }
    if (!address_sido || address_sido == "") {
      document.getElementById('address').focus();
      return setAddressError(true);
    }
    if (!address_sigugun || address_sigugun == "") {
      document.getElementById('address').focus();
      return setAddressError(true);
    }
    const newForm = { year: parseInt(form?.year), month: parseInt(form?.month), day: parseInt(form?.day) }
    const res = await updateUserBasicInfo(
      username, nickname, newForm, religion, tel, gender, address_sido, address_sigugun
    );
    dispatch(updateBasicProfile(res))
  }, [thumbimage, username, nickname, religion, form?.year, form?.month, form?.day,
    tel, gender, address_sido, address_sigugun, dispatch])

  // const writeFinish = username && nickname && religion && form?.year && form?.month && form?.day && gender && tel && address_sigugun && address_sido;
  const religionArr = ["무교", "기독교", "천주교", "불교", "원불교", "유교",
    "대종교", "천도교", "대순리진회", "이슬람교", "힌두교", "유대교", "기타"
  ]

  return (
    <>
      <form
        className="px-2 w-full pt-4 pb-2 mb-1"
        onSubmit={onSubmit}
      >
        <p className='my-4 text-gray-500 text-[1.2rem] font-bold leading-8'>📝 기본정보</p>
        <div className="py-4">
          <span className="block mb-1 text-sm font-bold text-gray-400">
            이메일계정:&nbsp;{user?.email}</span>
        </div>
        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="username">
            이름
          </label>
          <input
            className={usernameError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="username"
            type="text"
            maxLength={20}
            placeholder="이름"
            onChange={onChangeUsername}
            defaultValue={user?.username}
          />
          {usernameError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">이름을 입력해주세요.</span>
              </div>
            </div>
            // <p className="text-xs mb-[1.5rem] italic text-red-500">이름을 입력해주세요.</p>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="nickname">
            닉네임
          </label>
          <input
            className={nicknameError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="nickname"
            type="text"
            maxLength={20}
            placeholder="닉네임"
            onChange={onChangeNickname}
            defaultValue={user?.nickname}
          />
          {nicknameError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">닉네임을 입력해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="gender">
            성별
          </label>
          <select
            className={genderError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="gender"
            type="gender"
            name="gender"

            placeholder="성별"
            onChange={onChangeGender}
            defaultValue={user?.gender || gender}
          >
            <option value="male" key="man">남자</option>
            <option value="female" key="woman">여자</option>
          </select>
          {genderError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">성별을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <div className="mb-4 md:mr-2 md:mb-0 w-[100%]">
            <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="firstName">
              생년월일(상대방에게 출생년도만 공개)
            </label>
            <div className="flex gap-2">

              <>
                <select
                  className={birthError ?
                    "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                    :
                    "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  }
                  id="birthyear"
                  placeholder="년"

                  onChange={onChangeYear}
                  defaultValue={parseInt(user?.birthday?.year) || ""}
                >
                  {years()}
                </select>
                <select
                  className={birthError ?
                    "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                    :
                    "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  }
                  id="birthmonth"

                  placeholder="월"
                  onChange={onChangeMonth}
                  defaultValue={parseInt(user?.birthday?.month) || ""}
                >
                  {months()}
                </select>
                <select
                  className={birthError ?
                    "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                    :
                    "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  }
                  defaultValue={parseInt(user?.birthday?.day) || ""}
                  onChange={onChangeDay}
                  id="birthday"
                  placeholder="일"

                >
                  {days?.map(item => (
                    <option value={item} key={item}>
                      {item}일
                    </option>
                  ))}
                </select>
              </>
              {/* : null} */}
            </div>
          </div>
          {birthError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">생년월일을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="tel">
            연락처('-'없이 숫자만 입력, 매칭성사시 상대에게 전달)
          </label>
          <input
            className={telError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="phone"
            type="tel"

            maxLength='11'
            placeholder="-없이 입력"
            onChange={onChangeNumber}
            defaultValue={user?.phonenumber}
          />
          {telError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">연락처를 입력해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="address">
            거주지 주소
          </label>

          <div>
            <div className='flex sm:flex-row flex-col gap-2'>
              <select
                className={addressError ?
                  "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                  :
                  "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                }
                defaultValue={defaultSido?.sido}
                onChange={(e) => onChangeAddress_sido(e)}>
                <option value="">시/도 선택</option>
                {sido?.map((el) => (
                  <option key={el?.codeNm} value={el?.sido}>
                    {el?.codeNm}
                  </option>
                ))}
              </select>

              <select
                className={addressError ?
                  "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                  :
                  "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                }
                defaultValue={defaultSigugun?.sigugun}
                id="address"
                onChange={(e) => onChangeAddress_sigugun(e)}>
                <option value="">구/군 선택</option>
                {resultArr?.map((el, index) => (
                  <option key={index} value={el?.sigugun}>
                    {el?.codeNm}
                  </option>
                ))}
              </select>
            </div>
            {addressError ? (
              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="sr-only">Info</span>
                <div>
                  <span className="font-medium">주소를 선택해주세요.</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="religion">
            종교(종교가 없을 경우 '무교'입력)
          </label>
          <ul className="flex w-full gap-2 items-start flex-wrap">
            {religionArr?.map((v, index) => (
              <li key={index + 1}>
                <input type="radio"
                  id={`religion ${index + 1}`}
                  onChange={onChangeReligion}
                  checked={religion == index + 1}
                  name="religion"
                  value={index + 1}
                  className="opacity-0 w-0 h-0 absolute peer" />
                <label htmlFor={`religion ${index + 1}`}
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
          {religionError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">종교를 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>
        <div className='w-full' id="thumbimage">
          {thumbimageError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">프로필 사진을 등록해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>
        <div className="w-full justify-end flex items-center">
          {/* {writeFinish ? */}
          <button type="submit"
            className="my-2 px-6 text-md py-4 font-bold text-white bg-[#4173f4] hover:bg-[#1C52DC] focus:outline-none focus:shadow-outline rounded-lg">
            기본정보 업데이트</button>
          {/* :
            <div
              className="my-2 px-6 text-md py-4 font-bold text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:shadow-outline rounded-lg">
              기본정보 업데이트</div>
          } */}
        </div>

      </form>
    </>

  );
};


export default index;
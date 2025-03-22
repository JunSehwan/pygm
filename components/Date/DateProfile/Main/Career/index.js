import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auth, updateMycompanyInfo } from 'firebaseConfig';
import { patchMycompanyInfo, patchMycompanyInfofalse } from 'slices/user';
import toast, { Toaster } from 'react-hot-toast';
import hangjungdong from 'components/Common/Address';
import CareerUpload from './CareerUpload';

const index = () => {

  const { user, patchMycompanyInfoDone } = useSelector(state => state.user);
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

  const updateCareerProfileDone = () => toast(`스펙정보 업데이트 완료! ${trueCount}/9개 섹션 입력완료!`);

  useEffect(() => {
    if (patchMycompanyInfoDone) {
      setEducationError(false);
      setSchoolError(false);
      setJobError(false);
      setCompanyError(false);
      setJobdocumentError(false);
      setDutyError(false);
      setSalaryError(false);
      setCompany_locationError(false);
      updateCareerProfileDone();
      dispatch(patchMycompanyInfofalse());
    }
  }, [dispatch, patchMycompanyInfoDone])

  const [education, setEducation] = useState(user?.education || "");
  const [educationError, setEducationError] = useState(false);
  const onChangeEducation = useCallback((e) => {
    setEducation(e.target.value);
    setEducationError(false);
  }, [])

  const [school, setSchool] = useState(user?.school || "");
  const [schoolError, setSchoolError] = useState(false);
  const onChangeSchool = useCallback((e) => {
    setSchool(e.target.value);
    setSchoolError(false);
  }, [])

  const [school_open, setSchool_open] = useState(user?.school_open || true);
  const onChangeSchool_open = useCallback((e) => {
    setSchool_open(e.target.checked);
  }, [])

  const [job, setJob] = useState(user?.job || "");
  const [jobError, setJobError] = useState(false);
  const onChangeJob = useCallback(e => {
    setJob(e.target.value);
    setJobError(false);
  }, []);

  const [company, setCompany] = useState(user?.company || "");
  const [companyError, setCompanyError] = useState(false);
  const onChangeCompany = useCallback(e => {
    setCompany(e.target.value);
    setCompanyError(false);
  }, []);

  const [company_open, setCompany_open] = useState(user?.company_open || true);
  const onChangeCompany_open = useCallback((e) => {
    setCompany_open(e.target.checked);
  }, [])

  const [duty, setDuty] = useState(user?.duty || "");
  const [dutyError, setDutyError] = useState(false);
  const onChangeDuty = useCallback((e) => {
    setDuty(e.target.value);
    setDutyError(false);
  }, [])

  const [salary, setSalary] = useState(user?.salary || "");
  const [salaryError, setSalaryError] = useState(false);
  const onChangeSalary = useCallback((e) => {
    setSalary(e.target.value);
    setSalaryError(false);
  }, [])

  // 주소
  const [company_location_sigugun, setCompany_location_sigugun] = useState(user?.company_location_sigugun || "");
  const [company_location_sido, setCompany_location_sido] = useState(user?.company_location_sido || "");
  const [company_locationError, setCompany_locationError] = useState(false);
  const onChangeCompany_location_sigugun = useCallback((e) => {
    setCompany_location_sigugun(e.target.value);
    setCompany_locationError(false);
  }, []);
  const onChangeCompany_location_sido = useCallback((e) => {
    setCompany_location_sido(e.target.value);
    setCompany_locationError(false);
  }, [])

  const { sido, sigugun, dong } = hangjungdong;
  const sigugunList = hangjungdong?.sigugun;
  const resultArr = [];
  // const sigugunFunc = useCallback(() => {
  sigugunList?.map((v) => {
    v?.sido == company_location_sido ? resultArr?.push(v) : null
  }, [company_location_sido])

  const [defaultSido] = sido?.filter((item) => item?.sido == user?.company_location_sido, [])
  const [defaultSigugun] = sigugun?.filter((item) => item?.sido == user?.company_location_sido && item?.sigugun == user?.company_location_sigugun, [])

  const jobdocument = user?.jobdocument
  // const [jobdocument, setJobdocument] = useState(user?.jobdocument || "");
  const [jobdocumentError, setJobdocumentError] = useState(false);
  // const onChangeJobdocument = useCallback((e) => {
  //   setJobdocument(e.target.value);
  //   setJobdocumentError(false);
  // }, [])

  // useEffect(() => {
  //   if (!user?.jobdocument || user?.jobdocument?.length === 0
  //   )
  //     setJobdocumentError(true);
  //   else {
  //     setJobdocumentError(false);
  //   }
  // }, [user?.jobdocument])

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!education || education?.length === 0) {
      document.getElementById('education').focus();
      return setEducationError(true);
    }
    if (!school || school?.length === 0) {
      document.getElementById('school').focus();
      return setSchoolError(true);
    }
    if (!job || job?.length === 0) {
      document.getElementById('job').focus();
      return setJobError(true);
    }
    if (!company || company?.length === 0) {
      document.getElementById('company').focus();
      return setCompanyError(true);
    }
    if (!duty || duty?.length === 0) {
      document.getElementById('duty').focus();
      return setDutyError(true);
    }
    if (!salary || salary?.length === 0) {
      document.getElementById('salary').focus();
      return setSalaryError(true);
    }
    if (!jobdocument || jobdocument?.length === 0) {
      document.getElementById('jobdocument').focus();
      return setJobdocumentError(true);
    }
    if (!company_location_sido || company_location_sido == "") {
      document.getElementById('company_location').focus();
      return setCompany_locationError(true);
    }
    if (!company_location_sigugun || company_location_sigugun == "") {
      document.getElementById('company_location').focus();
      return setCompany_locationError(true);
    }

    const res = await updateMycompanyInfo(
      education, school, school_open, job, company, company_open,
      salary, duty, company_location_sido, company_location_sigugun,       //  duty, salary, company_location
    );
    dispatch(patchMycompanyInfo(res))
  }, [jobdocument, education, school, school_open, job, company, company_open,
    salary, duty, company_location_sido, company_location_sigugun,
    //  duty, salary, company_location, 
    dispatch])



  return (
    <>
      <form
        className="px-2 w-full pt-4 pb-2 mb-1"
        onSubmit={onSubmit}
      >
        <div className='py-4 w-full h-0 border-b border-solid border-gray-300'></div>

        <p className='my-4 text-gray-500 text-[1.2rem] font-bold leading-8'>📝 뛰어난스펙</p>

        {/* 경력입력 */}
        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="education">
            학력
          </label>
          <select
            className={educationError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="education"
            type="education"
            name="education"

            placeholder="성별"
            onChange={onChangeEducation}
            defaultValue={user?.education || education}
          >
            <option value="" key="99">선택</option>
            <option value={1} key="1">초등학교 졸업</option>
            <option value={2} key="2">중학교 졸업</option>
            <option value={3} key="3">고등학교 졸업</option>
            <option value={4} key="4">전문대 재학</option>
            <option value={5} key="5">전문대 졸업</option>
            <option value={6} key="6">특수/기타학교 재학</option>
            <option value={7} key="7">특수/기타학교 졸업</option>
            <option value={8} key="8">4년제대학 재학</option>
            <option value={9} key="9">4년제대학 졸업</option>
            <option value={10} key="10">대학원 재학</option>
            <option value={11} key="11">석사학위</option>
            <option value={12} key="12">박사학위</option>
          </select>
          {educationError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">학력을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="school">
            최종학교명(졸업/재학중)
          </label>
          <input
            className={schoolError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="school"
            type="text"
            maxLength={30}
            placeholder="학교명"
            onChange={onChangeSchool}
            defaultValue={user?.school}
          />
          {schoolError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">졸업(재학)학교를 작성해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-start pb-4">
          <div className="flex items-center h-5">
            <input id="school_open" type="checkbox"
              onChange={onChangeSchool_open}
              checked={school_open}
              className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" />
          </div>
          <label htmlFor="school_open"
            className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"><span className="text-gray-600 hover:underline dark:text-blue-500">
              학교 공개(스마트함을 어필할 수 있습니다)</span></label>
        </div>

        {/* 경력입력 */}
        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="job">
            직업
          </label>
          <select
            className={jobError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="job"
            type="job"
            name="job"

            placeholder="직업"
            onChange={onChangeJob}
            defaultValue={user?.job || ""}
          >
            <option value="" key="99">선택</option>
            <option value={1} key="1">대기업</option>
            <option value={2} key="2">중견기업</option>
            <option value={3} key="3">공기업</option>
            <option value={4} key="4">공무원</option>
            <option value={5} key="5">공공기관</option>
            <option value={6} key="6">외국계</option>
            <option value={7} key="7">전문직</option>
            <option value={8} key="8">금융권</option>
            <option value={9} key="9">교육계</option>
            <option value={10} key="10">프리랜서</option>
            <option value={11} key="11">사업가</option>
            <option value={12} key="12">기타</option>
          </select>
          {jobError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">직업을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>


        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="company">
            재직회사명
          </label>
          <input
            className={companyError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="company"
            type="text"
            maxLength={30}
            placeholder="회사명"
            onChange={onChangeCompany}
            defaultValue={user?.company}
          />
          {companyError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">회사명을 작성해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-start pb-4">
          <div className="flex items-center h-5">
            <input id="company_open" type="checkbox"
              onChange={onChangeCompany_open}
              checked={company_open} className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800" />
          </div>
          <label htmlFor="company_open" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"><span className="text-gray-600 hover:underline dark:text-blue-500">
            직장명 공개(능력을 어필할 수 있습니다)</span></label>
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="duty">
            주요업무
          </label>
          <input
            className={dutyError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="duty"
            type="text"
            maxLength={100}
            placeholder="업무를 간단히 작성해주세요"
            onChange={onChangeDuty}
            defaultValue={user?.duty}
          />
          {dutyError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">주요 업무를 작성해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>




        <CareerUpload
        />
        <div className='w-full' id="jobdocument">
          {jobdocumentError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">증명문서를 등록해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="salary">
            연봉수준
          </label>
          <select
            className={salaryError ?
              "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
              :
              "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            }
            id="salary"
            type="salary"
            name="salary"

            placeholder="연봉수준"
            onChange={onChangeSalary}
            defaultValue={user?.salary || salary}
          >
            <option value="" key="99">선택</option>
            <option value={20} key="20">비공개</option>
            <option value={1} key="1">2,000만원 이하</option>
            <option value={2} key="2">2,000 ~ 2,500만원</option>
            <option value={3} key="3">2,500 ~ 3,000만원</option>
            <option value={4} key="4">3,000 ~ 3,500만원</option>
            <option value={5} key="5">3,500 ~ 4,000만원</option>
            <option value={6} key="6">4,000 ~ 4,500만원</option>
            <option value={7} key="7">4,500 ~ 5,000만원</option>
            <option value={8} key="8">5,000 ~ 5,500만원</option>
            <option value={9} key="9">5,500 ~ 6,000만원</option>
            <option value={10} key="10">6,000 ~ 7,000만원</option>
            <option value={11} key="11">7,000 ~ 8,000만원</option>
            <option value={12} key="12">8,000 ~ 9,000만원</option>
            <option value={13} key="13">9,000 ~ 1억원</option>
            <option value={14} key="14">1억원 이상</option>
          </select>
          {salaryError ? (
            <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
              <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
              </svg>
              <span className="sr-only">Info</span>
              <div>
                <span className="font-medium">연봉수준을 선택해주세요.</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="py-4">
          <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="company_location">
            근무지 주소
          </label>

          <div>
            <div className='flex sm:flex-row flex-col gap-2'>
              <select
                className={company_locationError ?
                  "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                  :
                  "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                }
                defaultValue={defaultSido?.sido}
                onChange={(e) => onChangeCompany_location_sido(e)}>
                <option value="">시/도 선택</option>
                {sido?.map((el) => (
                  <option key={el?.codeNm} value={el?.sido}>
                    {el?.codeNm}
                  </option>
                ))}
              </select>

              <select
                className={company_locationError ?
                  "block w-full p-3 text-gray-900 border border-red-300 rounded-lg bg-red-50 sm:text-md focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-red-500 dark:focus:border-red-500"
                  :
                  "block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                }
                defaultValue={defaultSigugun?.sigugun}
                id="company_location"
                onChange={(e) => onChangeCompany_location_sigugun(e)}>
                <option value="">구/군 선택</option>
                {resultArr?.map((el, index) => (
                  <option key={index} value={el?.sigugun}>
                    {el?.codeNm}
                  </option>
                ))}
              </select>
            </div>
            {company_locationError ? (
              <div className="flex items-center p-3 mt-2 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800" role="alert">
                <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <span className="sr-only">Info</span>
                <div>
                  <span className="font-medium">주소를 작성해주세요.</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="w-full justify-end flex items-center">
          <button type="submit"
            className="my-2 px-6 text-md py-4 font-bold text-white bg-[#4173f4] hover:bg-[#1C52DC]  focus:outline-none focus:shadow-outline rounded-lg">
            스펙 업데이트</button>
        </div>

      </form>
    </>
  );
};

export default index;
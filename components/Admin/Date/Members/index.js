import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from 'components/Common/Modal/Modal';
import { FaRegSave } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { patchWinkUp, patchWinkUpDoneFalse } from 'slices/user';
import { updateWinkUp } from 'firebaseConfig';

const index = ({ user, index }) => {

  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const openModal = useCallback(() => {
    document.body.style.overflow = "hidden";
    setOpen(true);
  }, [])
  const closeModal = useCallback(() => {
    document.body.style.overflow = "unset";
    setOpen(false);
  }, [])
  const { patchWinkUpDone } = useSelector(state => state.user);
  // const [onSetting, setOnSetting] = useState(false);
  // const openSettingModal = useCallback(() => {
  //   document.body.style.overflow = "hidden";
  //   setOnSetting(true);
  // }, [])
  // const closeSettingModal = useCallback(() => {
  //   document.body.style.overflow = "unset";
  //   setOnSetting(false);
  // }, [])

  // const updateDone = () => toast(`업데이트 완료!`);
  useEffect(() => {
    if (patchWinkUpDone) {
      // setWinkError(false);
      // setProfilePendingError(false);
      // updateDone();
      setOpen(false);
      dispatch(patchWinkUpDoneFalse());
    }
  }, [dispatch, patchWinkUpDone])

  const [wink, setWink] = useState(user?.wink || 0);
  // const [winkError, setWinkError] = useState(false);
  const onChangeWink = useCallback((e) => {
    setWink(e.target.value);
    // setWinkError(false);
  }, [])

  const [profilePending, setProfilePending] = useState(user?.date_pending || false);
  // const [profilePendingError, setProfilePendingError] = useState(false);
  const onChangeProfilePending = useCallback((e) => {
    setProfilePending(prev => !prev);
    // setProfilePendingError(false);
  }, [])


  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    // if (!wink || wink?.length === 0) {
    //   document.getElementById('wink').focus();
    //   return setWinkError(true);
    // }
    // if (!updateDone || updateDone?.length === 0) {
    //   document.getElementById('profilePending').focus();
    //   return setUpdateDoneError(true);
    // }
    const res = await updateWinkUp(
      user?.userID, wink, profilePending, user?.date_profile_finished
    );
    dispatch(patchWinkUp(res))
  }, [wink, profilePending, dispatch])

  return (

    <>
      <div className=''>
        <button className='w-full flex flex-row items-center text-left hover:bg-slate-200' onClick={openModal}>
          <div className="p-4 border-b border-slate-200 align-middle w-[250px]">
            <div className="flex items-center gap-3 text-left">
              <img src={user?.thumbimage?.length === 1 ? user?.thumbimage : user?.thumbimage[0]}
                alt="John Michael" className="relative inline-block h-9 w-9 !rounded-full object-cover object-center" />
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-slate-700">
                  {user?.username}
                </p>
                <p
                  className="text-sm text-slate-500">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-slate-200">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-slate-700">
                {user?.phonenumber}
              </p>
              <p
                className="text-sm text-slate-500">
                {user?.gender}
              </p>
            </div>
          </div>
          <div className="p-4 border-b border-slate-200">
            <div className="w-max">
              <div
                className="relative grid items-center px-2 py-1 font-sans text-xs font-bold text-green-900 uppercase rounded-md select-none whitespace-nowrap bg-green-500/20">
                <span className="">{user?.wink || 0}</span>
              </div>
            </div>
          </div>
          <div className="p-4 border-b border-slate-200">
            <p className="text-sm text-slate-500">
              {user?.timestamp?.slice(0, 10)}
            </p>
          </div>
          {/* <td className="p-4 border-b border-slate-200">
          <button
            onClick={openSettingModal}
            className="relative h-10 max-h-[40px] w-10 max-w-[40px] select-none rounded-lg text-center align-middle font-sans text-xs font-medium uppercase text-slate-900 transition-all hover:bg-slate-900/10 active:bg-slate-900/20 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
            type="button">
            <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
                className="w-4 h-4">
                <path
                  d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z">
                </path>
              </svg>
            </span>
          </button>
        </td> */}
        </button>
      </div>
      {open &&
        <Modal
          // onOpenPointModal={onOpenPointModal}
          // onClosePointModal={onClosePointModal}
          open={open}
          onClose={closeModal}
          title={user?.username}
          visible={open}
          target={user}
        >
          <section className='px-4'>
            <form
              className="block antialiased font-sans text-base leading-relaxed mb-4 font-normal text-gray-600"
              onSubmit={onSubmit}
            >
              <div className='flex flex-row gap-4 items-baseline'>
                <div className="py-4">
                  <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="wink">
                    윙크수정
                  </label>
                  <input
                    className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    id="wink"
                    type="number"
                    maxLength={2}
                    // placeholder="업무를 간단히 작성해주세요"
                    onChange={onChangeWink}
                    defaultValue={user?.wink || 0}
                  />
                </div>
                <div className="py-4">
                  <label className="block mb-2 text-md font-bold text-gray-700 " htmlFor="updateDone">
                    프로필작성중 해제
                  </label>
                  <input
                    className="block p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 sm:text-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    id="profilePending"
                    type="checkbox"
                    checked={profilePending}
                    // placeholder="업무를 간단히 작성해주세요"
                    onChange={onChangeProfilePending}
                    defaultValue={user?.date_pending || false}
                  />
                </div>
              </div>
              <button type="submit" className="text-white bg-[#050708] hover:bg-[#050708]/90 focus:ring-4 focus:outline-none focus:ring-[#050708]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#050708]/50 dark:hover:bg-[#050708]/30 me-2 mb-2">
                <FaRegSave className="w-5 h-5 me-2 -ms-1" />
                프로필완료 업데이트
              </button>
            </form>



            <hr className="my-6 border-blue-gray-50" />
            <h5 className="block antialiased tracking-normal font-sans text-xl leading-snug text-inherit mt-6 mb-1 font-semibold !text-black">
              기본정보
            </h5>
            <div className="block antialiased font-sans text-base leading-relaxed mb-4 font-normal text-gray-600">
              <p className='text-sm mb-2'>ID : {user?.userID}</p>
              <p className='text-sm mb-2'>번호 :{user?.phonenumber}</p>
              <p className='text-sm mb-2'>닉네임 : {user?.nickname}</p>
              <p className='text-sm mb-2'>이메일 : {user?.email}</p>
              <p className='text-sm mb-2'>생일 :{user?.birthday?.year}</p>
              <p className='text-sm mb-2'>성별 :{user?.gender}</p>
              <p className='text-sm mb-2'>이미지 :</p>
              {user?.thumbimage?.length <= 1 ?
                <img src={user?.thumbimage}
                  alt="John Michael" className="relative inline-block h-16 w-16 !rounded-full object-cover object-center" />
                :
                user?.thumbimage?.map((v, i) => (
                  <img src={v}
                    key={i + 1}
                    alt="John Michael" className="relative inline-block h-16 w-16 !rounded-full object-cover object-center" />
                ))}
              <h5 className="block antialiased tracking-normal font-sans text-xl leading-snug text-inherit mt-6 mb-1 font-semibold !text-black">
                학력 등
              </h5>
              <p className='text-sm mb-2'>종교 : {user?.religion}</p>
              <p className='text-sm mb-2'>주소 : {user?.address_sido}</p>
              <p className='text-sm mb-2'>시구군 : {user?.address_sigugun}</p>
              <p className='text-sm mb-2'>교육 : {user?.education}</p>
              <p className='text-sm mb-2'>학교 : {user?.school}</p>
              <p className='text-sm mb-2'>학교공개 :{user?.school_open}</p>
              <p className='text-sm mb-2'>직업 :{user?.job}</p>
              <p className='text-sm mb-2'>회사 : {user?.company}</p>
              <p className='text-sm mb-2'>회사공개 : {user?.company_open}</p>
              <p className='text-sm mb-2'>직장증거 :</p>
              {user?.jobdocument?.map((v, i) => (
                <img src={v}
                  key={i + 1}
                  alt="John Michael" className="relative inline-block h-24 w-24 rounded-md object-cover object-center" />
              ))}
              <h5 className="block antialiased tracking-normal font-sans text-xl leading-snug text-inherit mt-6 mb-1 font-semibold !text-black">
                부가정보
              </h5>
              <p className='text-sm mb-2'>업무 : {user?.duty}</p>
              <p className='text-sm mb-2'>연봉 : {user?.salary}</p>
              <p className='text-sm mb-2'>회사 시 : {user?.company_location_sido}</p>
              <p className='text-sm mb-2'>회사 동 : {user?.company_location_sigugun}</p>
              <p className='text-sm mb-2'>MBTI :{user?.mbti_ei}{user?.mbti_sn}{user?.mbti_tf}{user?.mbti_jp}</p>
              <p className='text-sm mb-2'>취미 : {user?.hobby}</p>
              <p className='text-sm mb-2'>주량 : {user?.drink}</p>
              <p className='text-sm mb-2'>건강 : {user?.health}</p>
              <p className='text-sm mb-2'>핫플 : {user?.hotplace}</p>
              <p className='text-sm mb-2'>여행 : {user?.tour}</p>
              <p className='text-sm mb-2'>여행선호 : {user?.tourlike}</p>
              <p className='text-sm mb-2'>여행목적 : {user?.tourpurpose}</p>
              <p className='text-sm mb-2'>취미공유 :{user?.hobbyshare}</p>
              <p className='text-sm mb-2'>흥미 :{user?.interest}</p>
              <p className='text-sm mb-2'>이성친구 : {user?.opfriend}</p>
              <p className='text-sm mb-2'>친구만남 :{user?.friendmeeting}</p>
              <p className='text-sm mb-2'>장기연애 :{user?.longdistance}</p>
              <p className='text-sm mb-2'>데이트주기 :{user?.datecycle}</p>
              <p className='text-sm mb-2'>데이트환상 :{user?.dateromance}</p>
              <p className='text-sm mb-2'>연락 : {user?.contact}</p>
              <p className='text-sm mb-2'>연락주기 : {user?.contactcycle}</p>
              <p className='text-sm mb-2'>비번공유 : {user?.passwordshare}</p>
              <p className='text-sm mb-2'>결혼 : {user?.wedding}</p>
              <p className='text-sm mb-2'>결혼데이트 : {user?.wedding_dating}</p>
              <p className='text-sm mb-2'>최저나이 : {user?.prefer_age_min}</p>
              <p className='text-sm mb-2'>최고나이 : {user?.prefer_age_max}</p>
              <p className='text-sm mb-2'>경력목표 :{user?.career_goal}</p>
              <p className='text-sm mb-2'>주말할일 :{user?.living_weekend}</p>
              <p className='text-sm mb-2'>일상소비 : {user?.living_consume}</p>
              <p className='text-sm mb-2'>일상펫 :{user?.living_pet}</p>
              <p className='text-sm mb-2'>타투 :{user?.living_tatoo}</p>
              <p className='text-sm mb-2'>흡연 : {user?.living_smoke}</p>
              <p className='text-sm mb-2'>매력포인트 : {user?.living_charming}</p>
              <p className='text-sm mb-2'>종교중요 : {user?.religion_important}</p>
              <p className='text-sm mb-2'>종교방문 : {user?.religion_visit}</p>
              <p className='text-sm mb-2'>종교인정 : {user?.religion_accept}</p>
              <p className='text-sm mb-2'>흥미음식 : {user?.food_taste}</p>
              <p className='text-sm mb-2'>좋은음식 :{user?.food_like}</p>
              <p className='text-sm mb-2'>싫은음식 : {user?.food_dislike}</p>
              <p className='text-sm mb-2'>채식주의 :{user?.food_vegetarian}</p>
              <p className='text-sm mb-2'>매운거 : {user?.food_spicy}</p>
              <p className='text-sm mb-2'>다이어트 : {user?.food_diet}</p>
              <p className='text-sm mb-2'>인포씬 :{user?.infoseen}</p>
              <p className='text-sm mb-2'>윙크수 : {user?.wink}</p>
              <p className='text-sm mb-2'>휴면중 : {user?.date_sleep}</p>
              <p className='text-sm mb-2'>탈퇴중 : {user?.withdraw}</p>
              <p className='text-sm mb-2'>데이트받은 수 : {user?.datecard?.length}</p>
              <p className='text-sm mb-2'>마지막소개 :{user?.date_lastIntroduce}</p>
              <p className='text-sm mb-2'>가입일 : {user?.timestamp}</p>
              <p className='text-sm mb-2'>좋아요수 : {user?.likes?.length}</p>
              <p className='text-sm mb-2'>좋아요받은수 :{user?.liked?.length}</p>
              <p className='text-sm mb-2'>싫어요수 :{user?.dislikes?.length}</p>
              <p className='text-sm mb-2'>싫어요받은수 : {user?.disliked?.length}</p>
              <p className='text-sm mb-2'>시작일자 : {user?.startAt}</p>

              <p className='text-sm mb-2'>프로필작성 완료 : {user?.date_profile_finished}</p>
              <p className='text-sm mb-2'>작성진행중 : {user?.date_pending}</p>
            </div>

          </section>
        </Modal>
      }

      {/* {open &&
        <Modal
          // onOpenPointModal={onOpenPointModal}
          // onClosePointModal={onClosePointModal}
          open={openSettingModal}
          onClose={closeSettingModal}
          title={user?.username}
          visible={onSetting}
          target={user}
        >
          <section className='px-4'>
            <h5 className="block antialiased tracking-normal font-sans text-xl leading-snug text-inherit mt-6 mb-1 font-semibold !text-black">
              기본정보
            </h5>
            <div className="block antialiased font-sans text-base leading-relaxed mb-4 font-normal text-gray-600">



            </div>
            <hr className="my-6 border-blue-gray-50" />
          </section>
        </Modal>
      } */}
    </>
  );
};


index.propTypes = {
  user: PropTypes.object,
  index: PropTypes.number,
};

export default index;
import React, { useEffect, useState, useCallback, createRef } from 'react';
import Image from 'next/image';
import logo from '/public/logo/pygm.png';
import AuthModal from 'components/Auth/AuthModal';
import Link from 'next/link';
import { auth, logOut } from 'firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import AlertModal from 'components/Common/Modal/AlertModal';
import { signOut } from 'slices/user';
import profilePic from '/public/image/icon/avatar.png';
import { useRouter } from 'next/router';

import { RiNewspaperFill, RiUserSearchFill } from "react-icons/ri";
import { AiFillMessage, AiFillSetting, AiOutlineMessage } from "react-icons/ai";
import { BsFillArrowThroughHeartFill, BsFillCaretDownFill, BsFillHouseFill, BsFillPersonBadgeFill, BsMegaphoneFill } from "react-icons/bs";
import { FaStore, FaUserCircle } from "react-icons/fa";
import { BsFillBellFill, BsQuestionCircleFill } from "react-icons/bs";
import { MdMessage, MdDashboard } from "react-icons/md";
import { IoLogOut } from "react-icons/io5";
import { BiNews } from 'react-icons/bi';

const index = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const modalEl = createRef();
  const { user,
    // signUpSuccess 
  } = useSelector(state => state.user);
  const [display, setDisplay] = useState(false);
  // 스크롤 인식, 스타일링
  const [ScrollY, setScrollY] = useState(0); // window? 의 pageYOffset값을 저장 
  const [ScrollActive, setScrollActive] = useState(false);
  function handleScroll() {
    if (ScrollY > 100) {
      setScrollY(window?.pageYOffset);
      setScrollActive(true);
    } else {
      setScrollY(window?.pageYOffset);
      setScrollActive(false);
    }
  }
  useEffect(() => {
    function scrollListener() { window?.addEventListener("scroll", handleScroll); } //  window? 에서 스크롤을 감시 시작
    scrollListener(); // window? 에서 스크롤을 감시
    return () => { window?.removeEventListener("scroll", handleScroll); }; //  window? 에서 스크롤을 감시를 종료
  });

  // useEffect(() => {
  //   if (router?.pathname === "/about" || router?.pathname === "/about/Service" || router?.pathname === "/about/Privacy" || router?.pathname === "/signin" || router?.pathname == "/signup" || router?.pathname == "/onboarding") {
  //     setDisplay(true);
  //   } else {
  //     setDisplay(false);
  //   }
  // }, [router?.pathname])

  const handleClickOutside = (event) => {
    if (toggle === true && !modalEl?.current?.contains(event.target))
      setToggle(false);
  };
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  const [open, setOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleCancel = () => {
    setOpen(false);
  };

  const handleOpenModal = () => {
    document.body.style.overflow = "hidden";
    setOpenModal(true);
  };
  const handleCancelModal = () => {
    document.body.style.overflow = "unset";
    setOpenModal(false);
  };

  const [toggle, setToggle] = useState(false);
  const toggleDropdown = () => { setToggle(prev => !prev); };

  const [logoutConfirmModal, setLogoutConfirmModal] = useState(false);
  const openLogoutConformModal = () => {
    document.body.style.overflow = "hidden";
    setLogoutConfirmModal(true)
  };
  const closeLogoutConformModal = () => {
    document.body.style.overflow = "unset";
    setLogoutConfirmModal(false)
  };
  const onClickLogout = useCallback(() => {
    setLogoutConfirmModal(true);
    document.body.style.overflow = "hidden";
    setToggle(false);
    setOpen(false);
  }, [])
  console.log(router?.pathname);
  const logoutConfirm = useCallback(async () => {
    const res = await logOut();
    dispatch(signOut({
    }));
    setLogoutConfirmModal(false);
    document.body.style.overflow = "unset";
  }, [dispatch])

  // const onClickSignup = useCallback(() => {
  //   setToggle(false);
  //   setOpen(false);
  //   router.push("/signup");
  // }, [router])

  const onClickSetting = useCallback(() => {
    setToggle(false);
    setOpen(false);
    router.push("/setting");
  }, [router])

  // const onClickLogin = useCallback(() => {
  //   router.push("/signin");
  // }, [router])

  const onClickProfile = useCallback(() => {
    router.push("/date/profile");
    setToggle(false);
    setOpen(false);
  }, [router])

  const onClickAddBoard = useCallback(() => {
    router.push("/board/add");
    setToggle(false);
    setOpen(false);
  }, [router])

  const onClickDatecards = useCallback(() => {
    router.push("/date/cards");
    setToggle(false);
    setOpen(false);
  }, [router])

  const onClickDateboard = useCallback(() => {
    router.push("/date/board");
    setToggle(false);
    setOpen(false);
  }, [router])


  const onClickHome = useCallback(() => {
    router.push("/date/home");
    setToggle(false);
    setOpen(false);
  }, [router])

  const onClickStore = useCallback(() => {
    router.push("/date/store");
    setToggle(false);
    setOpen(false);
  }, [router])
  const onClickDashboard = useCallback(() => {
    // window?.open('/dashboard', '_blank')
    router.push("/dashboard");
    setToggle(false);
    setOpen(false);
  }, [])

  const [data, setData] = useState();
  useEffect(() => {
    async function fetchAndSetUser() {
      try {
        if (user) {
          setData([]);
          // const result = await getJobofferedByUserId(user?.userID);
          // const coccocresult = await getCoccocedByUserId(user?.userID);
          // setData([...result, ...coccocresult]);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchAndSetUser();
  }, [user?.userID, findNotRead, user]);
  var findNotRead = data?.filter(obj => obj?.answer == 3 || !obj?.answer);
  // const [conversationData, setConversationData] = useState();
  // useEffect(() => {
  //   async function fetchAndSetUser() {
  //     try {
  //       if (user) {
  //         setConversationData([]);
  //         const result = await getConversationByUserId(user?.userID);
  //         setConversationData(result);
  //       }
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }
  //   fetchAndSetUser();
  // }, [user?.userID, findNotReadConversation, user]);
  // var findNotReadConversation = conversationData?.filter(obj => (obj?.lastSender !== user?.userID && obj?.lastSeener !== user?.userID) && (obj?.lastSeener && obj?.lastSender));




  return (
    <>
      <nav className={`${display === true && "hidden"} top-0 transition-all fixed z-10 bg-white w-full ${ScrollActive === true && "bg-opacity-70 shadow-md backdrop-blur-sm"} `}>
        <div className="mx-auto px-2 sm:px-6">
          <div className={`flex justify-between items-center border-b-1 border-gray-100 py-2 ${ScrollActive === true && "border-0"} justify-start md:space-x-10`}>
            <div className="flex justify-start">
              <Link href={`${user ? "/date/home" : "/"}`}>
                <div>
                  <span className="sr-only">PYGM</span>
                  <Image
                    src={logo}
                    width={60}
                    alt="logo"
                    height={60}
                    unoptimized
                  />
                </div>
              </Link>
            </div>
            <>
              <div className="flex items-center justify-center md:flex">
                <button
                  className={`relative md:min-w-[89.33px] hover:bg-gray-100 py-1 rounded-md hover:text-gray-700 px-[2.7vw] transition-all ${router?.pathname === "/date/home" || router?.pathname?.includes("/date/home") ? "text-[#4979f5]" : "text-gray-400"}`}
                  onClick={onClickHome}>
                  <div className='flex flex-col items-center'>
                    <BsFillHouseFill className='w-7 h-7' />
                    <span className='mt-[2px] text-sm hidden md:inline'>홈</span>
                  </div>
                  {findNotRead && findNotRead?.length !== 0 &&
                    <div className='top-[17px] p-0.5 text-white bg-red-500 flex mr-[-41px] mt-[-20px] shadow text-center text-xs rounded-full w-[18px] h-[18px] items-center justify-center z-5 absolute'>
                      {findNotRead?.length}
                    </div>
                  }
                </button>
                <button
                  className={`relative md:min-w-[89.33px] hover:bg-gray-100 py-1 rounded-md hover:text-gray-700 px-[2.7vw] transition-all ${router?.pathname === "/date/cards" || router?.pathname?.includes("/date/cards") ? "text-[#4979f5]" : "text-gray-400"}`}
                  onClick={onClickDatecards}>
                  <div className='flex flex-col items-center'>
                    <BsFillPersonBadgeFill className='w-7 h-7' />
                    <span className='mt-[2px] text-sm hidden md:inline'>소개카드</span>
                  </div>
                </button>
                {/* FaBuilding
                  TiNews */}
                <button
                  className={`relative md:min-w-[89.33px] hover:bg-gray-100 py-1 rounded-md hover:text-gray-700 px-[2.7vw] transition-all ${router?.pathname === "/date/board" || router?.pathname?.includes("/date/board") ? "text-[#4979f5]" : "text-gray-400"}`}
                  onClick={onClickDateboard}>
                  <div className='flex flex-col items-center'>
                    <BsFillArrowThroughHeartFill className='w-7 h-7' />
                    <span className='mt-[2px] text-sm hidden md:inline'>윙크</span>
                  </div>
                </button>

                <button
                  className={`relative md:min-w-[89.33px] hover:bg-gray-100 py-1 rounded-md hover:text-gray-700 px-[2.7vw] transition-all ${router?.pathname === "/date/store" || router?.pathname?.includes("/date/store") ? "text-[#4979f5]" : "text-gray-400"}`}
                  onClick={onClickStore}>
                  <div className='flex flex-col items-center'>
                    <FaStore className='w-7 h-7' />
                    <span className='mt-[2px] text-sm hidden md:inline'>스토어</span>
                  </div>
                  {/* {findNotReadConversation && findNotReadConversation?.length !== 0 &&
                    <div className='top-[17px] p-0.5 text-white bg-red-500 flex mr-[-41px] mt-[-20px] shadow text-center text-xs rounded-full w-[18px] h-[18px] items-center justify-center z-5 absolute'>
                      {findNotReadConversation?.length}
                    </div>
                  } */}
                </button>

              </div>

              {/* 햄버거 버튼 */}
              <div className="-mr-2 -my-2 sm:hidden">
                <button type="button" onClick={handleOpen} className="rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500" aria-expanded="false">
                  <span className="sr-only">Open menu</span>
                  <svg className="h-9 w-9" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              <button className="hidden sm:flex flex-col ml-[12px] items-center justify-center group-transition-all text-gray-500 hover:text-gray-600"
                onClick={toggleDropdown}
              >
                {user?.thumbimage?.length !== 0 && user?.thumbimage?.[0] ? (
                  <Image
                    alt="thumbimage[0]_user"
                    className="thumbimage[0] w-7 h-7 rounded-md object-cover"
                    unoptimized
                    width={60}
                    height={60}
                    src={user?.thumbimage?.[0]} />

                ) : (
                  <Image
                    alt="thumbimage[0]_user"
                    className="shadow-inner thumbimage[0] w-7 h-7 rounded-md object-cover"
                    src={profilePic}
                    width={60}
                    height={60}
                    unoptimized
                  />
                )}
                <span className="text-xs flex items-center w-full mt-[3px] dark:text-gray-200">
                  <span className='whitespace-nowrap overflow-hidden overflow-ellipsis break-all  max-w-[3rem]'>{user?.username}</span><BsFillCaretDownFill />
                </span>
              </button>

              {/* <!-- Dropdown menu --> */}
              {toggle &&
                <div className="fixed top-0 left-0 z-10 flex h-full w-full items-center justify-center ">
                  <div className="w-[100%] justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
                  >
                    <div ref={modalEl} className="fixed top-[60px] right-[2vw] z-10 w-72 py-2 overflow-hidden bg-white rounded-md shadow-xl dark:bg-gray-800">
                      <button onClick={onClickProfile} className="flex items-center p-3 -mt-2 text-sm text-gray-600 transition-colors duration-200 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white text-left w-full">
                        {user?.thumbimage?.length !== 0 && user?.thumbimage?.[0] ?
                          <Image
                            className="flex-shrink-0 object-cover mx-1 rounded-lg w-9 h-9 shadow-inner "
                            src={user?.thumbimage?.[0]}
                            loader={() => user?.thumbimage?.[0] || profilePic}
                            unoptimized
                            alt="thumbimage[0]" width={40} height={40} />
                          :
                          <Image
                            className="flex-shrink-0 object-cover mx-1 rounded-lg w-9 h-9"
                            src={profilePic}
                            unoptimized
                            alt="thumbimage[0]" width={40} height={40} />
                        }
                        <div className="mx-1 w-full ml-3">
                          <h1 className="text-sm w-full whitespace-nowrap overflow-hidden overflow-ellipsis break-all font-semibold text-gray-700 dark:text-gray-200">{user?.username}</h1>
                          <p className="text-sm w-full whitespace-nowrap	overflow-hidden overflow-ellipsis break-all text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                      </button>

                      <hr className="border-gray-200 dark:border-gray-700 " />
                      <button
                        onClick={onClickProfile}
                        className="text-left w-full font-bold block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-200 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">

                        <span>내 프로필</span>
                      </button>

                      <hr className="border-gray-200 dark:border-gray-700 " />
                      <button
                        onClick={onClickSetting}
                        className="text-left w-full font-bold block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-200 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white">
                        계정 설정
                      </button>
                      <button
                        onClick={onClickDashboard}
                        className="text-left w-full font-bold block px-4 py-3 text-sm text-gray-600 capitalize transition-colors duration-200 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        다른 게임
                      </button>
                      <hr className="border-gray-200 dark:border-gray-700 " />
                      <button
                        onClick={onClickLogout}
                        className="text-left w-full block px-4 py-3 text-sm text-gray-500 capitalize transition-colors duration-200 transform dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </div>
              }
            </>



          </div>
        </div>

        {/* 드롭다운 - 모바일 화면 */}
        {open &&
          <div className="absolute top-0 inset-x-0 p-0 transition-all transform origin-top-right md:hidden">
            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
              <div className="pt-2 pb-2 px-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Image
                      src={logo}
                      width={60}
                      alt="PYGM_LOGO"
                      height={60}
                      unoptimized
                    />
                  </div>
                  <div className="-mr-2">
                    <button type="button" onClick={handleCancel} className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                      <span className="sr-only">Close menu</span>
                      <svg className="h-9 w-9" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

              </div>

              <div className="pb-3 pt-0 px-3 space-y-6">

                <div>
                  <ul className="mt-2 mb-2 space-y-2 tracking-wide">
                    <li className="min-w-max" key="profile">
                      <button onClick={onClickProfile} className="group flex items-center space-x-4 rounded-md px-4 py-3 text-gray-400 w-full">
                        <FaUserCircle className='w-7 h-7' />
                        <span className="group-hover:text-gray-700">프로필</span>
                      </button>
                    </li>
                    <li className="min-w-max" key="setting">
                      <button onClick={onClickSetting} className="group flex items-center space-x-4 rounded-md px-4 py-3 text-gray-400 w-full">
                        <AiFillSetting className='w-7 h-7' />
                        <span className="group-hover:text-gray-700">계정 설정</span>
                      </button>
                    </li>
                    <li className="min-w-max" key="guide">
                      <button onClick={onClickDashboard} className="group flex items-center space-x-4 rounded-md px-4 py-3 text-gray-400 w-full">
                        <BsQuestionCircleFill className='w-7 h-7' />
                        <span className="group-hover:text-gray-700">다른 게임</span>
                      </button>
                    </li>
                  </ul>
                  <hr className="border-gray-200 dark:border-gray-700 " />
                  <div className="flex items-center justify-end md:flex-1 lg:w-0">
                    <button className='mt-3 p1' onClick={onClickLogout}>
                      <IoLogOut className='hover:text-gray-700 text-gray-500 h-9 w-9' />
                    </button>
                    <div className="ml-[12px]">

                    </div>
                  </div>
                </div>



              </div>
            </div>
          </div>
        }
      </nav>
      {children}


      {/* {signupSuccessModal ?
        <AlertModal
          title="PYGM 회원가입 성공!"
          contents="이제부터 다양한 팀의 활동내용을 찾아볼 수 있습니다."
          contents_second="프로필 > 기본정보와 스타일 정보를 입력하시면 현직자와의 1:1대화 및 채용제안을 받으실 수 있습니다."
          closeOutsideClick={true}
          openModal={true}
          twobutton={false}
          closeModal={closeConfirmModal}
        /> : null
      } */}
      <AuthModal
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        openModal={openModal}
        setOpenModal={setOpenModal}
        handleOpenModal={handleOpenModal}
        handleCancelModal={handleCancelModal} />

      <AlertModal
        title="로그아웃"
        contents="정말 로그아웃을 하시겠습니까?"
        closeOutsideClick={false}
        openModal={logoutConfirmModal}
        closeModal={logoutConfirm}
        cancelFunc={closeLogoutConformModal}
        twobutton={true}
      />
    </>
  );
};

export default index;
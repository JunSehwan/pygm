import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { FaKissWinkHeart } from "react-icons/fa";
import { MdPlaylistRemove } from "react-icons/md";
import {
  likeUser, dislikeUser, getDateMatching,
  sendMailForLike, sendMailForMatch, sendMailForDecline, passUser
} from 'firebaseConfig';
import {
  likeToUser, dislikeToUser,
  addLikeDoneFalse, addDislikeDoneFalse,
} from 'slices/user';
import {
  setDateMatching, setDateMatchingDoneFalse
} from 'slices/couple';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import LikeModal from './LikeModal';
import DislikeModal from './DislikeModal';
import BuyWinkModal from './BuyWinkModal';
import MatchModal from './MatchModal';
import PassModal from './PassModal';
import { FaGrinWink } from "react-icons/fa";
import { IoBackspace } from "react-icons/io5";
import { FcLike } from "react-icons/fc";
import { IoSad } from "react-icons/io5";


const BottomBar = styled.div`
  /* background: white; */
  background: linear-gradient(180deg, rgb(250, 250, 250) 0%, rgb(250, 250, 250) 97.4%, rgb(237, 237, 237) 100%, rgb(237, 237, 237) 100%, rgb(237, 237, 237) 100%);
  box-shadow: 9px 23px 25px 13px rgb(0 0 0 / 10%), 16px 8px 10px 12px rgb(0 0 0 / 10%);
`

const index = (
) => {
  const { user, friend, addLikeDone, addDislikeDone } = useSelector((state) => state.user);
  const { loadCouplesDone } = useSelector((state) => state.couple);
  const dispatch = useDispatch();
  const router = useRouter();
  const dislikeNotify = () => toast("패스처리가 완료되었습니다");
  const likeNotify = () => toast("윙크가 성공적으로 전달되었습니다");
  const couplesNotify = () => toast("맞윙크가 성공적으로 전달되었습니다");

  useEffect(() => {
    if (addDislikeDone) {
      dislikeNotify();
      dispatch(addDislikeDoneFalse());
      setOpenDislikeModal(false);
      router.push("/date/cards")

    }
  }, [dispatch, router, addDislikeDone, user?.dislikes])

  useEffect(() => {
    if (addLikeDone) {
      likeNotify();
      dispatch(addLikeDoneFalse());
      setOpenLikeModal(false);
      setLikes(true);
    }
  }, [dispatch, addLikeDone, user?.likes])

  useEffect(() => {
    if (loadCouplesDone) {
      // couplesNotify();
      dispatch(setDateMatchingDoneFalse());
      setOpenMatchModal(false);
      setLikes(true);
    }
  }, [dispatch, loadCouplesDone, user?.likes])

  const [openLikeModal, setOpenLikeModal] = useState(false);
  const [openDislikeModal, setOpenDislikeModal] = useState(false);
  const [openPassModal, setOpenPassModal] = useState(false);
  const [openMatchModal, setOpenMatchModal] = useState(false);
  const [openBuyWinkModal, setOpenBuyWinkModal] = useState(false);

  const onClickLikeModal = useCallback(() => {
    setOpenLikeModal(true);
  }, [])
  const onClickLikeModalClose = useCallback(() => {
    setOpenLikeModal(false);
  }, [])

  const onClickBuyWinkModal = useCallback(() => {
    setOpenBuyWinkModal(true);
  }, [])
  const onClickBuyWinkModalClose = useCallback(() => {
    setOpenBuyWinkModal(false);
  }, [])

  const onClickDislikeModal = useCallback(() => {
    setOpenDislikeModal(true);
  }, [])
  const onClickDislikeModalClose = useCallback(() => {
    setOpenDislikeModal(false);
  }, [])

  const onClickPassModal = useCallback(() => {
    setOpenPassModal(true);
  }, [])
  const onClickPassModalClose = useCallback(() => {
    setOpenPassModal(false);
  }, [])

  const onClickMatchModal = useCallback(() => {
    setOpenMatchModal(true);
  }, [])
  const onClickMatchModalClose = useCallback(() => {
    setOpenMatchModal(false);
  }, [])

  const onLike = useCallback(async () => {
    if (!user?.userID) {
      return alert('로그인이 필요합니다.');
    }
    await likeUser(friend?.userID, friend?.username)
    await sendMailForLike(friend?.email, friend?.username, user?.nickname)
    dispatch(likeToUser({
      targetId: friend?.userID,
      targetName: friend?.username,
      // targetThumbimage: friend?.thumbimage,
      userId: user?.userID,
      username: user?.username,
      // thumbimage: user?.thumbimage,
    }));
  }, [dispatch, friend?.userID, friend?.username, friend?.email, user?.nickname,
    user?.userID, user?.username]);

  const onPass = useCallback(async () => {
    if (!user?.userID) {
      return alert('로그인이 필요합니다.');
    }
    await passUser(friend?.userID, friend?.username)
    dispatch(dislikeToUser({
      targetId: friend?.userID,
      targetName: friend?.username,
      userId: user?.userID,
      username: user?.username,
    }));
  }, [dispatch, friend?.userID, friend?.username,
    user?.userID, user?.username]);

  const onDislike = useCallback(async () => {
    if (!user?.userID) {
      return alert('로그인이 필요합니다.');
    }
    await dislikeUser(friend?.userID, friend?.username)
    await sendMailForDecline(friend?.email, friend?.username, user?.nickname)
    dispatch(dislikeToUser({
      targetId: friend?.userID,
      targetName: friend?.username,
      userId: user?.userID,
      username: user?.username,
    }));
  }, [dispatch, friend?.userID, friend?.username, friend?.email, user?.nickname,
    user?.userID, user?.username]);

  const onBuy = useCallback(async () => {
    if (!user?.userID) {
      return alert('로그인이 필요합니다.');
    }
    router.push("/date/store")
    setOpenBuyWinkModal();
  }, [router, user?.userID]);

  const onMatch = useCallback(async () => {
    if (!user?.userID) {
      return alert('로그인이 필요합니다.');
    }
    await likeUser(friend?.userID, friend?.username)
    await sendMailForMatch(friend?.email, friend?.username, user?.nickname)
    dispatch(likeToUser({
      targetId: friend?.userID,
      targetName: friend?.username,
      userId: user?.userID,
      username: user?.username,
    }));
    // if (!!likesResults && !!likedResults) {
    try {
      const res = await getDateMatching(friend?.userID, friend?.username);
      dispatch(setDateMatching(res));
    } catch (e) {
      console.error(e)
      alert("에러가 발생했습니다.");
    }
    // } else {
    // }
  }, [dispatch, user?.userID, user?.nickname, user?.username, friend?.userID, friend?.username, friend?.email])

  // const liked = friend?.liked?.find((v) => v?.userId === user?.userID);
  const [likes, setLikes] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const likesResults = friend?.liked?.find((v) => v?.userId === user?.userID) !== undefined
    setLikes(likesResults)
    const likedResults = friend?.likes?.find((v) => v?.userId === user?.userID) !== undefined
    setLiked(likedResults)
  }, [user?.userID, friend?.liked, friend?.likes])

  const [dislikes, setDislikes] = useState(false);
  const [disliked, setDisliked] = useState(false);

  useEffect(() => {
    const dislikesResults = friend?.disliked?.find((v) => v?.userId === user?.userID) !== undefined
    setDislikes(dislikesResults)
    const dislikedResults = friend?.dislikes?.find((v) => v?.userId === user?.userID) !== undefined
    setDisliked(dislikedResults)
  }, [user?.userID, friend?.disliked, friend?.dislikes])



  return (
    <>
      {/* 아무것도 선택 안했을 경우 */}
      {!likes && !dislikes && !liked
        //  && !disliked
        ?
        (<BottomBar aria-label="Bottombar"
          className='max-w-[380px] block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-slate-100
      fixed bottom-2 shadow-md rounded-md mr-2 ml-2
      '>
          <div className="overflow-y-auto w-full mx-auto">
            <div className=''>

              <ul className="flex flex-row items-center justify-between">

                <li className='flex w-full justify-center min-w-[60px]'>
                  <button
                    className={`flex items-center justify-center w-full py-[8px] rounded-md 
                    my-1 mx-1 text-[12px] font-normal text-gray-600 dark:text-white
                     hover:bg-blue-100 dark:hover:bg-gray-600`}
                    onClick={onClickPassModal}
                  >
                    <div className='flex-shrink-0' >
                      <div

                        className={`w-full flex flex-col justify-center items-center`}>
                        <MdPlaylistRemove
                          className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                        ></MdPlaylistRemove>
                        <span className="mt-1 flex-1 whitespace-nowrap">패스하기</span>
                      </div>
                    </div>
                  </button>
                </li>
                {user?.wink >= 1 ?
                  <li className='flex w-full justify-center min-w-[60px]'>
                    <button
                      className={`flex items-center justify-center w-full py-[8px] rounded-md 
                   my-1 mx-1 text-[12px] font-normal text-white bg-pink-500 hover:bg-pink-600
                    dark:text-white dark:hover:bg-gray-600`}
                      onClick={onClickLikeModal}
                    >
                      <div className='flex-shrink-0' >
                        <div
                          className={`w-full flex flex-col justify-center items-center`}>
                          <FaKissWinkHeart
                            className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                          ></FaKissWinkHeart>
                          <span className="mt-1 flex-1 whitespace-nowrap">윙크보내기</span>
                        </div>
                      </div>
                    </button>
                  </li>
                  :
                  <li className='flex w-full justify-center min-w-[60px]'>
                    <button
                      className={`flex items-center justify-center w-full py-[8px] rounded-md 
                   my-1 mx-1 text-[12px] font-normal text-white bg-pink-500 hover:bg-pink-600
                    dark:text-white dark:hover:bg-gray-600`}
                      onClick={onClickBuyWinkModal}
                    >
                      <div className='flex-shrink-0' >
                        <div
                          className={`w-full flex flex-col justify-center items-center`}>
                          <FaKissWinkHeart
                            className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                          ></FaKissWinkHeart>
                          <span className="mt-1 flex-1 whitespace-nowrap">윙크보내기</span>
                        </div>
                      </div>
                    </button>
                  </li>}
              </ul>
            </div>
          </div>
        </BottomBar>) : null}


      {/* 상대가 나를 좋아했을 때 */}
      {!likes && liked ?
        user?.wink >= 1 ?
          (<BottomBar aria-label="Bottombar"
            className='max-w-[380px] block w-full overflow-y-hidden transition-transform duration-300 ease-in-out z-10 bg-slate-100 fixed bottom-2 shadow-md rounded-md mr-2 ml-2      '>
            <div className="overflow-y-auto w-full mx-auto">
              <div className=''>

                <ul className="flex flex-row items-center justify-between">
                  <li className='flex w-full justify-center min-w-[60px]'>
                    <button
                      className={`flex items-center justify-center w-full py-[8px] rounded-md 
                    my-1 mx-1 text-[12px] font-normal text-gray-600 dark:text-white
                     hover:bg-blue-100 dark:hover:bg-gray-600`}
                      onClick={onClickDislikeModal}
                    >
                      <div className='flex-shrink-0' >
                        <div

                          className={`w-full flex flex-col justify-center items-center`}>
                          <MdPlaylistRemove
                            className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                          ></MdPlaylistRemove>
                          <span className="mt-1 flex-1 whitespace-nowrap">거절하기</span>
                        </div>
                      </div>
                    </button>
                  </li>
                  <li className='flex w-full justify-center min-w-[60px]'>
                    <button
                      className={`flex items-center justify-center w-full py-[8px] rounded-md 
                   my-1 mx-1 text-[12px] font-normal text-white bg-pink-500 hover:bg-pink-600
                    dark:text-white dark:hover:bg-gray-600`}
                      onClick={onClickMatchModal}
                    >
                      <div className='flex-shrink-0' >
                        <div
                          className={`w-full flex flex-col justify-center items-center`}>
                          <FaKissWinkHeart
                            className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                          ></FaKissWinkHeart>
                          <span className="mt-1 flex-1 whitespace-nowrap">맞윙크 보내기</span>
                        </div>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </BottomBar>)

          :
          (<BottomBar aria-label="Bottombar"
            className='max-w-[380px] block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-slate-100
      fixed bottom-2 shadow-md rounded-md mr-2 ml-2
      '>
            <div className="overflow-y-auto w-full mx-auto">
              <div className=''>

                <ul className="flex flex-row items-center justify-between">
                  <li className='flex w-full justify-center min-w-[60px]'>
                    <button
                      className={`flex items-center justify-center w-full py-[8px] rounded-md 
                    my-1 mx-1 text-[12px] font-normal text-gray-600 dark:text-white
                     hover:bg-blue-100 dark:hover:bg-gray-600`}
                      onClick={onClickDislikeModal}
                    >
                      <div className='flex-shrink-0' >
                        <div

                          className={`w-full flex flex-col justify-center items-center`}>
                          <MdPlaylistRemove
                            className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                          ></MdPlaylistRemove>
                          <span className="mt-1 flex-1 whitespace-nowrap">패스하기</span>
                        </div>
                      </div>
                    </button>
                  </li>
                  <li className='flex w-full justify-center min-w-[60px]'>
                    <button
                      className={`flex items-center justify-center w-full py-[8px] rounded-md 
                   my-1 mx-1 text-[12px] font-normal text-white bg-pink-500 hover:bg-pink-600
                    dark:text-white dark:hover:bg-gray-600`}
                      onClick={onClickBuyWinkModal}
                    >
                      <div className='flex-shrink-0' >
                        <div
                          className={`w-full flex flex-col justify-center items-center`}>
                          <FaKissWinkHeart
                            className="flex-shrink-0 w-6 h-6  transition duration-75 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-white"
                          ></FaKissWinkHeart>
                          <span className="mt-1 flex-1 whitespace-nowrap">윙크보내기</span>
                        </div>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </BottomBar>)
        : null}

      {/* 둘다 매칭이 됐을 때 */}

      {likes && liked && !dislikes && !disliked ?
        <BottomBar aria-label="Bottombar"
          className='max-w-[420px] block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-slate-100 opacity-90
      fixed bottom-2 shadow-md rounded-md mr-2 ml-2
      '>
          <div className="overflow-y-auto w-full mx-auto">
            <div className='w-full flex justify-center items-center mx-0'>
              <div className="w-full flex items-center justify-center gap-1 p-3 mx-0 text-sm text-sky-800 border border-sky-300 rounded-lg bg-sky-50 dark:bg-gray-800 dark:text-sky-400 dark:border-sky-800" role="alert">
                <div className='w-10 h-10 mr-2'>
                  <FcLike
                    className='w-10 h-10'
                  />
                </div>
                <div className='w-full flex items-center'>
                  <div className='w-full flex flex-col'>
                    <span className="font-bold text-xl">매칭 성공!</span>
                    <span className="font-bold my-2 text-blue-600">{friend?.nickname}님의 연락처 : {friend?.phonenumber?.substring(0, 3)}-{friend?.phonenumber?.substring(3, 7)}-{friend?.phonenumber?.slice(-4)}</span>
                    <span className="font-light text-sm text-gray-500">상대방과의 연락 후,<br /> 즐거운 만남을 가져보시기 바랍니다.</span>
                  </div>
                </div>
                <div className='flex items-center'>
                  <button
                    className='flex flex-col w-full rounded-lg bg-slate-100 shadow-inner hover:bg-slate-200 active:bg-slate-300 hover:shadow-none p-2 items-center'
                    onClick={() => router.back()}
                  >
                    <IoBackspace className='w-5 h-5' />
                    <span className="font-medium text-xs">BACK</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </BottomBar>
        : null}

      {/* 내가 좋아요 보내고 상대방은 아직 안보냈을 때 */}

      {likes && !liked && !dislikes && !disliked ?
        <BottomBar aria-label="Bottombar"
          className='max-w-[380px] block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-slate-100
      fixed bottom-2 shadow-md rounded-md mr-2 ml-2
      '>
          <div className="overflow-y-auto w-full mx-auto">
            <div className='w-full flex justify-center items-center mx-0'>
              <div className="w-full flex items-center justify-center gap-1 p-3 mx-0 text-sm text-gray-800 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-800" role="alert">
                <div className='w-8 h-8 mr-2'>
                  <FaGrinWink
                    className='w-8 h-8'
                  />
                </div>
                <div className='w-full flex items-center'>
                  <span className="font-medium">이미 윙크를 보낸 이성입니다. <br />답변이 올 때까지 조금만 기다려주세요!</span>
                </div>
                <div className='flex items-center'>
                  <button
                    className='flex flex-col w-full rounded-lg bg-slate-100 shadow-inner hover:bg-slate-200 active:bg-slate-300 hover:shadow-none p-2 items-center'
                    onClick={() => router.back()}
                  >
                    <IoBackspace className='w-5 h-5' />
                    <span className="font-medium text-xs">BACK</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </BottomBar>
        : null
      }

      {/* 내가 패스했을때 */}
      {dislikes &&
        // likes &&
        <BottomBar aria-label="Bottombar"
          className='max-w-[380px] block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-slate-100
      fixed bottom-2 shadow-md rounded-md mr-2 ml-2
      '>
          <div className="overflow-y-auto w-full mx-auto">
            <div className='w-full flex justify-center items-center mx-0'>
              <div className="w-full flex items-center justify-center gap-1 p-3 mx-0 text-sm text-gray-800 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-800" role="alert">
                <div className='w-8 h-8 mr-2'>
                  <IoSad
                    className='w-8 h-8'
                  />
                </div>
                <div className='w-full flex items-center'>
                  <span className="font-medium">패스한 상대방입니다!</span>
                </div>
                <div className='flex items-center'>
                  <button
                    className='flex flex-col w-full rounded-lg bg-slate-100 shadow-inner hover:bg-slate-200 active:bg-slate-300 hover:shadow-none p-2 items-center'
                    onClick={() => router.back()}
                  >
                    <IoBackspace className='w-5 h-5' />
                    <span className="font-medium text-xs">BACK</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </BottomBar>
      }

      {/* 내가 좋아하지만 상대가 거절했을때 */}
      {disliked && likes &&
        <BottomBar aria-label="Bottombar"
          className='max-w-[380px] block w-full overflow-y-hidden transition-transform 
      duration-300 ease-in-out z-10 bg-slate-100
      fixed bottom-2 shadow-md rounded-md mr-2 ml-2
      '>
          <div className="overflow-y-auto w-full mx-auto">
            <div className='w-full flex justify-center items-center mx-0'>
              <div className="w-full flex items-center justify-center gap-1 p-3 mx-0 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400 dark:border-green-800" role="alert">
                <div className='w-8 h-8 mr-2'>
                  <IoSad
                    className='w-8 h-8'
                  />
                </div>
                <div className='w-full flex items-center'>
                  <span className="font-medium">아쉽지만 상대가 윙크를 거절하였습니다.</span>
                </div>
                <div className='flex items-center'>
                  <button
                    className='flex flex-col w-full rounded-lg bg-slate-100 shadow-inner hover:bg-slate-200 active:bg-slate-300 hover:shadow-none p-2 items-center'
                    onClick={() => router.back()}
                  >
                    <IoBackspace className='w-5 h-5' />
                    <span className="font-medium text-xs">BACK</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </BottomBar>
      }

      <LikeModal
        visible={openLikeModal}
        onLike={onLike}
        onClose={onClickLikeModalClose}
        title={`${friend?.nickname}님께 윙크를 보내겠습니까?`}
      />
      <BuyWinkModal
        visible={openBuyWinkModal}
        onBuy={onBuy}
        onClose={onClickBuyWinkModalClose}
        title={`${friend?.nickname}님! 윙크를 구매하시겠습니까?`}
      />
      <MatchModal
        visible={openMatchModal}
        onMatch={onMatch}
        onClose={onClickMatchModalClose}
        title={`${friend?.nickname}님! 윙크를 보내겠습니까?`}
      />
      <DislikeModal
        visible={openDislikeModal}
        onDislike={onDislike}
        onClose={onClickDislikeModalClose}
        title={`${friend?.nickname}님의 윙크를 거절하시겠습니까?`}
      />
      <PassModal
        visible={openPassModal}
        onPass={onPass}
        onClose={onClickPassModalClose}
        title={`${friend?.nickname}님은 패스하시겠습니까?`}
      />
    </>
  );
};



export default index;
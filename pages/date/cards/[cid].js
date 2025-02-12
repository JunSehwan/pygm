import React, { useEffect, useState } from 'react';
import Detail from 'components/Date/Cards/ProfileCards/ProfileCard/Detail';
import Head from 'next/head'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  setUser, setOtherUser, resetUserState, setOtherUserDoneFalse,
  userLoadingStart, userLoadingEnd, setFriends, setFriendsDoneFalse,
} from "slices/user";
import { setMyRating } from 'slices/daterating';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  db, getOtherUser, getFriends, getMyRatings
} from "firebaseConfig";
import LoadingPage from 'components/Common/Loading';
import Router from 'next/router';
import Navbar from 'components/Common/Navbar_Date';

const index = () => {

  const auth = getAuth();
  const { user, loading } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const pid = router.query;
  const otherid = pid.cid;
  //로딩을 위한
  const [nowLoading, setNowLoading] = useState(false);
  useEffect(() => {
    const start = () => {
      setNowLoading(true);
    };
    const end = () => {
      setNowLoading(false);
    };
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);
    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
    };
  }, []);


  useEffect(() => {
    const authStateListener = onAuthStateChanged(auth, async (user) => {
      dispatch(userLoadingStart());
      if (!user) {
        // dispatch(resetUserState());
        return router.push("/");
      }

      const docRef = doc(db, "users", user?.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        dispatch(resetUserState());
        return router.push("/");
      }
      const docData = docSnap.data();

      const currentUser = {
        userID: user.uid,
        username: docData.username,
        nickname: docData.nickname,
        email: docData.email,
        birthday: docData.birthday,
        gender: docData.gender,
        thumbimage: docData.thumbimage,
        phonenumber: docData.phonenumber,
        religion: docData.religion,
        address_sido: docData.address_sido,
        address_sigugun: docData.address_sigugun,

        education: docData.education,
        school: docData.school,
        school_open: docData.school_open,
        job: docData.job,
        company: docData.company,
        company_open: docData.company_open,
        jobdocument: docData.jobdocument,
        duty: docData.duty,
        salary: docData.salary,
        company_location_sido: docData.company_location_sido,
        company_location_sigugun: docData.company_location_sigugun,

        mbti_ei: docData.mbti_ei,
        mbti_sn: docData.mbti_sn,
        mbti_tf: docData.mbti_tf,
        mbti_jp: docData.mbti_jp,

        hobby: docData.hobby,
        drink: docData.drink,
        health: docData.health,
        hotplace: docData.hotplace,
        tour: docData.tour,
        tourlike: docData.tourlike,
        tourpurpose: docData.tourpurpose,
        hobbyshare: docData.hobbyshare,
        interest: docData.interest,

        opfriend: docData.opfriend,
        friendmeeting: docData.friendmeeting,
        longdistance: docData.longdistance,
        datecycle: docData.datecycle,
        dateromance: docData.dateromance,
        contact: docData.contact,
        contactcycle: docData.contactcycle,
        passwordshare: docData.passwordshare,
        wedding: docData.wedding,
        wedding_dating: docData.wedding_dating,
        prefer_age_min: docData.prefer_age_min,
        prefer_age_max: docData.prefer_age_max,

        career_goal: docData.career_goal,
        living_weekend: docData.living_weekend,
        living_consume: docData.living_consume,
        living_pet: docData.living_pet,
        living_tatoo: docData.living_tatoo,
        living_smoke: docData.living_smoke,
        living_charming: docData.living_charming,

        religion_important: docData.religion_important,
        religion_visit: docData.religion_visit,
        religion_accept: docData.religion_accept,
        food_taste: docData.food_taste,
        food_like: docData.food_like,
        food_dislike: docData.food_dislike,
        food_vegetarian: docData.food_vegetarian,
        food_spicy: docData.food_spicy,
        food_diet: docData.food_diet,

        infoseen: docData.infoseen,
        likes: docData.likes,
        liked: docData.liked,
        dislikes: docData.dislikes,
        disliked: docData.disliked,

        wink: docData.wink,
        date_sleep: docData.date_sleep,
        withdraw: docData.withdraw,
        date_lastIntroduce: docData.date_lastIntroduce,
        timestamp: docData.timestamp,
        datecard: docData.datecard,
        date_profile_finished: docData.date_profile_finished,
        date_pending: docData.date_pending,

      };
      dispatch(setUser(currentUser));

      if (currentUser?.date_sleep == true) {
        // dispatch(resetUserState());
        alert("휴면상태에서는 이성소개가 불가합니다.")
        return router.push("/setting/sleep");
      }
      if (currentUser?.withdraw == true) {
        alert("탈퇴한 회원입니다..")
        // dispatch(resetUserState());
        return router.push("/");
      }
      if (!currentUser?.date_profile_finished) {
        alert("프로필을 먼저 입력해주세요.")
        return router.push("/date/profile")
      }
      if (currentUser?.date_pending) {
        alert("곧 승인되오니 잠시만 기다려주시기 바랍니다.")
        return router.push("/date/pending")
      }

      await getFriends().then((result) => {
        dispatch(setFriends(result));
      })
      if (otherid) {
        await getOtherUser(otherid).then((result) => {
          dispatch(setOtherUser(result));
        })
        dispatch(userLoadingEnd());
        dispatch(setFriendsDoneFalse());
        dispatch(setOtherUserDoneFalse());
      }
      await getMyRatings().then((result) => {
        dispatch(setMyRating(result));
      })
    });
    return () => {
      authStateListener();
    };
  }, [auth, dispatch, otherid, router]);


  useEffect(() => {
    if (!user?.userID) return;

    const unsubscribe = onSnapshot(doc(db, "users", user?.userID), (user) => {
      if (!user?.exists()) return;
      const docData = user?.data();

      const currentUser = {
        userID: user.id,
        username: docData.username,
        nickname: docData.nickname,
        email: docData.email,
        birthday: docData.birthday,
        gender: docData.gender,
        thumbimage: docData.thumbimage,
        phonenumber: docData.phonenumber,
        religion: docData.religion,
        address_sido: docData.address_sido,
        address_sigugun: docData.address_sigugun,

        education: docData.education,
        school: docData.school,
        school_open: docData.school_open,
        job: docData.job,
        company: docData.company,
        company_open: docData.company_open,
        jobdocument: docData.jobdocument,
        duty: docData.duty,
        salary: docData.salary,
        company_location_sido: docData.company_location_sido,
        company_location_sigugun: docData.company_location_sigugun,

        mbti_ei: docData.mbti_ei,
        mbti_sn: docData.mbti_sn,
        mbti_tf: docData.mbti_tf,
        mbti_jp: docData.mbti_jp,

        hobby: docData.hobby,
        drink: docData.drink,
        health: docData.health,
        hotplace: docData.hotplace,
        tour: docData.tour,
        tourlike: docData.tourlike,
        tourpurpose: docData.tourpurpose,
        hobbyshare: docData.hobbyshare,
        interest: docData.interest,

        opfriend: docData.opfriend,
        friendmeeting: docData.friendmeeting,
        longdistance: docData.longdistance,
        datecycle: docData.datecycle,
        dateromance: docData.dateromance,
        contact: docData.contact,
        contactcycle: docData.contactcycle,
        passwordshare: docData.passwordshare,
        wedding: docData.wedding,
        wedding_dating: docData.wedding_dating,
        prefer_age_min: docData.prefer_age_min,
        prefer_age_max: docData.prefer_age_max,

        career_goal: docData.career_goal,
        living_weekend: docData.living_weekend,
        living_consume: docData.living_consume,
        living_pet: docData.living_pet,
        living_tatoo: docData.living_tatoo,
        living_smoke: docData.living_smoke,
        living_charming: docData.living_charming,

        religion_important: docData.religion_important,
        religion_visit: docData.religion_visit,
        religion_accept: docData.religion_accept,
        food_taste: docData.food_taste,
        food_like: docData.food_like,
        food_dislike: docData.food_dislike,
        food_vegetarian: docData.food_vegetarian,
        food_spicy: docData.food_spicy,
        food_diet: docData.food_diet,

        infoseen: docData.infoseen,
        likes: docData.likes,
        liked: docData.liked,
        dislikes: docData.dislikes,
        disliked: docData.disliked,

        wink: docData.wink,
        date_sleep: docData.date_sleep,
        withdraw: docData.withdraw,
        date_lastIntroduce: docData.date_lastIntroduce,
        timestamp: docData.timestamp,
        datecard: docData.datecard,
        date_profile_finished: docData.date_profile_finished,
        date_pending: docData.date_pending,
      };
      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });
    return () => {
      unsubscribe();
    };
  }, [dispatch, user?.uid, user?.userID]);


  const writeThumbImage = user?.thumbimage?.length >= 2;
  const writeBasicInfo = user?.username && user?.nickname && user?.religion && user?.birthday?.year && user?.birthday?.month && user?.birthday?.day && user?.gender && user?.phonenumber && user?.address_sigugun && user?.address_sido;
  const writeCareerInfo = user?.education && user?.school && user?.job && user?.company && user?.duty && user?.salary && user?.company_location_sido && user?.company_location_sigugun && user?.jobdocument?.length !== 0;
  const writeThinkInfo = user?.mbti_ei && user?.hobby && user?.drink && user?.health && user?.interest && user?.career_goal && user?.living_weekend && user?.living_consume && user?.opfriend && user?.friendmeeting && user?.longdistance && user?.religion_important && user?.religion_visit && user?.religion_accept && user?.food_diet;

  useEffect(() => {
    if (!user?.userID) return;
    
    if (!writeThumbImage || !writeBasicInfo || !writeCareerInfo || !writeThinkInfo) {
      alert("모든 정보를 입력해주세요!")
      return router.push("/date/profile");
    }
  }, [user, router, writeBasicInfo,
    writeCareerInfo, writeThinkInfo, writeThumbImage,
    // user?.date_sleep, user?.withdraw, user?.date_profile_finished, user?.date_pending
  ])

  return (
    <>
      <Head>
        <title>피그말리온 소개팅 - 소개팅 카드보기</title>

        <meta name="keywords" content="피그말리온, 소개팅, 단체미팅, 연애, 소개팅앱, 반상회, 소통플랫폼" />
        <meta name="description" content="자연스러운 만남!, 나와 맞는 조건의 이성과의 만남" />

        <meta name="application-name" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta name="msapplication-tooltip" content="피그말리온(PYGMalion)" />

        <meta property="og:type" content="개성있는 채용, 피그말리온(PYGMalion)" />
        <meta property="og:title" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta property="og:description" content="피그말리온에서 나의 인연을 찾아보세요!" />
        <meta property="og:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta property="og:url" content="https://pygm.co.kr" />

        <meta name="twitter:card" content="피그말리온(PYGMalion)에서 인연을 찾아보세요!" />
        <meta name="twitter:title" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta name="twitter:description" content="피그말리온에서 나의 인연을 찾아보세요!" />
        <meta name="twitter:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta name="twitter:domain" content="https://pygm.co.kr" />
      </Head>

      {nowLoading || loading ?
        <LoadingPage /> :
        <>
          <Navbar>
            <Detail />
          </Navbar>
        </>
      }
    </>

  );
};


export default index;
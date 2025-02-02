import React, { useEffect, useState } from 'react';
import LoadingPage from 'components/Common/Loading';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Landing from 'components/Landing';
import { setUser, userLoadingStart, userLoadingEnd, userLoadingEndwithNoone } from "slices/user";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "firebaseConfig";
import Router from 'next/router';

const index = () => {

  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector(state => state.user);


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
    if ((user || user?.userID)) {
      router.push('/dashboard')
    }
  }, [router, user]);

  useEffect(() => {
    const authStateListener = onAuthStateChanged(auth, async (user) => {
      dispatch(userLoadingStart());
      if (!user) return dispatch(userLoadingEndwithNoone());

      const docRef = doc(db, "users", user?.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists())
        return dispatch(userLoadingEndwithNoone());

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
      };

      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
      // await getEducationsByUserId().then((result) => {
      //   dispatch(loadEducations(result));
      // })
      // await getCareersByUserId().then((result) => {
      //   dispatch(loadCareers(result));
      // })
    });
    return () => {
      authStateListener();
    };
  }, [auth, dispatch, user?.uid, user?.userID]);

  useEffect(() => {
    if (!user?.userID) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.userID), (user) => {
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
      };
      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });
    return () => {
      unsubscribe();
    };
  }, [dispatch, user?.uid, user?.userID]);

  return (
    <>
      <Head>
        <title>추억과 즐거움으로 이성을 만나다! 피그말리온</title>

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
        <LoadingPage />
        :
        <Landing />}

    </>
  );
};


export default index;
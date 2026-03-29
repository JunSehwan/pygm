import React, { useEffect, useState } from "react";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import Landing from "components/Landing";
import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

const mapUserDocToCurrentUser = (uid, docData = {}) => ({
  userID: uid,

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
  status: docData.status,
  height: docData.height,

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
});

const getRedirectPath = (currentUser) => {
  if (!currentUser) return null;

  // 요청사항: 프로필 작성 미완료 => /pending, 그 외 로그인 => /arena
  const isProfileFinished = currentUser?.date_profile_finished === true;

  if (!isProfileFinished) return "/welcome";
  return "/arena";
};

const IndexPage = () => {
  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();

  const { user, loading } = useSelector((state) => state.user);
  const [nowLoading, setNowLoading] = useState(false);

  // 페이지 전환 로딩 표시
  useEffect(() => {
    const start = () => setNowLoading(true);
    const end = () => setNowLoading(false);

    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);

    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
    };
  }, []);

  // 로그인 상태 확인 + 초기 유저 로드
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());

      if (!firebaseUser) {
        dispatch(userLoadingEndwithNoone());
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          dispatch(userLoadingEndwithNoone());
          return;
        }

        const currentUser = mapUserDocToCurrentUser(firebaseUser.uid, userSnap.data());

        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());

        if (router.pathname === "/") {
          const path = getRedirectPath(currentUser);
          if (path) router.push(path);
        }
      } catch (e) {
        console.error("[pages/index] auth load error:", e);
        dispatch(userLoadingEndwithNoone());
      }
    });

    return () => unsubscribeAuth();
  }, [auth, dispatch, router]);

  // 로그인 후 실시간 동기화
  useEffect(() => {
    if (!user?.userID) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.userID),
      (snap) => {
        if (!snap.exists()) return;
        const currentUser = mapUserDocToCurrentUser(snap.id, snap.data());
        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());
      },
      (e) => {
        console.error("[pages/index] user snapshot error:", e);
      }
    );

    return () => unsubscribe();
  }, [dispatch, user?.userID]);

  return (
    <>
      <Head>
        <title>차밍수프 | 매너와 인성 기반 매칭</title>

        <meta
          name="keywords"
          content="차밍그라운드, 차밍랩, 소개팅, 연애, 매칭, 연애테스트, 성향테스트"
        />
        <meta
          name="description"
          content="매너와 인성, 연애스타일까지 확인하는 차밍그라운드 매칭 서비스"
        />

        <meta name="application-name" content="차밍그라운드" />
        <meta name="msapplication-tooltip" content="차밍그라운드(Charming Ground)" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="차밍그라운드 | 검증된 매칭" />
        <meta
          property="og:description"
          content="불편한 대화와 애매한 약속을 줄이기 위해 매너 데이터를 먼저 확인합니다."
        />
        <meta property="og:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta property="og:url" content="https://pygm.co.kr" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="차밍그라운드 | 검증된 매칭" />
        <meta
          name="twitter:description"
          content="자기진단과 매너/인성 기반으로 더 자연스럽게 만나는 매칭"
        />
        <meta name="twitter:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta name="twitter:domain" content="pygm.co.kr" />
      </Head>

      {nowLoading || loading ? <LoadingPage /> : <Landing />}
    </>
  );
};

export default IndexPage;
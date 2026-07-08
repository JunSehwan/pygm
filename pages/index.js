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
import SEOHead from "components/Common/SEOHead";

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

  console.log("[index mounted]", router.pathname);

  return (
    <>
      <SEOHead
        title="차밍수프"
        description="차밍수프는 3040이 만남 전 확인하고 싶은 가치관, 생활 방식, 대화 태도를 차밍카드로 먼저 살펴보는 진지한 만남 서비스입니다."
        keywords="차밍수프, 3040 소개팅, 만남 전 가치관 확인, 진지한 만남, 차밍카드, 가치관 매칭"
      />

      <main className="min-h-screen bg-white md:bg-[#fbf7ff]">
        <div className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-violet-200/35 blur-3xl" />
            <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-rose-100/55 blur-3xl" />
            <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-violet-100/55 blur-3xl" />
          </div>

          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section
              id="app-surface"
              className="relative w-full max-w-[420px] overflow-hidden bg-white md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <Landing />
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default IndexPage;
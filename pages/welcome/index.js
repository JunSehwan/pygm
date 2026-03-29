import React, { useEffect } from "react";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";

import LoadingPage from "components/Common/Loading";
import WelcomeFlow from "components/Welcome/WelcomeFlow";

import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "firebaseConfig";

export default function WelcomePage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const auth = getAuth();
  const { user, loading } = useSelector((state) => state.user);

  /**
   * Firestore users 문서를 Redux user shape로 맞추는 함수
   * (네 기존 index.js에서 쓰던 필드 최대한 유지)
   */
  const buildCurrentUser = (firebaseUser, docData = {}, userDocId) => {
    return {
      userID: firebaseUser?.uid || userDocId || "",
      username: docData.username || "",
      nickname: docData.nickname || "",
      email: docData.email || firebaseUser?.email || "",
      birthday: docData.birthday || "",
      gender: docData.gender || "",
      thumbimage: docData.thumbimage || "",
      phonenumber: docData.phonenumber || "",
      religion: docData.religion || "",
      address_sido: docData.address_sido || "",
      address_sigugun: docData.address_sigugun || "",
      status: docData.status || "",
      height: docData.height || "",

      education: docData.education || "",
      school: docData.school || "",
      school_open: docData.school_open || "",
      job: docData.job || "",
      company: docData.company || "",
      company_open: docData.company_open || "",
      jobdocument: docData.jobdocument || "",
      duty: docData.duty || "",
      salary: docData.salary || "",
      company_location_sido: docData.company_location_sido || "",
      company_location_sigugun: docData.company_location_sigugun || "",

      mbti_ei: docData.mbti_ei || "",
      mbti_sn: docData.mbti_sn || "",
      mbti_tf: docData.mbti_tf || "",
      mbti_jp: docData.mbti_jp || "",

      hobby: docData.hobby || "",
      drink: docData.drink || "",
      health: docData.health || "",
      hotplace: docData.hotplace || "",
      tour: docData.tour || "",
      tourlike: docData.tourlike || "",
      tourpurpose: docData.tourpurpose || "",
      hobbyshare: docData.hobbyshare || "",
      interest: docData.interest || "",

      opfriend: docData.opfriend || "",
      friendmeeting: docData.friendmeeting || "",
      longdistance: docData.longdistance || "",
      datecycle: docData.datecycle || "",
      dateromance: docData.dateromance || "",
      contact: docData.contact || "",
      contactcycle: docData.contactcycle || "",
      passwordshare: docData.passwordshare || "",
      wedding: docData.wedding || "",
      wedding_dating: docData.wedding_dating || "",
      prefer_age_min: docData.prefer_age_min || "",
      prefer_age_max: docData.prefer_age_max || "",

      career_goal: docData.career_goal || "",
      living_weekend: docData.living_weekend || "",
      living_consume: docData.living_consume || "",
      living_pet: docData.living_pet || "",
      living_tatoo: docData.living_tatoo || "",
      living_smoke: docData.living_smoke || "",
      living_charming: docData.living_charming || "",

      religion_important: docData.religion_important || "",
      religion_visit: docData.religion_visit || "",
      religion_accept: docData.religion_accept || "",
      food_taste: docData.food_taste || "",
      food_like: docData.food_like || "",
      food_dislike: docData.food_dislike || "",
      food_vegetarian: docData.food_vegetarian || "",
      food_spicy: docData.food_spicy || "",
      food_diet: docData.food_diet || "",

      infoseen: docData.infoseen || [],
      likes: docData.likes || [],
      liked: docData.liked || [],
      dislikes: docData.dislikes || [],
      disliked: docData.disliked || [],

      wink: docData.wink || [],
      date_sleep: docData.date_sleep ?? false,
      withdraw: docData.withdraw ?? false,
      date_lastIntroduce: docData.date_lastIntroduce || null,
      timestamp: docData.timestamp || null,
      datecard: docData.datecard || [],
      date_profile_finished: docData.date_profile_finished ?? false,
      date_pending: docData.date_pending ?? false,

      // 본인인증 관련 (추가 필드들)
      phone_verified: docData.phone_verified ?? false,
      identity_provider: docData.identity_provider || "",
      identity_ci: docData.identity_ci || "",
      identity_di: docData.identity_di || "",
      identity_birth: docData.identity_birth || "",
      identity_gender: docData.identity_gender || "",
    };
  };

  /**
   * 네 기존 index.js처럼 auth 상태 감지 + user 로딩
   */
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());

      // 로그인 안 된 상태면 welcome 접근 불가 → login
      if (!firebaseUser) {
        dispatch(userLoadingEndwithNoone());
        router.replace("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        // Auth는 있는데 users 문서가 없는 경우 (희귀 케이스)
        if (!userSnap.exists()) {
          dispatch(userLoadingEndwithNoone());
          router.replace("/signup");
          return;
        }

        const currentUser = buildCurrentUser(firebaseUser, userSnap.data(), userSnap.id);

        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());

        // ✅ 웰컴 페이지 접근 제어 (네 기존 흐름 기준으로 정리)
        // 프로필 완료 + 수면상태 아님 → arena
        if (currentUser?.date_profile_finished === true && currentUser?.date_sleep === false) {
          router.replace("/arena");
          return;
        }

        // pending 상태면 pending
        if (currentUser?.date_pending === true) {
          router.replace("/pending");
          return;
        }

        // 그 외엔 welcome 유지 (신규 가입 후 브리핑)
      } catch (err) {
        console.error("[welcome] auth load error:", err);
        dispatch(userLoadingEndwithNoone());
        router.replace("/login");
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [auth, dispatch, router]);

  /**
   * users/{uid} 실시간 구독 (네 기존 index.js 패턴 유지)
   * welcome에서 꼭 필요하진 않지만, 네 프로젝트 흐름 맞추기 위해 유지
   */
  useEffect(() => {
    if (!user?.userID) return;

    const unsubscribeUserDoc = onSnapshot(doc(db, "users", user.userID), (snap) => {
      if (!snap?.exists()) return;

      const docData = snap.data();
      const currentUser = buildCurrentUser({ uid: snap.id, email: docData.email }, docData, snap.id);

      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());

      // 실시간으로 상태가 바뀌면 자동 이동
      if (currentUser?.date_profile_finished === true && currentUser?.date_sleep === false) {
        router.replace("/arena");
        return;
      }

      if (currentUser?.date_pending === true) {
        router.replace("/pending");
        return;
      }
    });

    return () => {
      unsubscribeUserDoc();
    };
  }, [dispatch, router, user?.userID]);

  return (
    <>
      <Head>
        <title>차밍수프 시작하기</title>
        <meta
          name="description"
          content="차밍수프 이용 방법을 단계별로 확인하고 매칭을 시작해보세요."
        />
      </Head>

      {loading ? (
        <LoadingPage />
      ) : (
          <main className="min-h-screen bg-[#f8f7fc]">
          <div className="relative min-h-screen overflow-hidden">
            {/* desktop soft blobs */}
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/40 blur-3xl" />
              <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-sky-200/40 blur-3xl" />
              <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/50 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
              <section
                className="
                  w-full max-w-[390px] overflow-hidden bg-[#f6f7fb]
                  md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80
                  md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]
                "
              >
                <WelcomeFlow />
              </section>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
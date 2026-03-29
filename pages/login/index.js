import React, { useEffect, useState } from "react";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import Login from "components/Auth/Login";
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
  spoon: docData.spoon,
  spoonCount: docData.spoonCount,
  styleTest: docData.styleTest,
});

export default function LoginPage() {
  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector((state) => state.user);

  const [nowLoading, setNowLoading] = useState(false);

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

        router.replace("/arena");
      } catch (e) {
        console.error("[login/index] auth load error:", e);
        dispatch(userLoadingEndwithNoone());
      }
    });

    return () => unsubscribeAuth();
  }, [auth, dispatch, router]);

  useEffect(() => {
    if (!user?.userID) return;

    const unsubscribe = onSnapshot(
      doc(db, "users", user.userID),
      (snap) => {
        if (!snap.exists()) return;
        dispatch(setUser(mapUserDocToCurrentUser(snap.id, snap.data())));
        dispatch(userLoadingEnd());
      },
      (e) => console.error("[login/index] snapshot error:", e)
    );

    return () => unsubscribe();
  }, [dispatch, user?.userID]);

  return (
    <>
      <Head>
        <title>로그인 | 차밍수프</title>
      </Head>

      {nowLoading || loading ? <LoadingPage /> : <Login />}
    </>
  );
}
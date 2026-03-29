import React, { useEffect, useState } from "react";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import DeleteAccountPage from "components/Setting/Account/DeleteAccountPage";
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
  styleTest: docData.styleTest,
  spoon: docData.spoon,
  spoonCount: docData.spoonCount,
  date_profile_finished: docData.date_profile_finished,
  date_pending: docData.date_pending,
});

export default function AccountDeleteIndexPage() {
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
        router.replace("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          dispatch(userLoadingEndwithNoone());
          router.replace("/login");
          return;
        }

        const currentUser = mapUserDocToCurrentUser(firebaseUser.uid, userSnap.data());
        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());
      } catch (e) {
        console.error("[account/delete] auth load error:", e);
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
      (e) => console.error("[account/delete] snapshot error:", e)
    );

    return () => unsubscribe();
  }, [dispatch, user?.userID]);

  return (
    <>
      <Head>
        <title>계정 삭제 | 차밍수프</title>
        <meta
          name="description"
          content="탈퇴 전 유의사항을 확인하고 탈퇴 사유를 선택할 수 있습니다."
        />
      </Head>

      {nowLoading || loading ? <LoadingPage /> : <DeleteAccountPage />}
    </>
  );
}
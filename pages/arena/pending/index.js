import React, { useEffect } from "react";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import PendingReviewPage from "components/Arena/Pending";

import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

function buildCurrentUser(firebaseUser, docData = {}, userDocId) {
  return {
    userID: firebaseUser?.uid || userDocId || "",
    username: docData.username || "",
    nickname: docData.nickname || "",
    email: docData.email || firebaseUser?.email || "",
    birthday: docData.birthday || "",
    gender: docData.gender || "",
    phonenumber: docData.phonenumber || "",
    thumbimage: docData.thumbimage || "",
    date_sleep: docData.date_sleep ?? false,
    withdraw: docData.withdraw ?? false,
    date_profile_finished: docData.date_profile_finished ?? false,
    date_pending: docData.date_pending ?? false,

    maritalStatus: docData.maritalStatus || "",
    mbti: docData.mbti || "",
    job: docData.job || "",
    education: docData.education || "",
    residence: docData.residence || {},
    workArea: docData.workArea || {},

    address_sido: docData.address_sido || "",
    address_sigugun: docData.address_sigugun || "",
    company_location_sido: docData.company_location_sido || "",
    company_location_sigugun: docData.company_location_sigugun || "",

    profilePhotos: Array.isArray(docData.profilePhotos) ? docData.profilePhotos : [],
    charmingCardPhotoPublic: !!docData.charmingCardPhotoPublic,
    pendingReviewAlertSentAt: docData.pendingReviewAlertSentAt || null,
  };
}

export default function ArenaPendingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = getAuth();

  const { user, loading } = useSelector((state) => state.user);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
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
          router.replace("/signup");
          return;
        }

        const currentUser = buildCurrentUser(firebaseUser, userSnap.data(), userSnap.id);
        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());
      } catch (e) {
        console.error("[arena/pending] load error:", e);
        dispatch(userLoadingEndwithNoone());
        router.replace("/login");
      }
    });

    return () => unsub();
  }, [auth, dispatch, router]);

  useEffect(() => {
    if (!user?.userID) return;

    const unsubDoc = onSnapshot(doc(db, "users", user.userID), (snap) => {
      if (!snap.exists()) return;
      const docData = snap.data();
      const currentUser = buildCurrentUser({ uid: snap.id, email: docData.email }, docData, snap.id);
      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });

    return () => unsubDoc();
  }, [dispatch, user?.userID]);

  return (
    <>
      <Head>
        <title>프로필 심사중 | 차밍수프</title>
        <meta
          name="description"
          content="프로필 심사가 진행 중입니다. 추가 정보를 입력하고 노출을 높여보세요."
        />
      </Head>

      {loading ? (
        <LoadingPage />
      ) : (
        <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/40 blur-3xl" />
              <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-sky-200/40 blur-3xl" />
              <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/50 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
              <section
                id="app-surface"
                className="relative w-full max-w-[420px] overflow-hidden bg-white md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
              >
                <PendingReviewPage user={user} />
              </section>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
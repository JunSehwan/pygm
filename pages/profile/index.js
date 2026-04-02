import React, { useEffect } from "react";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import ProfileMainPage from "components/Profile/MainProfilePage";

import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

import RequireAuth from "components/Common/RequireAuth";
import { adaptLegacyProfileDoc } from "lib/profileLegacyAdapter";

// 기존 유저 프로필 연동시키기 위해 변경 전환 lib/profileLegacyAdaptor
function buildCurrentUser(firebaseUser, docData = {}, userDocId) {
  return adaptLegacyProfileDoc(docData, firebaseUser, userDocId);
}

function serializeFirestoreValue(value) {
  if (value == null) return value;

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreValue(item));
  }

  if (typeof value === "object") {
    if (
      typeof value.toDate === "function" &&
      typeof value.toMillis === "function"
    ) {
      return value.toDate().toISOString();
    }

    const next = {};
    Object.keys(value).forEach((key) => {
      next[key] = serializeFirestoreValue(value[key]);
    });
    return next;
  }

  return value;
}

function buildSafeUserPayload(userId, rawData = {}, firebaseUser = null) {
  const serialized = serializeFirestoreValue(rawData || {});

  return {
    ...serialized,
    userID: userId || serialized.userID || serialized.uid || "",
    uid: userId || serialized.uid || serialized.userID || "",
    email: serialized.email || firebaseUser?.email || "",
    styleTest:
      serialized?.styleTest && typeof serialized.styleTest === "object"
        ? {
          ...serialized.styleTest,
          completedAt: serialized.styleTest.completedAt || null,
        }
        : serialized?.styleTest || {},
  };
}

export default function ProfileIndexPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = getAuth();
  const { user, loading } = useSelector((state) => state.user);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
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
          router.replace("/signup");
          return;
        }

        const currentUser = buildCurrentUser(
          firebaseUser,
          userSnap.data(),
          userSnap.id
        );

        const safeUser = buildSafeUserPayload(
          userSnap.id,
          currentUser,
          firebaseUser
        );

        dispatch(setUser(safeUser));
        dispatch(userLoadingEnd());
      } catch (e) {
        console.error("[profile] load error:", e);
        dispatch(userLoadingEndwithNoone());
      }
    });

    return () => unsub();
  }, [auth, dispatch, router]);

  useEffect(() => {
    if (!user?.userID) return;

    const unsubDoc = onSnapshot(doc(db, "users", user.userID), (snap) => {
      if (!snap.exists()) return;

      const docData = snap.data();

      const currentUser = buildCurrentUser(
        { uid: snap.id, email: docData.email },
        docData,
        snap.id
      );

      const safeUser = buildSafeUserPayload(
        snap.id,
        currentUser,
        { uid: snap.id, email: docData.email }
      );

      dispatch(setUser(safeUser));
      dispatch(userLoadingEnd());
    });

    return () => unsubDoc();
  }, [dispatch, user?.userID]);

  return (
    <>
      <Head>
        <title>내 프로필 | 차밍수프</title>
        <meta
          name="description"
          content="내 프로필과 가치관설문을 관리하세요."
        />
      </Head>

      {loading ? (
        <LoadingPage />
      ) : (
        <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
          <div className="relative min-h-screen overflow-hidden">
            <div className="pointer-events-none absolute inset-0 hidden md:block">
              <div className="absolute left-1/2 top-[-80px] h-[260px] w-[260px] -translate-x-[260px] rounded-full bg-pink-200/35 blur-3xl" />
              <div className="absolute left-1/2 top-[120px] h-[280px] w-[280px] translate-x-[120px] rounded-full bg-violet-200/30 blur-3xl" />
              <div className="absolute left-1/2 bottom-[40px] h-[240px] w-[240px] -translate-x-[120px] rounded-full bg-rose-100/40 blur-3xl" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
              <section
                id="app-surface"
                className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-h-[760px] md:max-w-[430px] md:rounded-[24px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]"
              >
                <ProfileMainPage user={user} />
              </section>
            </div>
          </div>
        </main>
      )}

      <RequireAuth redirect="/profile" />
    </>
  );
}
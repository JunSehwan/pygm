import React, { useEffect } from "react";
import Head from "next/head";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import LoadingPage from "components/Common/Loading";
import ProfilePhotoUploadPage from "components/ProfilePhotoUpload/ProfilePhotoUploadPage";

import { db } from "firebaseConfig";
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from "slices/user";

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

function buildCurrentUser(firebaseUser, docData = {}, userDocId) {
  const safeData = serializeFirestoreValue(docData || {});

  return {
    userID: firebaseUser?.uid || userDocId || "",
    uid: firebaseUser?.uid || userDocId || "",
    username: safeData.username || "",
    nickname: safeData.nickname || "",
    email: safeData.email || firebaseUser?.email || "",
    birthday: safeData.birthday || "",
    gender: safeData.gender || "",
    phonenumber: safeData.phonenumber || "",
    thumbimage: safeData.thumbimage || "",

    // 본인인증 관련 필드
    identityVerified: safeData.identityVerified === true,
    phoneVerified:
      safeData.phoneVerified === true ||
      safeData.phone_verified === true ||
      safeData.phone_verified === "true",
    telVerified: safeData.telVerified === true,
    identityVerifiedAt: safeData.identityVerifiedAt || safeData.phone_verified_at || null,
    identityVerification: safeData.identityVerification || null,
    identityVerifiedData: safeData.identityVerifiedData || null,
    identity_phone: safeData.identity_phone || "",
    identityPhone: safeData.identityPhone || "",
    verifiedPhone: safeData.verifiedPhone || "",
    phone_verified: safeData.phone_verified === true,
    phone_verified_at: safeData.phone_verified_at || null,
    identity_name: safeData.identity_name || "",
    identity_birth: safeData.identity_birth || "",
    identity_gender: safeData.identity_gender || "",
    identity_provider: safeData.identity_provider || "",
    identity_ci: safeData.identity_ci || "",
    identity_di: safeData.identity_di || "",

    date_sleep: safeData.date_sleep ?? false,
    withdraw: safeData.withdraw ?? false,
    date_sleep: safeData.date_sleep ?? false,
    withdraw: safeData.withdraw ?? false,
    date_profile_finished: safeData.date_profile_finished ?? false,
    date_pending: safeData.date_pending ?? false,

    maritalStatus: safeData.maritalStatus || "",
    mbti: safeData.mbti || "",
    job: safeData.job || "",
    education: safeData.education || "",
    residence: safeData.residence || {},
    workArea: safeData.workArea || {},

    address_sido: safeData.address_sido || "",
    address_sigugun: safeData.address_sigugun || "",
    company_location_sido: safeData.company_location_sido || "",
    company_location_sigugun: safeData.company_location_sigugun || "",

    profilePhotos: Array.isArray(safeData.profilePhotos)
      ? safeData.profilePhotos
      : [],
    charmingCardPhotoPublic: !!safeData.charmingCardPhotoPublic,

    profile_setup_step: safeData.profile_setup_step ?? 0,
    profile_setup_required_done: safeData.profile_setup_required_done === true,
    profile_photo_required_done: safeData.profile_photo_required_done === true,

    reviewStatus: safeData.reviewStatus || "",
    pendingStatus: safeData.pendingStatus || "",
    reviewRequestedAt: safeData.reviewRequestedAt || null,
    pendingReviewAlertSentAt: safeData.pendingReviewAlertSentAt || null,
  };
}

function shouldRedirectToArena(currentUser) {
  return (
    currentUser?.date_profile_finished === true &&
    currentUser?.date_sleep === false &&
    currentUser?.date_pending !== true &&
    currentUser?.reviewStatus !== "pending" &&
    currentUser?.pendingStatus !== "reviewing"
  );
}

export default function ProfilePhotosPage() {
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

        const currentUser = buildCurrentUser(
          firebaseUser,
          userSnap.data(),
          userSnap.id
        );

        dispatch(setUser(currentUser));
        dispatch(userLoadingEnd());

        if (shouldRedirectToArena(currentUser)) {
          router.replace("/arena");
        }
      } catch (e) {
        console.error("[profile/photos] load error:", e);
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
      const currentUser = buildCurrentUser(
        { uid: snap.id, email: docData.email },
        docData,
        snap.id
      );

      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });

    return () => unsubDoc();
  }, [dispatch, user?.userID]);

  return (
    <>
      <Head>
        <title>프로필 사진 등록(2/2) | 차밍수프</title>
        <meta
          name="description"
          content="매칭에 사용할 프로필 사진을 등록해주세요."
        />
      </Head>

      {loading ? (
        <LoadingPage />
      ) : (
        <main className="relative mx-auto flex min-h-screen w-full max-w-[390px] flex-col bg-white md:min-h-[760px] md:max-w-[430px]">
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
                <ProfilePhotoUploadPage user={user} />
              </section>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
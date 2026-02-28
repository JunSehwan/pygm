import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
} from 'slices/user';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, getFriends } from 'firebaseConfig';
import LoadingPage from 'components/Common/Loading';
import Router from 'next/router';
import AdminDate from 'components/Admin/Date';
import { setFriends } from 'slices/user';

const AdminIndex = () => {
  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector((state) => state.user);

  // ✅ 라우팅 로딩 상태 관리
  const [nowLoading, setNowLoading] = useState(false);


  
  useEffect(() => {
    const handleStart = () => setNowLoading(true);
    const handleEnd = () => setNowLoading(false);

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleEnd);
    Router.events.on('routeChangeError', handleEnd);

    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleEnd);
      Router.events.off('routeChangeError', handleEnd);
    };
  }, []);

  // ✅ 유저 객체 변환 함수
  const mapUserData = useCallback((docData, uid) => {
    if (!docData) return null;
    return {
      userID: uid,
      ...docData,
    };
  }, []);

  // ✅ 인증 상태 감시
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());

      if (!firebaseUser) {
        router.push('/');
        return;
      }

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        dispatch(userLoadingEndwithNoone());
        return;
      }

      const userData = mapUserData(userSnap.data(), firebaseUser.uid);
      dispatch(setUser(userData));
      dispatch(userLoadingEnd());
    });

    return () => unsubscribeAuth();
  }, [auth, router, dispatch, mapUserData]);

  // ✅ 실시간 유저 정보 구독
  useEffect(() => {
    if (!user?.userID) return;

    // ✅ 유저 정보가 세팅된 후 실행
    const fetchFriends = async () => {
      const friends = await getFriends(user.userID);
      dispatch(setFriends(friends));
    };

    fetchFriends();


    const unsubscribeSnapshot = onSnapshot(doc(db, 'users', user.userID), (snap) => {
      if (!snap.exists()) return;

      const updatedData = mapUserData(snap.data(), user.userID);
      dispatch(setUser(updatedData));
      dispatch(userLoadingEnd());
    });

    return () => unsubscribeSnapshot();
  }, [dispatch, mapUserData, user?.userID]);

  return (
    <>
      <Head>
        <title>추억과 즐거움으로 이성을 만나다! 피그말리온</title>
        <meta
          name="keywords"
          content="피그말리온, 소개팅, 단체미팅, 연애, 소개팅앱, 반상회, 소통플랫폼"
        />
        <meta
          name="description"
          content="자연스러운 만남!, 나와 맞는 조건의 이성과의 만남"
        />
        <meta property="og:title" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta property="og:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta property="og:url" content="https://pygm.co.kr" />
      </Head>

      {nowLoading || loading ? <LoadingPage /> : <AdminDate />}
    </>
  );
};

export default AdminIndex;

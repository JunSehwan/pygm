import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import {
  setUser, userLoadingStart, userLoadingEnd,
  userLoadingEndwithNoone, setFriends, setAllFriends,
  setFriendsDoneFalse, setGetCardsReadyTrue
} from "slices/user";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import {
  db, getFriends, getNewFriends
} from "firebaseConfig";
import LoadingPage from 'components/Common/Loading';
import Router from 'next/router';
import Cards from 'components/Date/Cards';
import Navbar from 'components/Common/Navbar_Date';

const Index = () => {
  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading, getCardsReady } = useSelector(state => state.user);
  const [nowLoading, setNowLoading] = useState(false);

  // 페이지 전환 로딩 제어
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

  // 로그인 및 유저 데이터 세팅
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      dispatch(userLoadingStart());
      if (!firebaseUser) {
        router.push("/");
        return;
      }

      // ✅ 기존 데이터 초기화 (이전 카드 깜빡임 방지)
      dispatch(setFriends([]));
      dispatch(setAllFriends([]));

      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        dispatch(userLoadingEndwithNoone());
        return;
      }

      const docData = docSnap.data();
      const currentUser = { userID: firebaseUser.uid, ...docData };
      dispatch(setUser(currentUser));

      if (docData.withdraw) {
        alert("탈퇴한 회원입니다.");
        router.push("/");
        return;
      }

      if (docData.date_sleep) {
        alert("휴면 상태에서는 이성 소개가 불가합니다.");
        router.push("/setting/sleep");
        return;
      }

      // 카드 데이터 불러오기
      const newFriends = await getNewFriends();
      const allFriends = await getFriends();

      dispatch(setFriends(newFriends || []));
      dispatch(setAllFriends(allFriends || []));
      dispatch(setFriendsDoneFalse());
      dispatch(setGetCardsReadyTrue());
      dispatch(userLoadingEnd());
    });

    return () => unsubscribe();
  }, [auth, dispatch, router]);

  useEffect(() => {
    if (user?.datecard?.length === 0) {
      getNewFriends(); // 자동 보충
    }
  }, [user?.datecard]);
  // Firestore 실시간 업데이트
  useEffect(() => {
    if (!user?.userID) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.userID), (userDoc) => {
      if (!userDoc.exists()) return;
      const updatedData = { userID: userDoc.id, ...userDoc.data() };
      dispatch(setUser(updatedData));
    });
    return () => unsubscribe();
  }, [user?.userID, dispatch]);

  // 입력 검증 및 리디렉션
  useEffect(() => {
    if (!user?.userID) return;

    const writeThumbImage = user?.thumbimage?.length >= 2;
    const writeBasicInfo = user?.username && user?.nickname && user?.religion && user?.birthday?.year && user?.gender && user?.phonenumber && user?.address_sigugun && user?.address_sido;
    const writeCareerInfo = user?.education && user?.school && user?.job && user?.company && user?.duty && user?.salary && user?.company_location_sido && user?.company_location_sigugun && user?.jobdocument?.length !== 0;

    if (!user.date_profile_finished || !writeThumbImage || !writeBasicInfo || !writeCareerInfo) {
      alert("모든 정보를 입력해주세요!");
      router.push("/date/profile");
    } else if (user.date_pending) {
      router.push("/date/pending");
    }
  }, [user, router]);

  return (
    <>
      <Head>
        <title>피그말리온 소개팅 - 소개팅 카드보기</title>
        <meta name="keywords" content="피그말리온, 소개팅, 단체미팅, 연애, 소개팅앱, 반상회, 소통플랫폼" />
        <meta name="description" content="자연스러운 만남!, 나와 맞는 조건의 이성과의 만남" />
        <meta property="og:title" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta property="og:description" content="피그말리온에서 나의 인연을 찾아보세요!" />
        <meta property="og:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta property="og:url" content="https://pygm.co.kr" />
      </Head>

      {(nowLoading || loading || !getCardsReady)
        ? <LoadingPage />
        : (
          <Navbar>
            <Cards />
          </Navbar>
        )}
    </>
  );
};

export default Index;

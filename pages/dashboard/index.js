import React, { useEffect } from 'react';
import Signup from 'components/Auth/Signup';
import Head from 'next/head'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setUser, userLoadingStart, userLoadingEnd, userLoadingEndwithNoone } from "slices/user";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "firebaseConfig";
import LoadingPage from 'components/Common/Loading';
import Router from 'next/router';
import Dashboard from 'components/Dashboard';

const index = () => {

  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector(state => state.user);
  // useEffect(() => {
  //   if ((user || user?.userID)) {
  //     if (user?.purpose === 1) {
  //       router.push('/friends')
  //     } else {
  //       router.push('/news')
  //     }
  //   }
  // }, [router, user]);
  useEffect(() => {
    const authStateListener = onAuthStateChanged(auth, async (user) => {
      dispatch(userLoadingStart());
      if (!user) return dispatch(userLoadingEndwithNoone());

      const docRef = doc(db, "users", user?.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists())
        return dispatch(userLoadingEndwithNoone());

      const docData = docSnap.data();

      const currentUser = {
        userID: user.uid,
        username: docData.username,
        email: docData.email,
        email_using: docData.email_using,
        birthday: docData.birthday,
        gender: docData.gender,
        avatar: docData.avatar,
        phonenumber: docData.phonenumber,
        category: docData.category,
        url_one: docData.url_one,
        url_two: docData.url_two,
        url_three: docData.url_three,
        about: docData.about,
        address: docData.address,
        style: docData.style,
        survey: docData.survey,
        favorites: docData.favorites,
        favLikes: docData.favLikes,
        experts: docData.experts,
        expertNum: docData.expertNum,
        point: docData.point,
        points: docData.points,
        givePoint: docData.givePoint,
        infoseen: docData.infoseen,
        purpose: docData.purpose,
      };
      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });
    return () => {
      authStateListener();
    };
  }, [auth, dispatch, user?.uid, user?.userID]);

  useEffect(() => {
    if (!user?.userID) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.userID), (user) => {
      if (!user?.exists()) return;
      const docData = user?.data();

      const currentUser = {
        userID: user.id,
        username: docData.username,
        email: docData.email,
        birthday: docData.birthday,
        gender: docData.gender,
        avatar: docData.avatar,
        phonenumber: docData.phonenumber,
        category: docData.category,
        url_one: docData.url_one,
        url_two: docData.url_two,
        url_three: docData.url_three,
        about: docData.about,
        address: docData.address,
        style: docData.style,
        survey: docData.survey,
        favorites: docData.favorites,
        favLikes: docData.favLikes,
        experts: docData.experts,
        expertNum: docData.expertNum,
        point: docData.point,
        points: docData.points,
        givePoint: docData.givePoint,
        infoseen: docData.infoseen,
        purpose: docData.purpose,
      };
      dispatch(setUser(currentUser));
      dispatch(userLoadingEnd());
    });
    return () => {
      unsubscribe();
    };
  }, [dispatch, user?.uid, user?.userID]);

  return (
    <>
      <Head>
        <title>추억과 즐거움으로 이성을 만나다! 피그말리온</title>

        <meta name="keywords" content="피그말리온, 소개팅, 단체미팅, 연애, 소개팅앱, 반상회, 소통플랫폼" />
        <meta name="description" content="자연스러운 만남!, 나와 맞는 조건의 이성과의 만남" />

        <meta name="application-name" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta name="msapplication-tooltip" content="피그말리온(PYGMalion)" />

        <meta property="og:type" content="개성있는 채용, 피그말리온(PYGMalion)" />
        <meta property="og:title" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta property="og:description" content="피그말리온에서 나의 인연을 찾아보세요!" />
        <meta property="og:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta property="og:url" content="https://pygm.co.kr" />

        <meta name="twitter:card" content="피그말리온(PYGMalion)에서 인연을 찾아보세요!" />
        <meta name="twitter:title" content="가장 자연스러운 이성과의 만남, 피그말리온" />
        <meta name="twitter:description" content="피그말리온에서 나의 인연을 찾아보세요!" />
        <meta name="twitter:image" content="https://pygm.co.kr/logo/pygm.png" />
        <meta name="twitter:domain" content="https://pygm.co.kr" />
      </Head>

      {loading ?
        <LoadingPage />
        :
        <Dashboard />
      }
    </>

  );
};



export default index;
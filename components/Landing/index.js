import React, { useEffect } from 'react';
import TopSection from './TopSection';
import LoginForm from './LoginForm';
import Navbar from './Navbar';
import Head from 'next/head'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { setUser, userLoadingStart, userLoadingEnd, userLoadingEndwithNoone } from "slices/user";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db, getEducationsByUserId, getCareersByUserId } from "firebaseConfig";
import LoadingPage from 'components/Common/Loading';
import Router from 'next/router';

const index = () => {

  const auth = getAuth();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading } = useSelector(state => state.user);

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
    if ((user || user?.userID)) {
      // if (user?.purpose === 1) {
      router.push('/dashboard')
      // } else {
      //   router.push('/dashboard')
      // }
    }
  }, [router, user]);

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
    // <Navbar>
    <div className='max-w-md mx-auto pt-[var(--navbar-height)] md:px-2 pb-4 md:pb-auto flex flex-col min-h-screen overflow-hidden"'>
      <main className="flex-grow" >
        <TopSection />
        {/* <FeaturesHome /> */}
        {/* <Features /> */}
        <LoginForm />
        {/* <Newsletter /> */}
      </main >
      {/* <Footer /> */}
    </div>
    // </Navbar>
  );
};

export default index;
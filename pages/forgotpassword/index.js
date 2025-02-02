import React, { useEffect, useState } from 'react';
import PasswordForgot from 'components/Setting/PasswordForgot';
import Head from 'next/head'
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import LoadingPage from 'components/Common/Loading';
import Router from 'next/router';

const index = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  if (router.isFallback) {
    return (<h1>Data is loading</h1>);
  }

  //로딩을 위한
  const [nowLoading, setNowLoading] = useState(false);
  useEffect(() => {
    const start = () => {
      setNowLoading(true);
    };
    const end = () => {
      setNowLoading(false);
    };
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);
    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
    };
  }, []);


  return (
    <>
      <Head>
        <title>비밀번호 재설정</title>

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

      {nowLoading ?
        <LoadingPage />
        :
        <>
          <PasswordForgot />
        </>
      }
    </>
  );
};

export default index;
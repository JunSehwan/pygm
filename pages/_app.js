import React, { useEffect } from 'react';
import Head from 'next/head';
import { ThemeProvider } from 'styled-components';
import GlobalStyle, { theme } from './styles/global';
import AOS from "aos";
import 'aos/dist/aos.css';
import { useRouter } from 'next/router';
import { wrapper } from "store/index";
import 'tailwindcss/tailwind.css'
import Script from 'next/script';
import { Provider } from 'react-redux';
import Proptypes from 'prop-types';


const _app = ({ Component, pageProps, ...rest }) => {

  const router = useRouter()
  const { store, props } = wrapper.useWrappedStore(rest);

  //우클릭 방지
  useEffect(() => {
    document.oncontextmenu = function () {
      return false;
    }
  }, [])


  useEffect(() => {
    AOS.init({
      delay: 400,
      duration: 800,
    });
  });

  // 리라우팅시 root페이지로 이동(동적페이지) - 방지를 위함
  useEffect(() => {
    router.push(window.location.href)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <GlobalStyle />
      <Script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></Script>
      
      <Head>
        <title>추억과 즐거움으로 이성을 만나다! 피그말리온</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="apple-touch-icon" sizes="57x57" href="/logo/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/logo/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/logo/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/logo/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/logo/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/logo/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/logo/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/logo/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logo/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/logo/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/logo/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/logo/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/logo/favicon-16x16.png" />
        <link rel="manifest" href="/logo/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="naver-site-verification" content="703be80d3c30d67edfd91f465ba95a258fd65d96" />
        
      </Head>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <Component {...pageProps} />
        </Provider>
      </ThemeProvider>
    </>
  );
};

_app.Proptypes = {
  Component: Proptypes.elementType,
  store: Proptypes.object,
}

export default _app;

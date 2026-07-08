import React, { useEffect } from "react";
import Head from "next/head";
import { ThemeProvider } from "styled-components";
import GlobalStyle, { theme } from "./styles/global";
import AOS from "aos";
import "aos/dist/aos.css";
import { useRouter } from "next/router";
import { wrapper } from "store/index";
import "tailwindcss/tailwind.css";
import Script from "next/script";
import { Provider } from "react-redux";
import PropTypes from 'prop-types';
import * as gtag from "lib/gtag";
import { GoogleTagManager } from "@next/third-parties/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import StyleGuestResultSync from "components/Tests/Style/StyleGuestResultSync";
import LoadingPage from "components/Common/Loading";
import { useLoading } from "components/Common/useLoading";

export const GOOGLE_TAG = process.env.NEXT_PUBLIC_GOOGLE_TAG;
export const GOOGLE_ANAL = process.env.NEXT_PUBLIC_GOOGLE_ANAL;

const _app = ({ Component, pageProps, ...rest }) => {
  const router = useRouter();
  const { store } = wrapper.useWrappedStore(rest);
  const nowLoading = useLoading();

  useEffect(() => {
    document.oncontextmenu = function () {
      return false;
    };
  }, []);

  useEffect(() => {
    AOS.init({
      delay: 400,
      duration: 800,
    });
  }, []);

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };

    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <GlobalStyle />
      <StyleGuestResultSync />

      <Script src="https://unpkg.com/aos@2.3.1/dist/aos.js" />

      <Script
        src="https://cdn.portone.io/v2/browser-sdk.js"
        strategy="afterInteractive"
      />

      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />

      <div id="fb-root" />

      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />

      <Head>
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo/logo.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/logo/ms-icon-144x144.png" />
        <meta
          name="naver-site-verification"
          content="703be80d3c30d67edfd91f465ba95a258fd65d96"
        />
      </Head>

      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <Component {...pageProps} />
          {nowLoading ? <LoadingPage /> : null}
          <GoogleTagManager gtmId={GOOGLE_TAG} />
          <GoogleAnalytics gaId={GOOGLE_ANAL} />
        </Provider>
      </ThemeProvider>
    </>
  );
};

_app.propTypes = {
  Component: PropTypes.elementType,
  store: PropTypes.object,
};

export default _app;
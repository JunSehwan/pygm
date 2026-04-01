import Router from "next/router";
import { useEffect, useRef, useState } from "react";

export const useLoading = () => {
  const [nowLoading, setNowLoading] = useState(false);

  const startDelayTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const visibleAtRef = useRef(0);

  useEffect(() => {
    const clearAllTimers = () => {
      if (startDelayTimerRef.current) {
        clearTimeout(startDelayTimerRef.current);
        startDelayTimerRef.current = null;
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const start = () => {
      clearAllTimers();

      startDelayTimerRef.current = setTimeout(() => {
        visibleAtRef.current = Date.now();
        setNowLoading(true);
      }, 120);
    };

    const end = () => {
      if (startDelayTimerRef.current) {
        clearTimeout(startDelayTimerRef.current);
        startDelayTimerRef.current = null;
      }

      if (!nowLoading) {
        setNowLoading(false);
        return;
      }

      const visibleFor = Date.now() - visibleAtRef.current;
      const minVisible = 260;
      const remain = Math.max(minVisible - visibleFor, 0);

      hideTimerRef.current = setTimeout(() => {
        setNowLoading(false);
      }, remain);
    };

    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);

    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
      clearAllTimers();
    };
  }, [nowLoading]);

  return nowLoading;
};
import { useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  captureTwoWeeksAttribution,
  getTwoWeeksVisitorId,
} from "lib/twoWeeksAttribution";

export default function CampaignAttributionTracker() {
  useEffect(() => {
    const attribution = captureTwoWeeksAttribution(window.location.search);
    const source = attribution?.lastSource || "";
    const campaign = attribution?.lastCampaign || "";
    if (!source || !campaign) return;

    const trackVisit = httpsCallable(
      getFunctions(undefined, "asia-northeast3"),
      "trackTwoWeeksCampaignVisit"
    );
    trackVisit({
      source,
      campaign,
      visitorId: getTwoWeeksVisitorId(),
      landingPath: window.location.pathname,
    }).catch((error) => {
      // 마케팅 집계 실패는 랜딩/가입 경험에 영향을 주지 않는다.
      console.warn("[TwoWeeks] campaign visit tracking skipped:", error?.code || error?.message || error);
    });
  }, []);

  return null;
}


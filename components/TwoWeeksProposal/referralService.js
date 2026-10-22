import { getFunctions, httpsCallable } from "firebase/functions";
const callable = (name, params) => httpsCallable(getFunctions(undefined, "asia-northeast3"), name)(params).then((result) => result.data);
export const createMyTwoWeeksInviteLink = (applicationId) => callable("createMyTwoWeeksInviteLink", { applicationId });

export const getMyTwoWeeksReferralSummary = (applicationId) => callable("getMyTwoWeeksReferralSummary", { applicationId });

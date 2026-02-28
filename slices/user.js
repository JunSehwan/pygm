import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from 'next-redux-wrapper';


export const initialState = {
  user: null,
  friend: null,
  // wink: 0,
  friends: [],
  likesArr: [],
  likedArr: [],
  allFriends: [],
  allFriendsLoading: false,
  friendSleepLoading: false,
  friendsIntroduceStart: false,
  // nowLoading: false,
  loading: true,
  friendsLoading: false,
  otherFriendLoading: false,
  likesLoading: false,
  likedLoading: false,
  isLoggedIn: false,
  signUpSuccess: false,
  updateBasicProfileSuccess: false,
  updateStyleDone: false,
  updateSurveyDone: false,
  addLikeDone: false,
  addDislikeDone: false,

  patchMycompanyInfoDone: false,
  patchMycompanyAdditionalInfoDone: false,
  patchThinkMbtiInfoDone: false,
  patchHobbyDone: false,
  patchRomanceDone: false,
  patchCareerLivingDone: false,
  patchEtcDone: false,
  writeDateprofileDone: false,
  patchThumbimageDone: false,
  uploadJobDocumentDone: false,
  patchDate_lastIntroduceDone: false,
  updateUserSleepDone: false,
  setWithdrawDone: false,

  getCardsReady: false,

  buyWinkDone: false,
  patchWinkUpDone: false,
  // 권한
  // isExpert: false,
  // isAdmin: false,
  // setExpertState: false,
  // setAdminState: false,
  // addPointDone: false,
  // updateInfoSeen: false,
  // updatePurposeDone: false,
  // updateCliptypeDone: false,
  // patchCategoryDone: false,
  // patchCompanylogoDone: false,
  // companylogoPreview: "",
  // avatarPreview: "",
  // updateAvatarDone: false,
  // updateAdditionalInfoDone: false,
  // addAdviceDone: false,
  // deleteAdviceDone: false,
  // addCoccocDone: false,
  // deleteCoccocDone: false,
  // addJobofferDone: false,
  // deleteJobofferDone: false,
  // scrollPosition: 0,
  // scrolling: false,
  // categoryFilter: null,

};

export const user = createSlice({
  name: "user",
  initialState,
  reducers: {

    login: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = true;
      state.signUpSuccess = true;
    },
    signOut: (state, action) => {
      state.user = null;
      state.isLoggedIn = false;
      state.signUpSuccess = false;
    },
    signUp(state, action) {
      state.user = action.payload;
      state.signUpSuccess = true;
      state.isLoggedIn = true;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    userLoadingStart(state) {
      state.loading = true;
    },
    userLoadingEnd(state) {
      state.loading = false;
    },
    friendSleepLoadingStart(state) {
      state.friendSleepLoading = true;
    },
    friendSleepLoadingEnd(state) {
      state.friendSleepLoading = false;
    },
    // pageLoadingStart(state) {
    //   state.nowLoading = true;
    // },
    // pageLoadingEnd(state) {
    //   state.nowLoading = false;
    // },
    userLoadingEndwithNoone(state) {
      state.loading = false;
      state.user = null;
    },
    resetUserState(state) {
      state.user = null;
      // state.user.username = initialState.user.username;
      // state.user.tag = initialState.user.tag;
      // state.user.avatar = initialState.user.avatar;
      // state.user.about = initialState.user.about;
      // state.user.userID = initialState.user.userID;
      // state.user.email = initialState.user.email;
    },
    patchThumbimage(state, action) {
      state.user.thumbimage = action.payload;
      state.patchThumbimageDone = true;
    },
    patchThumbimageDoneFalse(state, action) {
      state.patchThumbimageDone = false;
    },
    updateBasicProfile(state, action) {
      state.user.username = action.payload.username;
      state.user.nickname = action.payload.nickname;
      state.user.religion = action.payload.religion;
      state.user.birthday = action.payload.newForm;
      state.user.phonenumber = action.payload.tel;
      state.user.address_sido = action.payload.address_sido;
      state.user.address_sigugun = action.payload.address_sigugun;
      state.user.status = action.payload.status;
      state.user.height = action.payload.height;
      state.updateBasicProfileSuccess = true;
    },

    // updateBasicProfile(state, action) {
    //   state.user.username = action.payload.username;
    //   state.user.nickname = action.payload.nickname;
    //   state.user.religion = action.payload.religion;
    //   state.user.birthday = action.payload.newForm;
    //   // state.user.gender = action.payload.gender;
    //   state.user.phonenumber = action.payload.tel;
    //   state.user.address_sigugun = action.payload.address_sigugun;
    //   state.user.address_sido = action.payload.address_sido;
    //   state.updateBasicProfileSuccess = true;
    // },
    updateBasicProfileFalse(state, action) {
      state.updateBasicProfileSuccess = false;
    },
    patchMycompanyInfo(state, action) {
      state.user.education = action.payload.education;
      state.user.school = action.payload.school;
      state.user.school_open = action.payload.school_open;
      state.user.job = action.payload.job;
      state.user.company = action.payload.company;
      state.user.company_open = action.payload.company_open;
      state.user.duty = action.payload.duty;
      state.user.salary = action.payload.salary;
      state.user.company_location_sido = action.payload.company_location_sido;
      state.user.company_location_sigugun = action.payload.company_location_sigugun;
      state.patchMycompanyInfoDone = true;
    },
    patchMycompanyInfofalse(state, action) {
      state.patchMycompanyInfoDone = false;
    },
    uploadJobDocument(state, action) {
      state.user.jobdocument = action.payload;
      state.uploadJobDocumentDone = true;
    },
    uploadJobDocumentDoneFalse(state, action) {
      state.uploadJobDocumentDone = false;
    },
    patchThinkMbtiInfo(state, action) {
      state.user.mbti_ei = action.payload.mbti_ei;
      state.user.mbti_sn = action.payload.mbti_sn;
      state.user.mbti_tf = action.payload.mbti_tf;
      state.user.mbti_jp = action.payload.mbti_jp;
      state.patchThinkMbtiInfoDone = true;
    },
    patchThinkMbtiInfoFalse(state, action) {
      state.patchThinkMbtiInfoDone = false;
    },
    patchHobby(state, action) {
      state.user.hobby = action.payload.hobby;
      state.user.drink = action.payload.drink;
      state.user.health = action.payload.health;
      state.user.hotplace = action.payload.hotplace;
      state.user.tour = action.payload.tour;
      state.user.tourlike = action.payload.tourlike;
      state.user.tourpurpose = action.payload.tourpurpose;
      state.user.hobbyshare = action.payload.hobbyshare;
      state.user.interest = action.payload.interest;

      state.patchHobbyDone = true;
    },
    patchHobbyFalse(state, action) {
      state.patchHobbyDone = false;
    },
    patchRomance(state, action) {
      state.user.opfriend = action.payload.opfriend;
      state.user.friendmeeting = action.payload.friendmeeting;
      state.user.longdistance = action.payload.longdistance;
      state.user.datecycle = action.payload.datecycle;
      state.user.dateromance = action.payload.dateromance;
      state.user.contact = action.payload.contact;
      state.user.contactcycle = action.payload.contactcycle;
      state.user.passwordshare = action.payload.passwordshare;
      state.user.wedding = action.payload.wedding;
      state.user.wedding_dating = action.payload.wedding_dating;
      state.user.prefer_age_min = action.payload.prefer_age_min;
      state.user.prefer_age_max = action.payload.prefer_age_max;

      state.patchRomanceDone = true;
    },
    patchRomanceFalse(state, action) {
      state.patchRomanceDone = false;
    },
    patchCareerLiving(state, action) {
      state.user.career_goal = action.payload.career_goal;
      state.user.living_weekend = action.payload.living_weekend;
      state.user.living_consume = action.payload.living_consume;
      state.user.living_pet = action.payload.living_pet;
      state.user.living_tatoo = action.payload.living_tatoo;
      state.user.living_smoke = action.payload.living_smoke;
      state.user.living_charming = action.payload.living_charming;

      state.patchCareerLivingDone = true;
    },
    patchCareerLivingFalse(state, action) {
      state.patchCareerLivingDone = false;
    },
    patchEtc(state, action) {
      state.user.religion_important = action.payload.religion_important;
      state.user.religion_visit = action.payload.religion_visit;
      state.user.religion_accept = action.payload.religion_accept;
      state.user.food_taste = action.payload.food_taste;
      state.user.food_like = action.payload.food_like;
      state.user.food_dislike = action.payload.food_dislike;
      state.user.food_vegetarian = action.payload.food_vegetarian;
      state.user.food_spicy = action.payload.food_spicy;
      state.user.food_diet = action.payload.food_diet;

      state.patchEtcDone = true;
    },
    patchEtcFalse(state, action) {
      state.patchEtcDone = false;
    },
    writeDateprofile(state, action) {
      state.user.date_profile_finished = action.payload.date_profile_finished;
      state.user.date_pending = action.payload.date_pending;
      state.writeDateprofileDone = true;
    },
    writeDateprofileDoneFalse(state, action) {
      state.writeDateprofileDone = false;
    },

    setFriends(state, action) {
      state.friendsLoading = true;
      state.friends = action.payload;
      // state.getCardsReady = true;
    },
    setFriendsDoneFalse(state, action) {
      state.friendsLoading = false;
    },
    setAllFriends(state, action) {
      state.allFriendsLoading = true;
      state.allFriends = action.payload;
    },
    setAllFriendsDoneFalse(state, action) {
      state.allFriendsLoading = false;
    },
    setOtherUser(state, action) {
      state.friend = action.payload;
      state.otherFriendLoading = true;
    },
    setOtherUserDoneFalse(state) {
      state.otherFriendLoading = false;
    },
    likeToUser(state, action) {
      // const target = state.friends?.find((v) => v?.userID === action.payload.targetId);
      // target?.liked?.unshift({ userId: action.payload.userId, username: action.payload.username, startAt: action.payload.startAt });
      // state.user.wink = state.user.wink - 1;
      state.addLikeDone = true;
    },
    addLikeDoneFalse(state) {
      state.addLikeDone = false;
    },
    dislikeToUser(state, action) {
      const target = state.friends?.find((v) => v?.userID === action.payload.targetId);
      target?.disliked?.unshift({ userId: action.payload.userId, username: action.payload.username, startAt: action.payload.startAt });
      target.wink = target.wink - 1;
      state.addDislikeDone = true;
    },
    addDislikeDoneFalse(state) {
      state.addDislikeDone = false;
    },

    setLikesArr(state, action) {
      state.likesLoading = true;
      state.likesArr = action.payload;
    },
    setLikesArrDone(state, action) {
      state.likesLoading = false;
    },
    setLikedArr(state, action) {
      state.likedLoading = true;
      state.likedArr = action.payload;
    },
    setLikedArrDone(state, action) {
      state.likedLoading = false;
    },
    updateUserSleep(state, action) {
      state.user.date_sleep = action.payload.date_sleep;
      state.updateUserSleepDone = true;
    },
    updateUserSleepDoneFalse(state, action) {
      state.updateUserSleepDone = false;
    },
    setWithdraw(state, action) {
      state.setWithdrawDone = true;
    },
    setWithdrawDoneFalse(state, action) {
      state.setWithdrawDone = false;
    },
    patchDate_lastIntroduce(state, action) {
      state.user.date_lastIntroduce = action.payload.date_lastIntroduce;
      state.patchDate_lastIntroduceDone = true;
    },
    setFriendSleep(state, action) {
      const targeting = state.friends?.find((v) => v?.userID === action.payload?.id)
      // target?.date_sleep = action.payload.date_sleep;
      if (!!targeting?.date_sleep) {
        targeting.date_sleep = action.payload.date_sleep;
      }
      // targeting.date_sleep = action.payload.date_sleep;
    },
    setFriendWithdraw(state, action) {
      const targeting = state.friends?.find((v) => v?.userID === action.payload?.id)
      // target?.withdraw = action.payload.withdraw;
      // state.friends.find((v) => v?.userID === action.payload?.id)?.withdraw = action.payload.withdraw
      if (!!targeting?.withdraw) {
        targeting.withdraw = action.payload.withdraw;
      }
      // targeting.withdraw = action.payload.withdraw;
    },
    // extraReducers: {
    //   // The HYDRATE function is what manages the state between client and server
    //   [HYDRATE]: (state, action) => {
    //     return {
    //       ...state,
    //       ...action.payload.user,
    //     };
    //   },
    // }
    setGetCardsReadyTrue(state, action) {
      state.getCardsReady = true;
    },
    setIntroduceStart(state, action) {
      state.friendsIntroduceStart = true;
    },
    patchWinkUp(state, action) {
      const target = state.friends?.find((v) => v?.userID === action.payload.targetId);
      target.wink = action.payload.wink;
      target.date_pending = action.payload.profilePending;
      target.date_profile_finished = action.payload.profileDone;
      state.patchWinkUpDone = true;
    },
    patchWinkUpDoneFalse(state) {
      state.patchWinkUpDone = false;
    },
    buyWink(state) {
      state.buyWinkDone = true;
    },
    buyWinkDoneFalse(state) {
      state.buyWinkDone = false;
    },
    setPaybackWinks(state, action) {
      // action.payload?.removeArr?.map((v) => (
      //   state.user.likes?.filter((e) => e?.userId !== v?.userId)
      // ))

      // action.payload?.fixArr?.map((v) => (
      //   state.user.likes?.unshift(v)
      // ))
      // state.user.wink = state.user.wink + action.payload.fixArr?.length;
    },
  },
  extraReducers: (builder) => {
    builder
    // .addCase((state, action) => {
    //         state,
    //         action.payload.user,
    //   // action is inferred correctly here if using TS
    // })
    // You can chain calls, or have separate `builder.addCase()` lines each time

  },
});

export const {
  login,
  signUp,
  signOut,
  setUser,
  userLoadingStart,
  userLoadingEnd,
  userLoadingEndwithNoone,
  resetUserState,
  patchThumbimage,
  patchThumbimageDoneFalse,
  updateBasicProfile,
  updateBasicProfileFalse,
  patchMycompanyInfo,
  patchMycompanyInfofalse,
  uploadJobDocument,
  uploadJobDocumentDoneFalse,
  patchThinkMbtiInfo,
  patchThinkMbtiInfoFalse,
  patchHobby,
  patchHobbyFalse,
  patchRomance,
  patchRomanceFalse,
  patchCareerLiving,
  patchCareerLivingFalse,
  patchEtc,
  patchEtcFalse,
  setFriends,
  setFriendsDoneFalse,
  setOtherUser,
  setOtherUserDoneFalse,
  likeToUser,
  addLikeDoneFalse,
  dislikeToUser,
  addDislikeDoneFalse,
  setLikesArr,
  setLikesArrDone,
  setLikedArr,
  setLikedArrDone,
  updateUserSleep,
  updateUserSleepDoneFalse,
  setWithdraw,
  setWithdrawDoneFalse,
  patchDate_lastIntroduce,
  setAllFriends,
  setAllFriendsDoneFalse,
  setFriendSleep,
  setFriendWithdraw,
  friendSleepLoadingStart,
  friendSleepLoadingEnd,
  writeDateprofile,
  writeDateprofileDoneFalse,
  setGetCardsReadyTrue,
  setIntroduceStart,
  // pageLoadingStart,
  // pageLoadingEnd
  buyWink,
  buyWinkDoneFalse,
  setPaybackWinks,
  patchWinkUp,
  patchWinkUpDoneFalse,
} = user.actions;

export const useUserState = () => useAppSelector((state) => state.user);
export default user.reducer;

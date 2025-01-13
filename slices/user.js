import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from 'next-redux-wrapper';


export const initialState = {
  user: null,
  friend: null,
  users: [],

  loading: false,
  isLoggedIn: false,
  signUpSuccess: false,
  updateBasicProfileSuccess: false,
  updateStyleDone: false,
  updateSurveyDone: false,

  // 권한
  // isExpert: false,
  // isAdmin: false,
  // setExpertState: false,
  // setAdminState: false,
  // addPointDone: false,
  // updateInfoSeen: false,
  // updatePurposeDone: false,
  // updateCliptypeDone: false,
  patchMycompanyInfoDone: false,
  patchMycompanyAdditionalInfoDone: false,
  patchThinkMbtiInfoDone: false,
  patchHobbyDone: false,
  patchRomanceDone: false,
  // patchCategoryDone: false,
  // patchCompanylogoDone: false,
  // companylogoPreview: "",
  // avatarPreview: "",
  updateAvatarDone: false,
  updateAdditionalInfoDone: false,
  patchThumbimageDone: false,
  uploadJobDocumentDone: false,
  addLikeDone: false,
  addUnlikeDone: false,
  addAdviceDone: false,
  deleteAdviceDone: false,
  addCoccocDone: false,
  deleteCoccocDone: false,
  addJobofferDone: false,
  deleteJobofferDone: false,
  scrollPosition: 0,
  scrolling: false,
  categoryFilter: null,
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
      state.user.gender = action.payload.gender;
      state.user.phonenumber = action.payload.tel;
      state.user.address_sigugun = action.payload.address_sigugun;
      state.user.address_sido = action.payload.address_sido;
      state.updateBasicProfileSuccess = true;
    },
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
} = user.actions;

export const useUserState = () => useAppSelector((state) => state.user);
export default user.reducer;

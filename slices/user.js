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
  isExpert: false,
  isAdmin: false,
  setExpertState: false,
  setAdminState: false,
  addPointDone: false,
  updateInfoSeen: false,
  updatePurposeDone: false,
  updateCliptypeDone: false,
  patchMycompanyInfoDone: false,
  patchMycompanyAdditionalInfoDone: false,
  patchCategoryDone: false,
  patchCompanylogoDone: false,
  companylogoPreview: "",
  avatarPreview: "",
  updateAvatarDone: false,
  updateAdditionalInfoDone: false,
  patchThumbvideoDone: false,
  patchThumbimageDone: false,
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
} = user.actions;

export const useUserState = () => useAppSelector((state) => state.user);
export default user.reducer;

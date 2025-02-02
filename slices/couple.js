import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from 'next-redux-wrapper';


export const initialState = {
  mainCouples: [],
  myCouples: [],
  couple: null,
  loadCouplesDone: false,
  loadMyCouplesDone: false,

};

export const couple = createSlice({
  name: "couple",
  initialState,
  reducers: {
    setDateMatching: (state, action) => {
      state.mainCouples.unshift(action.payload);
      state.loadCouplesDone = true;
    },
    setDateMatchingDoneFalse: (state) => {
      state.loadCouplesDone = false;
    },
    setMyCouples: (state, action) => {
      state.myCouples = action.payload;
      state.loadMyCouplesDone = true;
    },
    setMyCouplesDone: (state) => {
      state.loadMyCouplesDone = false;
    },
    // extraReducers: {
    //   // The HYDRATE function is what manages the state between client and server
    //   [HYDRATE]: (state, action) => {
    //     return {
    //       ...state,
    //       ...action.payload.couple,
    //     };
    //   },
    // }
  },
  extraReducers: (builder) => {
    builder
    // .addCase((state, action) => {
    //         state,
    //         action.payload.couple,
    //   // action is inferred correctly here if using TS
    // })
    // You can chain calls, or have separate `builder.addCase()` lines each time

  },
});

export const {
  setDateMatching,
  setDateMatchingDoneFalse,
  setMyCouples,
  setMyCouplesDone,
} = couple.actions;

export const useCoupleState = () => useAppSelector((state) => state.couple);
export default couple.reducer;

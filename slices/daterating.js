import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from 'next-redux-wrapper';


export const initialState = {
  RatingList: [],
  MyRatingList: [],
  RatingToMeList: [],
  daterating: null,
  loadRatingListDone: false,
  loadMyRatingListDone: false,
  loadRatingToMeListDone: false,
  loadAllRatingListDone: false,
};

export const daterating = createSlice({
  name: "daterating",
  initialState,
  reducers: {
    plusDateRating: (state, action) => {
      state.MyRatingList.unshift(action.payload);
      state.loadRatingListDone = true;
    },
    plusDateRatingDoneFalse: (state) => {
      state.loadRatingListDone = false;
    },

    setAllRating: (state, action) => {
      state.RatingList = action.payload;
      state.loadAllRatingListDone = true;
    },
    setAllRatingDone: (state) => {
      state.loadAllRatingListDone = false;
    },

    setMyRating: (state, action) => {
      state.MyRatingList = action.payload;
      state.loadMyRatingListDone = true;
    },
    setMyRatingDone: (state) => {
      state.loadMyRatingListDone = false;
    },
    
    setRatingToMe: (state, action) => {
      state.RatingToMeList = action.payload;
      state.loadRatingToMeListDone = true;
    },
    setRatingToMeDone: (state) => {
      state.loadRatingToMeListDone = false;
    },
    // extraReducers: {
    //   // The HYDRATE function is what manages the state between client and server
    //   [HYDRATE]: (state, action) => {
    //     return {
    //       ...state,
    //       ...action.payload.daterating,
    //     };
    //   },
    // }
  },
  extraReducers: (builder) => {
    builder
    // .addCase((state, action) => {
    //         state,
    //         action.payload.daterating,
    //   // action is inferred correctly here if using TS
    // })
    // You can chain calls, or have separate `builder.addCase()` lines each time

  },
});

export const {
  plusDateRating,
  plusDateRatingDoneFalse,
  setAllRating,
  setAllRatingDone,
  setMyRating,
  setMyRatingDone,
  setRatingToMe,
  setRatingToMeDone,
} = daterating.actions;

export const useCoupleState = () => useAppSelector((state) => state.daterating);
export default daterating.reducer;

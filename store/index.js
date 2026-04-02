import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";

import userReducer from "slices/user";
import coupleReducer from "slices/couple";
import dateratingReducer from "slices/daterating";

const makeStore = () =>
  configureStore({
    devTools: process.env.NODE_ENV !== "production",
    reducer: {
      user: userReducer,
      couple: coupleReducer,
      daterating: dateratingReducer,
    },
  });

export const wrapper = createWrapper(makeStore, {
  debug: true,
});
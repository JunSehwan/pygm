import { configureStore } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import { applyMiddleware, compose, legacy_createStore as createStore } from "redux";

// import userSettingsReducer from "slices/userSettings";
// import sectionSettingsReducer from "slices/sectionSettings";
import userReducer from "slices/user";
// import categoryReducer from "slices/category";
// import educationReducer from "slices/education";
// import careerReducer from "slices/career";
// import mystyleReducer from "slices/mystyle";
// import boardReducer from "slices/board";
// import sectionReducer from "slices/section";
// import skillReducer from "slices/skill";

// import addServerReducer from "slices/addServer";
// import chatReducer from "slices/chat";
// import jobofferReducer from "slices/joboffer";
// import coccocReducer from "slices/coccoc";
// import serverSettingsReducer from "slices/serverSettings";
// import sendGifReducer from "slices/sendGif";

const makeStore =
  () => {
    return configureStore({
      devTools: process.env.NODE_ENV !== 'production',

      reducer: {
        user: userReducer,
        // userSettings: userSettingsReducer,
        // sectionSettings: sectionSettingsReducer,
        // category: categoryReducer,
        // education: educationReducer,
        // career: careerReducer,
        // mystyle: mystyleReducer,
        // board: boardReducer,
        // section: sectionReducer,
        // skill: skillReducer,

        // chat: chatReducer,
        // joboffer: jobofferReducer,
        // coccoc: coccocReducer,
        // serverSettings: serverSettingsReducer,
        // addServer: addServerReducer,
        // sendGif: sendGifReducer,
      },
    });
  }


export const wrapper = createWrapper(makeStore, {
  debug: true
});
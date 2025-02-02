import { combineReducers } from '@reduxjs/toolkit';

import { HYDRATE } from 'next-redux-wrapper';
import userReducer from './user';
import coupleReducer from './couple';
import dateratingReducer from './daterating';
// import userSettingsReducer from './userSettings';
// import sectionSettingsReducer from './sectionSettings';
// import categoryReducer from './category';
// import educationReducer from './education';
// import careerReducer from './career';
// import mystyleReducer from './mystyle';
// import boardReducer from './board';
// import sectionReducer from './section';
// import skillReducer from './skill';

// import addServerReducer from './addServer';
// import sendGifReducer from './sendGif';
// import serverSettingsReducer from './serverSettings';
// import chatReducer from './chat';
// import jobofferReducer from './joboffer';
// import coccocReducer from './coccoc';

const rootReducer = combineReducers({
  userReducer,
  coupleReducer,
  dateratingReducer,
  // userSettingsReducer,
  // educationReducer,
  // careerReducer,
  // mystyleReducer,
  // boardReducer,
  // sectionReducer,
  // skillReducer,
  // sectionSettingsReducer,

  // addServerReducer,
  // sendGifReducer,
  // serverSettingsReducer,
  // chatReducer,
  // jobofferReducer,
  // coccocReducer,

});

export const reducer = (state, action) => {
  if (action.type === HYDRATE) {
    return {
      ...state,
      ...action.payload,
    };
  }
  return rootReducer(state, action);
};

export default rootReducer;
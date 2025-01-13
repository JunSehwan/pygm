import React from 'react';
import PropTypes from 'prop-types';
import Signup from './Signup.js';
import Login from './Login';


const TabButton = ({ tabIndex, text, onClick }) => {
  const isSignupTab = tabIndex === 1;
  const isSignupBtn = text === "회원가입";

  const signupBtnColor = isSignupTab
    ? "text-white bg-purple-600"
    : "text-purple-600 bg-white";
  const loginBtnColor = !isSignupTab
    ? "text-white bg-purple-600"
    : "text-purple-600 bg-white";

  const color = isSignupBtn ?
    signupBtnColor : loginBtnColor;

  return <a
    className={
      "text-[0.88rem] font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal " +
      color
    }
    onClick={e => {
      e.preventDefault();
      onClick();
    }}
    data-toggle="tab"
    role="tablist"
  >
    {text}
  </a>
}

const AuthTab = ({ tabIndex, setTabIndex, handleCancelModal }) => {

  return (
    <div className="flex flex-wrap">
      <div className="w-full">
        <ul
          className="flex mb-0 list-none flex-wrap pt-3 pb-4 flex-row"
          role="tablist"
        >
          <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
            <TabButton
              text="회원가입"
              tabIndex={tabIndex}
              onClick={() => setTabIndex(1)}
            />
          </li>
          <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
            <TabButton
              text="로그인"
              tabIndex={tabIndex}
              onClick={() => setTabIndex(2)} />
          </li>
        </ul>
        <div className="relative flex flex-col min-w-0 break-words bg-white w-full rounded">
          <div className="flex-auto">
            <div className="tab-content tab-space">
              {
                tabIndex === 1
                  ? <Signup handleCancelModal={handleCancelModal} />
                  : <Login handleCancelModal={handleCancelModal} />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

AuthTab.propTypes = {
  tabIndex: PropTypes.number,
  setTabIndex: PropTypes.func,
  handleCancelModal: PropTypes.func,
};

export default AuthTab;
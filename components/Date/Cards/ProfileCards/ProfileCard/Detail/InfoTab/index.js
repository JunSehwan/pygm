import React from 'react';
import BasicInfo from './BasicInfo';
import CareerInfo from './CareerInfo';
import ThinkInfo from './ThinkInfo';
import { useSelector } from 'react-redux';
// import InfoMatching from './ThinkInfo/InfoMatching';
import { FaUserEdit } from "react-icons/fa";
import { useRouter } from "next/router";

const index = () => {

  const { user, loading } = useSelector(state => state.user);
  const writeThinkInfo = user?.mbti_ei && user?.hobby && user?.drink && user?.health && user?.interest && user?.career_goal && user?.living_weekend && user?.living_consume && user?.opfriend && user?.friendmeeting && user?.longdistance && user?.religion_important && user?.religion_visit && user?.religion_accept && user?.food_diet;

  const router = useRouter();

  const goToProfile = () => {
    router.push("/date/profile");
  };

  return (
    <div className="w-full my-2">
      {/* <InfoMatching /> */}
      <BasicInfo />
      <CareerInfo />
      {writeThinkInfo ?
        <ThinkInfo /> : 
        <div className="w-full mb-4 flex flex-col items-center">
          <div className="p-5 rounded-xl w-full bg-gradient-to-r from-violet-100/60 via-pink-100/60 to-rose-100/60 shadow-md border border-solid border-slate-200 flex flex-col items-center">

            {/* 제목 */}
            <h2 className="w-full pt-2 text-lg font-semibold text-blue-900 text-center">
              좀 더 다양한 이성의 가치관과 성향을 알고 싶다면?
            </h2>

            {/* 설명문 */}
            <div className="text-sm text-gray-700 text-center mt-3 leading-relaxed">
              본인의 <span className="font-semibold text-blue-700">부가정보 입력</span>을 완료하시면<br />
              더 정확하고 풍부한 이성 매칭이 가능합니다 💕
            </div>

            {/* 구분선 */}
            <div className="w-[70%] border-t border-gray-200 my-4"></div>

            {/* 아이콘 + 버튼 */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <FaUserEdit className="w-6 h-6 text-pink-600" />
                <span className="text-gray-800 font-medium">프로필 정보 업데이트</span>
              </div>

              <button
                onClick={goToProfile}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600
            text-white font-semibold py-2.5 px-6 rounded-full shadow-md transition-all duration-200
            hover:shadow-lg active:scale-95"
              >
                프로필 입력하기
              </button>
            </div>
          </div>
        </div>
        }
    </div>
  );
};

export default index;
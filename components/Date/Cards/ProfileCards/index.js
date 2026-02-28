import React, { useEffect } from "react";
import ProfileCard from './ProfileCard';
import { nanoid } from 'nanoid'
import { useDispatch, useSelector } from "react-redux";
import InfoModal from './InfoModal';
import Empty from 'components/Common/Empty';
import LoadingPage from "components/Common/Loading";

const index = () => {

  const { friends, loading, friendsLoading, getCardsReady } = useSelector((state) => state.user);

  return (
    <>
      {(loading || friendsLoading || !getCardsReady) ? (
        <LoadingPage />
      ) : Array.isArray(friends) && friends.length > 0 ? (
        <div className="w-full mx-auto scroll-smooth">
            {friends.map((friend) => (
              <section
                className="scroll-smooth flex justify-center w-full mx-auto mb-8"
                key={nanoid()}
              >
                <ProfileCard friend={friend} id={friend?.userID} />
              </section>
            ))}
        </div>
      ) : (
        <Empty
          title="잠시만요!"
          text="조만간 좋은 인연을 소개해드릴 예정입니다."
          subtext="즐거운 만남을 위해 조금만 기다려주세요."
        />
      )}

    </>
  );
};

export default index;
import React from "react";
import FemaleHome from "./FemaleHome";
import MaleHome from "./MaleHome";

export default function ArenaHome(props) {
  const {
    user,
    isLoggedIn,
    isFemale,
    isBlockedUser,
    loading,
    offerCards = [],
    maleInterestCards = [],
    authChecked,
    isReceivePaused,
    pauseSaving,
    onToggleReceivePause,
  } = props;

  if (isFemale || !isLoggedIn) {
    return (
      <FemaleHome
        user={user}
        isLoggedIn={isLoggedIn}
        isFemale={isFemale}
        isBlockedUser={isBlockedUser}
        loading={loading}
        offerCards={offerCards}
        authChecked={authChecked}
        isReceivePaused={isReceivePaused}
        pauseSaving={pauseSaving}
        onToggleReceivePause={onToggleReceivePause}
      />
    );
  }

  return (
    <MaleHome
      user={user}
      isLoggedIn={isLoggedIn}
      isBlockedUser={isBlockedUser}
      loading={loading}
      interestCards={maleInterestCards}
      isReceivePaused={isReceivePaused}
      pauseSaving={pauseSaving}
      onToggleReceivePause={onToggleReceivePause}
    />
  );
}
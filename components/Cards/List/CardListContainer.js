import React from "react";
import GuestCardListView from "./GuestCardListView";
import MaleCardListView from "./MaleCardListView";
import FemaleCardListView from "./FemaleCardListView";

export default function CardListContainer({
  user,
  cards,
  answeredCardIds,
  showPendingForDev = false,
  femaleReviewItems = [],
  femaleReactionByAnswerId = {},
  femaleReportedAnswererUids = [],
}) {
  const isLoggedIn = !!user?.userID;
  const gender = user?.gender || "";

  const isMale =
    gender === "male" ||
    gender === "남성" ||
    gender === "man" ||
    gender === "M";

  const pageMode = !isLoggedIn ? "guest" : isMale ? "male" : "female";

  if (pageMode === "guest") {
    return <GuestCardListView cards={cards} />;
  }

  if (pageMode === "male") {
    return (
      <MaleCardListView
        cards={cards}
        answeredCardIds={answeredCardIds}
        showPendingForDev={showPendingForDev}
      />
    );
  }

  return (
    <FemaleCardListView
      ownerUid={user?.userID || ""}
      items={femaleReviewItems}
      reactionByAnswerId={femaleReactionByAnswerId}
      reportedAnswererUids={femaleReportedAnswererUids}
    />
  );
}
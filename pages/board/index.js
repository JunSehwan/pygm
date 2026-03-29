import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import RequireAuth from "components/Common/RequireAuth";
import BoardHome from "components/Board";
import { db } from "firebaseConfig";
import {
  getDisplayName,
  getJobLabel,
  getProfileImage,
  getResidenceLabel,
} from "lib/arena";

const DAY_MS = 24 * 60 * 60 * 1000;
const INTEREST_EXPIRE_MS = 3 * DAY_MS;
const CONTACT_EXPIRE_MS = 7 * DAY_MS;

function toDate(value) {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch (error) {
      return null;
    }
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCreatedTime(item = {}) {
  return (
    toDate(item?.contactSharedAt)?.getTime() ||
    toDate(item?.acceptedAt)?.getTime() ||
    toDate(item?.createdAt)?.getTime() ||
    0
  );
}

function sortByLatest(a, b) {
  return getCreatedTime(b) - getCreatedTime(a);
}

function getAgeLabel(user = {}) {
  const year = Number(user?.birthday?.year || 0);
  if (!year) return "";
  const currentYear = new Date().getFullYear();
  const age = currentYear - year + 1;
  return age > 0 ? `${age}세` : "";
}

function getMbtiLabel(user = {}) {
  const ei = String(user?.mbti_ei || "").trim();
  const sn = String(user?.mbti_sn || "").trim();
  const tf = String(user?.mbti_tf || "").trim();
  const jp = String(user?.mbti_jp || "").trim();
  const mbti = `${ei}${sn}${tf}${jp}`.toUpperCase();
  return mbti.length === 4 ? mbti : "";
}

function normalizeInterestList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .flatMap((item) =>
        String(item || "")
          .split("|")
          .flatMap((part) => part.split("/"))
          .flatMap((part) => part.split(","))
      )
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(value)
    .split("|")
    .flatMap((part) => part.split("/"))
    .flatMap((part) => part.split(","))
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

function getInterestLabel(user = {}) {
  if (user?.interest && String(user.interest).trim()) {
    return String(user.interest).trim();
  }

  if (user?.hobby && String(user.hobby).trim()) {
    return String(user.hobby).trim();
  }

  if (Array.isArray(user?.hobbyList)) {
    const values = normalizeInterestList(user.hobbyList);
    if (values.length) return values.slice(0, 2).join(", ");
  }

  return "";
}

function buildMetaLine1(user = {}) {
  const job = getJobLabel(user);
  const residence = getResidenceLabel(user);
  return [job, residence].filter(Boolean).join(" | ");
}

function buildMetaLine2(user = {}) {
  const mbti = getMbtiLabel(user);
  const interest = getInterestLabel(user);
  return [mbti, interest].filter(Boolean).join(" | ");
}

function isFemaleUser(user = {}) {
  const gender = String(user?.gender || "").toLowerCase();
  return gender === "female" || gender === "f" || user?.gender === "여성";
}

function isMaleUser(user = {}) {
  const gender = String(user?.gender || "").toLowerCase();
  return gender === "male" || gender === "m" || user?.gender === "남성";
}

function isInterestAlive(item = {}) {
  const createdAt = toDate(item?.createdAt);
  if (!createdAt) return false;
  return Date.now() - createdAt.getTime() < INTEREST_EXPIRE_MS;
}

function getContactStatus(match = {}, currentUserId = "") {
  const openedAt =
    toDate(match?.contactSharedAt) ||
    toDate(match?.acceptedAt) ||
    toDate(match?.createdAt);

  if (!openedAt) {
    return {
      visible: false,
      phone: "",
      dDayLabel: "",
      expiresAt: null,
    };
  }

  const expiresAt = new Date(openedAt.getTime() + CONTACT_EXPIRE_MS);
  const remainingMs = expiresAt.getTime() - Date.now();
  const visible = remainingMs > 0;

  const dDay = Math.max(0, Math.ceil(remainingMs / DAY_MS));
  const dDayLabel = visible ? `D-${dDay}` : "만료";

  const phone =
    String(currentUserId) === String(match?.maleUid || "")
      ? String(match?.femalePhone || "").trim()
      : String(match?.malePhone || "").trim();

  return {
    visible,
    phone,
    dDayLabel,
    expiresAt,
  };
}

function mapUserSnap(userSnap) {
  if (!userSnap?.exists()) return null;
  return {
    userID: userSnap.id,
    ...userSnap.data(),
  };
}

function buildBoardCardItem({
  id,
  sectionType,
  otherUser,
  rawData,
  extra = {},
}) {
  return {
    id,
    sectionType,
    rawData,
    otherUser,
    image: getProfileImage(otherUser || {}),
    name: getDisplayName(otherUser || {}),
    ageLabel: getAgeLabel(otherUser || {}),
    metaLine1: buildMetaLine1(otherUser || {}),
    metaLine2: buildMetaLine2(otherUser || {}),
    ...extra,
  };
}

export default function BoardPage() {
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState(reduxUser || null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [matchedItems, setMatchedItems] = useState([]);
  const [sentItems, setSentItems] = useState([]);
  const [receivedItems, setReceivedItems] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser?.uid) {
          setCurrentUser(reduxUser || null);
          setAuthReady(true);
          return;
        }

        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userSnap.exists()) {
          setCurrentUser({
            userID: userSnap.id,
            ...userSnap.data(),
          });
        } else {
          setCurrentUser({
            userID: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
          });
        }
      } catch (error) {
        console.error("[board/index] auth hydrate error:", error);
        setCurrentUser(reduxUser || null);
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [reduxUser]);

  useEffect(() => {
    let mountedFlag = true;

    async function loadBoardData() {
      try {
        if (!authReady) return;

        const myUid = currentUser?.userID || currentUser?.uid || "";
        if (!myUid) {
          if (!mountedFlag) return;
          setMatchedItems([]);
          setSentItems([]);
          setReceivedItems([]);
          setLoading(false);
          return;
        }

        setLoading(true);

        const [
          maleMatchesSnap,
          femaleMatchesSnap,
          sentInterestsSnap,
          receivedInterestsSnap,
        ] = await Promise.all([
          getDocs(query(collection(db, "arenaMatches"), where("maleUid", "==", myUid))),
          getDocs(query(collection(db, "arenaMatches"), where("femaleUid", "==", myUid))),
          getDocs(
            query(
              collection(db, "arenaInterests"),
              where("femaleUid", "==", myUid),
              where("status", "==", "sent")
            )
          ),
          getDocs(
            query(
              collection(db, "arenaInterests"),
              where("maleUid", "==", myUid),
              where("status", "==", "sent")
            )
          ),
        ]);

        const matchDocs = [
          ...maleMatchesSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
          ...femaleMatchesSnap.docs.map((item) => ({ id: item.id, ...item.data() })),
        ].sort(sortByLatest);

        const sentDocs = sentInterestsSnap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter(isInterestAlive)
          .sort(sortByLatest);

        const receivedDocs = receivedInterestsSnap.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter(isInterestAlive)
          .sort(sortByLatest);

        const otherUserIds = Array.from(
          new Set(
            [
              ...matchDocs.map((item) =>
                String(item?.maleUid || "") === String(myUid)
                  ? item?.femaleUid
                  : item?.maleUid
              ),
              ...sentDocs.map((item) => item?.maleUid),
              ...receivedDocs.map((item) => item?.femaleUid),
            ].filter(Boolean)
          )
        );

        const userEntries = await Promise.all(
          otherUserIds.map(async (uid) => {
            const userSnap = await getDoc(doc(db, "users", uid));
            const userData = mapUserSnap(userSnap);
            return userData ? [uid, userData] : null;
          })
        );

        const userMap = {};
        userEntries.forEach((entry) => {
          if (!entry) return;
          userMap[entry[0]] = entry[1];
        });

        const nextMatchedItems = matchDocs
          .map((match) => {
            const otherUid =
              String(match?.maleUid || "") === String(myUid)
                ? match?.femaleUid
                : match?.maleUid;

            const otherUser = userMap[otherUid];
            if (!otherUser) return null;

            const contactStatus = getContactStatus(match, myUid);

            return buildBoardCardItem({
              id: `matched_${match.id}`,
              sectionType: "matched",
              otherUser,
              rawData: match,
              extra: {
                contactStatus,
              },
            });
          })
          .filter(Boolean);

        const nextSentItems = sentDocs
          .map((interest) => {
            const otherUser = userMap[interest?.maleUid];
            if (!otherUser) return null;

            return buildBoardCardItem({
              id: `sent_${interest.id}`,
              sectionType: "sent",
              otherUser,
              rawData: interest,
            });
          })
          .filter(Boolean);

        const nextReceivedItems = receivedDocs
          .map((interest) => {
            const otherUser = userMap[interest?.femaleUid];
            if (!otherUser) return null;

            return buildBoardCardItem({
              id: `received_${interest.id}`,
              sectionType: "received",
              otherUser,
              rawData: interest,
            });
          })
          .filter(Boolean);

        if (!mountedFlag) return;

        setMatchedItems(nextMatchedItems);
        setSentItems(nextSentItems);
        setReceivedItems(nextReceivedItems);
      } catch (error) {
        console.error("[board/index] loadBoardData error:", error);
        if (!mountedFlag) return;
        setMatchedItems([]);
        setSentItems([]);
        setReceivedItems([]);
      } finally {
        if (mountedFlag) {
          setLoading(false);
        }
      }
    }

    loadBoardData();

    return () => {
      mountedFlag = false;
    };
  }, [authReady, currentUser]);

  const sectionVisibility = useMemo(() => {
    const female = isFemaleUser(currentUser || {});
    const male = isMaleUser(currentUser || {});

    return {
      showMatched: true,
      showSent: female || sentItems.length > 0,
      showReceived: male || receivedItems.length > 0,
    };
  }, [currentUser, sentItems.length, receivedItems.length]);

  if (!mounted) {
    return (
      <>
        <Head>
          <title>매칭보드 | 차밍수프</title>
        </Head>

        <main className="min-h-screen bg-white md:bg-[#f6f7fb]">
          <div className="relative mx-auto flex min-h-screen w-full max-w-[1200px] items-start justify-center px-0 py-0 md:items-center md:px-6 md:py-10">
            <section className="relative flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden bg-slate-50 md:h-[760px] md:max-w-[430px] md:rounded-[18px] md:border md:border-slate-200/80 md:shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
              <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
                <div className="text-[26px] font-extrabold tracking-[-0.03em] text-zinc-900">
                  매칭 보드
                </div>
              </header>

              <div className="min-h-0 flex-1 bg-slate-50" />
            </section>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>매칭보드 | 차밍수프</title>
      </Head>

      <BoardHome
        user={currentUser}
        loading={loading}
        matchedItems={matchedItems}
        sentItems={sentItems}
        receivedItems={receivedItems}
        sectionVisibility={sectionVisibility}
      />

      <RequireAuth redirect="/board" />
    </>
  );
}
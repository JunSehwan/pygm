import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import ArenaHome from "components/Arena";
import { db } from "firebaseConfig";
import {
  ensureArenaOffers,
  getArenaOfferCardsByFemaleUid,
  isArenaBlockedUser,
} from "lib/arena";
import { isBlockedTargetUser } from "lib/userBlockRules";

export default function ArenaPage() {
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [currentUser, setCurrentUser] = useState(reduxUser || null);
  const [authUid, setAuthUid] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  const [offerCards, setOfferCards] = useState([]);
  const [maleInterestCards, setMaleInterestCards] = useState([]);
  const [arenaLoading, setArenaLoading] = useState(true);
  const [pauseSaving, setPauseSaving] = useState(false);

  const pauseSavingRef = useRef(false);

  useEffect(() => {
    pauseSavingRef.current = pauseSaving;
  }, [pauseSaving]);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser?.uid) {
        setAuthUid("");
        setCurrentUser(reduxUser || null);
        setAuthChecked(true);
        return;
      }

      setAuthUid(firebaseUser.uid);
      setAuthChecked(true);
    });

    return () => unsub();
  }, [reduxUser]);

  useEffect(() => {
    if (!authChecked) return;
    if (!authUid) return;

    const userRef = doc(db, "users", authUid);

    const unsubUser = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          const nextUser = {
            userID: snap.id,
            ...snap.data(),
          };

          setCurrentUser((prev) => {
            if (!prev) return nextUser;

            if (pauseSavingRef.current) {
              return {
                ...nextUser,
                arenaReceivePaused:
                  typeof prev?.arenaReceivePaused === "boolean"
                    ? prev.arenaReceivePaused
                    : nextUser.arenaReceivePaused,
              };
            }

            return nextUser;
          });
        } else {
          setCurrentUser({
            userID: authUid,
            uid: authUid,
            email: reduxUser?.email || "",
          });
        }
      },
      (error) => {
        console.error("[arena/index] user snapshot error:", error);
      }
    );

    return () => unsubUser();
  }, [authChecked, authUid, reduxUser]);

  const isLoggedIn = !!currentUser?.userID;

  const gender = useMemo(() => {
    return String(currentUser?.gender || "").toLowerCase();
  }, [currentUser?.gender]);

  const isFemale = useMemo(() => {
    return (
      gender === "female" ||
      gender === "f" ||
      currentUser?.gender === "여성"
    );
  }, [gender, currentUser?.gender]);

  const isBlockedUser = useMemo(() => {
    return isArenaBlockedUser(currentUser || {});
  }, [currentUser]);

  const isReceivePaused = !!currentUser?.arenaReceivePaused;

  const loadMaleInterestCards = useCallback(async (viewerUser, uid) => {
    try {
      if (!uid) {
        setMaleInterestCards([]);
        return;
      }

      const q = query(
        collection(db, "arenaInterests"),
        where("maleUid", "==", uid),
        where("status", "==", "sent"),
        orderBy("createdAt", "asc")
      );

      const snap = await getDocs(q);

      const rawCards = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const femaleIds = [
        ...new Set(rawCards.map((item) => item.femaleUid).filter(Boolean)),
      ];

      const femaleMap = {};

      await Promise.all(
        femaleIds.map(async (femaleUid) => {
          const userSnap = await getDoc(doc(db, "users", femaleUid));
          if (userSnap.exists()) {
            femaleMap[femaleUid] = {
              userID: userSnap.id,
              ...userSnap.data(),
            };
          }
        })
      );

      const merged = rawCards
        .map((item) => {
          const femaleUser = femaleMap[item.femaleUid];
          if (!femaleUser) return null;

          if (isBlockedTargetUser(viewerUser || {}, femaleUser)) {
            return null;
          }

          return {
            ...item,
            femaleUser,
          };
        })
        .filter(Boolean);

      setMaleInterestCards(merged);
    } catch (error) {
      console.error("[arena/index] loadMaleInterestCards error:", error);
      setMaleInterestCards([]);
    }
  }, []);

  const refreshArenaData = useCallback(
    async ({ silent = false, overrideUser = null } = {}) => {
      const baseUser = overrideUser || currentUser || {};
      const uid = baseUser?.userID || baseUser?.uid || "";

      try {
        if (!silent) {
          setArenaLoading(true);
        }

        if (!authChecked) return;

        if (!uid || !isLoggedIn || isArenaBlockedUser(baseUser)) {
          setOfferCards([]);
          setMaleInterestCards([]);
          return;
        }

        const normalizedGender = String(baseUser?.gender || "").toLowerCase();
        const femaleMode =
          normalizedGender === "female" ||
          normalizedGender === "f" ||
          baseUser?.gender === "여성";

        if (femaleMode) {
          const result = baseUser?.arenaReceivePaused
            ? await getArenaOfferCardsByFemaleUid(uid)
            : await ensureArenaOffers(baseUser);

          const nextOfferCards = Array.isArray(result?.offerCards)
            ? result.offerCards.filter((item) => {
              const maleUser = item?.male || null;
              if (!maleUser) return false;
              return !isBlockedTargetUser(baseUser, maleUser);
            })
            : [];

          setOfferCards(nextOfferCards);
          setMaleInterestCards([]);
          return;
        }

        await loadMaleInterestCards(baseUser, uid);
        setOfferCards([]);
      } catch (error) {
        console.error("[arena/index] refreshArenaData error:", error);

        if (!silent) {
          setOfferCards([]);
          setMaleInterestCards([]);
        }
      } finally {
        if (!silent) {
          setArenaLoading(false);
        }
      }
    },
    [authChecked, currentUser, isLoggedIn, loadMaleInterestCards]
  );

  useEffect(() => {
    if (!authChecked) return;
    if (pauseSavingRef.current) return;

    refreshArenaData({ silent: false });
  }, [
    authChecked,
    authUid,
    isLoggedIn,
    isFemale,
    isBlockedUser,
    refreshArenaData,
  ]);

  const handleToggleReceivePause = useCallback(async () => {
    if (!currentUser?.userID || pauseSavingRef.current) return;

    const nextPaused = !currentUser?.arenaReceivePaused;

    const optimisticUser = {
      ...currentUser,
      arenaReceivePaused: nextPaused,
      arenaReceivePausedUpdatedAt: new Date(),
    };

    try {
      setPauseSaving(true);
      setCurrentUser(optimisticUser);

      await setDoc(
        doc(db, "users", currentUser.userID),
        {
          arenaReceivePaused: nextPaused,
          arenaReceivePausedUpdatedAt: new Date(),
        },
        { merge: true }
      );

      if (isFemale && !nextPaused) {
        await refreshArenaData({
          silent: true,
          overrideUser: optimisticUser,
        });
      }
    } catch (error) {
      console.error("[arena/index] toggle receive pause error:", error);

      setCurrentUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          arenaReceivePaused: !nextPaused,
        };
      });
    } finally {
      setPauseSaving(false);
    }
  }, [currentUser, isFemale, refreshArenaData]);

  return (
    <>
      <Head>
        <title>매칭아레나 | 차밍수프</title>
      </Head>

      <ArenaHome
        user={currentUser}
        isLoggedIn={isLoggedIn}
        isFemale={isFemale}
        isBlockedUser={isBlockedUser}
        loading={arenaLoading}
        offerCards={offerCards}
        maleInterestCards={maleInterestCards}
        authChecked={authChecked}
        isReceivePaused={isReceivePaused}
        pauseSaving={pauseSaving}
        onToggleReceivePause={handleToggleReceivePause}
      />
    </>
  );
}
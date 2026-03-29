import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import AuthRequiredModal from "components/Common/AuthRequiredModal";
import ArenaDetailScreen from "components/Arena/Detail";
import { db } from "firebaseConfig";
import { getArenaBadgeInfo, getUserDocId, getValueMatchPercent } from "lib/arena";
import { isBlockedTargetUser } from "lib/userBlockRules";

export default function ArenaDetailPage() {
  const router = useRouter();
  const { uid } = router.query;
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [viewer, setViewer] = useState(reduxUser || null);
  const [targetUser, setTargetUser] = useState(null);
  const [badgeInfo, setBadgeInfo] = useState({});
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser?.uid) {
          setViewer(reduxUser || null);
          setViewerReady(true);
          return;
        }

        const viewerSnap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (viewerSnap.exists()) {
          setViewer({
            userID: viewerSnap.id,
            ...viewerSnap.data(),
          });
        } else {
          setViewer({
            userID: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email || "",
          });
        }
      } catch (error) {
        console.error("[arena/detail] viewer auth hydrate error:", error);
        setViewer(reduxUser || null);
      } finally {
        setViewerReady(true);
      }
    });

    return () => unsub();
  }, [reduxUser]);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      try {
        if (!uid) return;
        setLoading(true);

        const targetSnap = await getDoc(doc(db, "users", String(uid)));
        if (!targetSnap.exists()) {
          if (mounted) setTargetUser(null);
          return;
        }

        const userData = {
          userID: targetSnap.id,
          ...targetSnap.data(),
        };

        if (viewerReady && viewer?.userID && isBlockedTargetUser(viewer, userData)) {
          if (mounted) {
            setTargetUser(null);
            router.replace("/arena");
          }
          return;
        }

        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map((docSnap) => ({
          userID: docSnap.id,
          ...docSnap.data(),
        }));

        if (!mounted) return;

        setTargetUser(userData);
        setBadgeInfo(getArenaBadgeInfo(userData, allUsers));
      } catch (error) {
        console.error("[arena/detail] load error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [uid, viewerReady, viewer, router]);

  useEffect(() => {
    let mounted = true;

    async function loadOffer() {
      try {
        const viewerUid =
          viewer?.userID ||
          reduxUser?.userID ||
          getAuth()?.currentUser?.uid ||
          "";

        if (!viewerUid) {
          if (mounted) setOffer(null);
          return;
        }

        const offerSnap = await getDoc(doc(db, "arenaOffers", viewerUid));
        if (!mounted) return;

        if (!offerSnap.exists()) {
          setOffer(null);
          return;
        }

        const offerData = offerSnap.data() || {};
        if (String(offerData?.maleUid || "") !== String(uid || "")) {
          setOffer(null);
          return;
        }

        setOffer({
          id: offerSnap.id,
          ...offerData,
        });
      } catch (error) {
        console.error("[arena/detail] offer load error:", error);
        if (mounted) setOffer(null);
      }
    }

    if (viewerReady) {
      loadOffer();
    }

    return () => {
      mounted = false;
    };
  }, [viewerReady, viewer?.userID, reduxUser?.userID, uid]);

  const isLoggedIn = !!getUserDocId(viewer || {});
  const pageLoading = loading || !viewerReady;


  useEffect(() => {
    if (!viewerReady) return;
    if (!uid) return;
    if (!viewer || !targetUser) return;

    if (isBlockedTargetUser(viewer, targetUser)) {
      router.replace("/arena");
    }
  }, [viewerReady, viewer, targetUser, uid, router]);

  const valueMatchPercent = useMemo(() => {
    if (!viewer || !targetUser) return 85;
    return getValueMatchPercent(viewer, targetUser);
  }, [viewer, targetUser]);

  return (
    <>
      <Head>
        <title>
          {targetUser?.nickname || targetUser?.username
            ? `${targetUser.nickname || targetUser.username} | 매칭아레나`
            : "매칭아레나 | 차밍수프"}
        </title>
      </Head>

      <ArenaDetailScreen
        viewer={viewer}
        targetUser={targetUser}
        badgeInfo={badgeInfo}
        offer={offer}
        loading={pageLoading}
        isLoggedIn={isLoggedIn}
        valueMatchPercent={valueMatchPercent}
        onRequireAuth={() => setAuthOpen(true)}
      />

      <AuthRequiredModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        redirect={`/arena/${uid || ""}`}
        title="로그인이 필요해요"
        description="상세 프로필 확인과 호감 보내기는 로그인 후 이용할 수 있어요."
      />
    </>
  );
}
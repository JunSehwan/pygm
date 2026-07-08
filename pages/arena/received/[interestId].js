import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import MaleDetailScreen from "components/Arena/MaleDetail";
import { db } from "firebaseConfig";
import { isAdminMatchExposureBlocked } from "lib/arena";

import { isBlockedTargetUser } from "lib/userBlockRules";

export default function ArenaReceivedDetailPage() {
  const router = useRouter();
  const { interestId } = router.query;
  const reduxUser = useSelector((state) => state.user?.user || null);

  const [viewer, setViewer] = useState(reduxUser || null);
  const [targetUser, setTargetUser] = useState(null);
  const [interest, setInterest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser?.uid) {
          router.replace("/login");
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
        console.error("[arena/received/detail] viewer auth error:", error);
      } finally {
        setViewerReady(true);
      }
    });

    return () => unsub();
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      try {
        if (!interestId || !viewerReady || !viewer?.userID) return;

        setLoading(true);
        setBlockedReason("");

        const interestRef = doc(db, "arenaInterests", String(interestId));
        const interestSnap = await getDoc(interestRef);

        if (!interestSnap.exists()) {
          if (!mounted) return;
          router.replace("/arena");
          return;
        }

        const interestData = {
          id: interestSnap.id,
          ...interestSnap.data(),
        };

        const currentMaleUid = String(interestData?.maleUid || "");
        const currentViewerUid = String(viewer?.userID || "");
        const status = String(interestData?.status || "");

        // 1) 현재 로그인한 남자 본인 카드인지 확인
        if (!currentMaleUid || currentMaleUid !== currentViewerUid) {
          if (!mounted) return;
          setBlockedReason("not-owner");
          router.replace("/arena");
          return;
        }

        // 2) 응답 가능한 sent 상태만 상세 열람 허용
        if (status !== "sent") {
          if (!mounted) return;
          setBlockedReason(status || "closed");
          router.replace("/arena");
          return;
        }

        const femaleUid = interestData?.femaleUid || "";
        if (!femaleUid) {
          if (!mounted) return;
          router.replace("/arena");
          return;
        }

        const femaleSnap = await getDoc(doc(db, "users", femaleUid));

        if (!mounted) return;

        if (!femaleSnap.exists()) {
          router.replace("/arena");
          return;
        }

        const nextTargetUser = {
          userID: femaleSnap.id,
          ...femaleSnap.data(),
        };

        if (isAdminMatchExposureBlocked(nextTargetUser)) {
          router.replace("/arena");
          return;
        }

        if (isBlockedTargetUser(viewer, nextTargetUser)) {
          router.replace("/arena");
          return;
        }

        setInterest(interestData);
        setTargetUser(nextTargetUser);

      } catch (error) {
        console.error("[arena/received/detail] load error:", error);
        if (mounted) {
          router.replace("/arena");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [interestId, viewerReady, viewer, router]);

  return (
    <>
      <Head>
        <title>
          {targetUser?.nickname || targetUser?.username
            ? `${targetUser.nickname || targetUser.username} | 받은 호감`
            : "받은 호감 | 차밍수프"}
        </title>
      </Head>

      <MaleDetailScreen
        viewer={viewer}
        targetUser={targetUser}
        interest={interest}
        loading={loading || !viewerReady}
        blockedReason={blockedReason}
        onDone={async () => { }}
      />
    </>
  );
}
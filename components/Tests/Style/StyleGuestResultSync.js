import { useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "firebaseConfig";

const SESSION_KEY = "styleTestGuestResult";

export default function StyleGuestResultSync() {
  const isSyncingRef = useRef(false);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user?.uid) return;
      if (isSyncingRef.current) return;

      try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        if (!parsed?.typeCode) return;

        isSyncingRef.current = true;

        await setDoc(
          doc(db, "users", user.uid),
          {
            styleTest: {
              typeCode: parsed.typeCode || "",
              typeTitle: parsed.typeTitle || "",
              typeTitleEn: parsed.typeTitleEn || "",
              oneLine: parsed.oneLine || "",
              axisLetters: parsed.axisLetters || {},
              balanceBadges: parsed.balanceBadges || [],
              axisScores: parsed.axisScores || {},
              questionOrder: parsed.questionOrder || [],
              answers: parsed.answers || [],
              completedAt: serverTimestamp(),
              savedFromGuest: true,
            },
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        sessionStorage.removeItem(SESSION_KEY);
        console.log("[StyleGuestResultSync] guest style result synced");
      } catch (error) {
        console.error("[StyleGuestResultSync] sync error:", error);
      } finally {
        isSyncingRef.current = false;
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
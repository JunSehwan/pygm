import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import LoginRequiredGateModal from "components/Common/LoginRequiredGateModal";

export default function RequireAuth({ children }) {
  const reduxUser = useSelector((state) => state.user?.user ?? null);

  const [mounted, setMounted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUid(firebaseUser?.uid || "");
      setAuthReady(true);
    });

    return () => unsub();
  }, []);

  const isLoggedIn = useMemo(() => {
    const reduxUid = reduxUser?.userID || reduxUser?.uid || "";
    return !!(reduxUid || firebaseUid);
  }, [reduxUser, firebaseUid]);

  if (!mounted || !authReady) return null;

  return (
    <>
      <div
        className={
          isLoggedIn
            ? "transition"
            : "pointer-events-none select-none blur-[7px] opacity-35 transition"
        }
        aria-hidden={!isLoggedIn}
      >
        {children}
      </div>

      {!isLoggedIn ? <LoginRequiredGateModal open /> : null}
    </>
  );
}
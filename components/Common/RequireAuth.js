import React, { useEffect, useMemo, useState } from "react";
import { auth } from "firebaseConfig";
import AuthRequiredModal from "./AuthRequiredModal";

export default function RequireAuth({
  redirect = "/",
  children = null,
  fallback = null,
}) {
  const [mounted, setMounted] = useState(false);
  const [checked, setChecked] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [open, setOpen] = useState(false);

  const hasChildren = useMemo(() => React.Children.count(children) > 0, [children]);

  useEffect(() => {
    setMounted(true);

    const unsubscribe = auth?.onAuthStateChanged?.((user) => {
      setFirebaseUser(user || null);
      setChecked(true);

      if (!user) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  if (!mounted || !checked) {
    return fallback;
  }

  if (firebaseUser) {
    return hasChildren ? <>{children}</> : null;
  }

  return (
    <>
      {hasChildren ? fallback : null}
      <AuthRequiredModal
        open={open}
        onClose={() => setOpen(false)}
        redirect={redirect}
      />
    </>
  );
}
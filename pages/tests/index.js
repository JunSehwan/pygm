import { useEffect } from "react";
import { useRouter } from "next/router";

export default function TestsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tests/style");
  }, [router]);

  return null;
}
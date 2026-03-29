import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CardsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/cards/list");
  }, [router]);

  return null;
}
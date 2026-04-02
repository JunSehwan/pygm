import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import SEOHead from "components/Common/SEOHead";
import PublicTeaserPage from "components/Cards/PublicTeaser/PublicTeaserPage";
import { db } from "firebaseConfig";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://charmingsoup.com";

function buildMeta(card = {}, slug = "") {
  const title =
    card?.seoTitle ||
    card?.title ||
    "차밍카드";

  const description =
    card?.seoDescription ||
    card?.guide ||
    card?.body ||
    "차밍수프 공개 차밍카드 페이지";

  const keywords =
    typeof card?.seoKeywords === "string"
      ? card.seoKeywords
      : Array.isArray(card?.seoKeywords)
        ? card.seoKeywords.join(", ")
        : "";

  return {
    title,
    description,
    keywords,
    canonical: `${SITE_URL}/topic/${slug}`,
  };
}

export default function PublicTopicPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [card, setCard] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadTopic() {
      if (!slug || typeof slug !== "string") return;

      try {
        setLoading(true);

        const cardSnap = await getDocs(
          query(
            collection(db, "charmingCards"),
            where("seoSlug", "==", slug),
            where("isPublicTeaser", "==", true),
            limit(1)
          )
        );

        if (cardSnap.empty) {
          if (!mounted) return;
          setFound(false);
          setCard(null);
          setAnswers([]);
          return;
        }

        const cardDoc = cardSnap.docs[0];
        const cardData = {
          id: cardDoc.id,
          ...cardDoc.data(),
        };

        const answersSnap = await getDocs(
          query(
            collection(db, "charmingCardAnswers"),
            where("cardId", "==", cardDoc.id),
            orderBy("createdAt", "desc"),
            limit(8)
          )
        );

        const nextAnswers = answersSnap.docs
          .map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }))
          .filter((item) => item && (item.answerText || item.selectedOptionText));

        if (!mounted) return;
        setFound(true);
        setCard(cardData);
        setAnswers(nextAnswers);
      } catch (error) {
        console.error("[topic/[slug]] loadTopic error:", error);

        if (!mounted) return;
        setFound(false);
        setCard(null);
        setAnswers([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTopic();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const meta = useMemo(() => buildMeta(card || {}, typeof slug === "string" ? slug : ""), [card, slug]);

  return (
    <>
      {found && card ? (
        <SEOHead
          title={meta.title}
          description={meta.description}
          keywords={meta.keywords}
          canonical={meta.canonical}
        />
      ) : (
        <Head>
          <title>공개 차밍카드 | 차밍수프</title>
          <meta
            name="description"
            content="차밍수프 공개 차밍카드 페이지"
          />
          <meta
            name="robots"
            content={loading ? "index, follow" : "noindex, nofollow"}
          />
        </Head>
      )}

      <PublicTeaserPage
        slug={typeof slug === "string" ? slug : ""}
        loading={loading}
        found={found}
        card={card}
        answers={answers}
      />
    </>
  );
}
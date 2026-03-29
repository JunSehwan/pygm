import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "firebaseConfig";
import styleQuestions from "data/tests/styleQuestions";

import StyleTestIntro from "./StyleTestIntro";
import StyleTestSurvey from "./StyleTestSurvey";
import StyleTestAnalyzing from "./StyleTestAnalyzing";
import StyleTestResult from "./StyleTestResult";
import {
  calculateAxisScores,
  buildFinalType,
  getAxisSummary,
  getCompatibility,
  getAllTypes,
} from "./StyleTestUtils";
import {
  copyText,
  createStyleResultShareImage,
  downloadFile,
  openSmsShare,
  shareWithSystem,
} from "./StyleShareUtils";
import {
  shareResultToKakao,
  shareToFacebook,
} from "./StyleSdkShare";

function shuffleQuestions(arr) {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

export default function StyleTestFlow() {
  const router = useRouter();

  const [screen, setScreen] = useState("start");
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [activeExploreCode, setActiveExploreCode] = useState("DSLR");
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u || null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const firstQuestions = shuffleQuestions(styleQuestions);
    setShuffledQuestions(firstQuestions);
    setAnswers(Array(firstQuestions.length).fill(null));
  }, []);

  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const statsRef = doc(db, "publicStats", "styleTest");
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
          setTotalAttempts(snap.data()?.totalAttempts || 0);
        }
      } catch (error) {
        console.error("[StyleTestFlow] load attempts error:", error);
      }
    };

    loadAttempts();
  }, []);

  const totalQuestions = shuffledQuestions.length || styleQuestions.length;
  const isLoggedIn = !!firebaseUser?.uid;

  const axisScores = useMemo(() => {
    if (!shuffledQuestions.length) return null;
    return calculateAxisScores(answers, shuffledQuestions);
  }, [answers, shuffledQuestions]);

  const finalType = useMemo(() => {
    if (!axisScores) return null;
    return buildFinalType(axisScores);
  }, [axisScores]);

  const axisSummary = useMemo(() => {
    if (!finalType || !axisScores) return [];
    return getAxisSummary(finalType, axisScores);
  }, [finalType, axisScores]);

  const compatibleTypes = useMemo(() => {
    if (!finalType?.code) return [];
    return getCompatibility(finalType.code);
  }, [finalType]);

  const allTypes = useMemo(() => getAllTypes(), []);

  useEffect(() => {
    if (finalType?.code) {
      setActiveExploreCode(finalType.code);
    }
  }, [finalType]);

  const saveResultToFirestore = async (typePayload, nextAxisScores, nextAnswers) => {
    if (!firebaseUser?.uid) return;

    try {
      await setDoc(
        doc(db, "users", firebaseUser.uid),
        {
          styleTest: {
            typeCode: typePayload.code,
            typeTitle: typePayload.meta?.ko || "",
            typeTitleEn: typePayload.meta?.en || "",
            oneLine: typePayload.meta?.oneLine || "",
            axisLetters: typePayload.axisLetters || {},
            balanceBadges: typePayload.balanceBadges || [],
            axisScores: nextAxisScores,
            questionOrder: shuffledQuestions.map((item) => item.id),
            answers: nextAnswers,
            completedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("[StyleTestFlow] save result error:", error);
    }
  };

  const saveGuestResultToSession = (typePayload, nextAxisScores, nextAnswers) => {
    try {
      sessionStorage.setItem(
        "styleTestGuestResult",
        JSON.stringify({
          typeCode: typePayload.code,
          typeTitle: typePayload.meta?.ko || "",
          typeTitleEn: typePayload.meta?.en || "",
          oneLine: typePayload.meta?.oneLine || "",
          axisLetters: typePayload.axisLetters || {},
          balanceBadges: typePayload.balanceBadges || [],
          axisScores: nextAxisScores,
          questionOrder: shuffledQuestions.map((item) => item.id),
          answers: nextAnswers,
          savedAt: Date.now(),
        })
      );
    } catch (error) {
      console.error("[StyleTestFlow] session save error:", error);
    }
  };

  const increaseTotalAttempts = async () => {
    try {
      await setDoc(
        doc(db, "publicStats", "styleTest"),
        {
          totalAttempts: increment(1),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setTotalAttempts((prev) => prev + 1);
    } catch (error) {
      console.error("[StyleTestFlow] increase attempts error:", error);
    }
  };

  const handleStart = () => {
    if (!shuffledQuestions.length) {
      const nextQuestions = shuffleQuestions(styleQuestions);
      setShuffledQuestions(nextQuestions);
      setAnswers(Array(nextQuestions.length).fill(null));
    }
    setScreen("survey");
  };

  const handleAnswer = async (questionIndex, value) => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = value;
    setAnswers(nextAnswers);

    const isAllAnswered =
      nextAnswers.length > 0 && nextAnswers.every((item) => item !== null);

    if (!isAllAnswered) return;

    const nextAxisScores = calculateAxisScores(nextAnswers, shuffledQuestions);
    const nextFinalType = buildFinalType(nextAxisScores);

    setScreen("analyzing");

    await increaseTotalAttempts();

    if (firebaseUser?.uid) {
      await saveResultToFirestore(nextFinalType, nextAxisScores, nextAnswers);
    } else {
      saveGuestResultToSession(nextFinalType, nextAxisScores, nextAnswers);
    }

    setTimeout(() => {
      setScreen("result");
    }, 1600);
  };

  const handleBackFromSurvey = () => {
    setScreen("start");
  };

  const handleRestart = () => {
    const nextQuestions = shuffleQuestions(styleQuestions);
    setShuffledQuestions(nextQuestions);
    setAnswers(Array(nextQuestions.length).fill(null));
    setActiveExploreCode("DSLR");
    setScreen("start");
  };

  const handleComplete = () => {
    if (!isLoggedIn) {
      if (finalType && axisScores) {
        saveGuestResultToSession(finalType, axisScores, answers);
      }
      router.push("/signup");
      return;
    }

    router.push("/arena/pending");
  };

  const handleIntroShare = async () => {
    const pageUrl = `${window.location.origin}/tests/style`;
    const text = `내 연애스타일을 알아보는 테스트!\n너도 바로 참여해봐 👇\n${pageUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "연애스타일 진단테스트",
          text,
          url: pageUrl,
        });
        return;
      }

      await copyText(text);
      alert("테스트 링크가 복사되었어요.");
    } catch (error) {
      console.error("[StyleTestFlow] intro share error:", error);
    }
  };

  const handleResultShare = async (channel = "system") => {
    if (!finalType || !axisSummary?.length) return;

    const pageUrl = `${window.location.origin}/tests/style/result/${finalType.meta.code}`;
    const shareUrl = `${window.location.origin}/tests/style/result/${finalType.meta.code}`;
    const shareText = `내 연애스타일 결과는 ${finalType.meta.ko} (${finalType.meta.code})!\n${finalType.meta.oneLine}\n\n나도 테스트해보기 👇\n${pageUrl}`;

    try {
      const { file } = await createStyleResultShareImage({
        finalType,
        axisSummary,
        brandName: "차밍수프",
      });

      if (channel === "kakao") {
        const kakaoShareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/tests/style/result/${finalType.meta.code}`;

        shareResultToKakao({
          title: `내 연애스타일 결과: ${finalType.meta.ko}`,
          description: `${String(finalType.meta.oneLine).replace(/\n/g, " ")}\n버튼을 눌러 바로 테스트해보세요`,
          imageUrl: `${process.env.NEXT_PUBLIC_SITE_URL}${finalType.meta.image}`,
          shareUrl: kakaoShareUrl,
        });
        return;
      }

      if (channel === "facebook") {
        shareToFacebook({ shareUrl });
        return;
      }

      if (channel === "sms") {
        openSmsShare({
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (channel === "instagram") {
        downloadFile(file);
        const copied = await copyText(shareText);
        if (copied) {
          alert(
            "결과 이미지가 저장되었고 문구가 복사되었어요. 인스타그램에 이미지 업로드 후 붙여넣어보세요."
          );
        } else {
          alert("결과 이미지가 저장되었어요. 인스타그램에 업로드해보세요.");
        }
        return;
      }

      const shared = await shareWithSystem({
        title: "내 연애스타일 분석결과",
        text: shareText,
        url: pageUrl,
        file,
      });

      if (!shared.ok) {
        downloadFile(file);
        await copyText(shareText);
        alert("결과 이미지가 다운로드되었고 문구가 복사되었어요.");
      }
    } catch (error) {
      console.error("[StyleTestFlow] result share error:", error);
    }
  };

  const handleSignupFromIntro = () => {
    router.push("/signup");
  };

  const handleSignupFromResult = () => {
    if (finalType && axisScores) {
      saveGuestResultToSession(finalType, axisScores, answers);
    }
    router.push("/signup");
  };

  if (!shuffledQuestions.length || !finalType) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-white">
        <div className="text-[15px] font-semibold text-slate-500">
          불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        {screen === "start" ? (
          <motion.div
            key="start"
            className="h-full min-h-0 overflow-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <StyleTestIntro
              totalQuestions={totalQuestions}
              onStart={handleStart}
              onBack={() => router.back()}
              onShare={handleIntroShare}
              onSignup={handleSignupFromIntro}
              isLoggedIn={isLoggedIn}
              totalAttempts={totalAttempts}
            />
          </motion.div>
        ) : null}

        {screen === "survey" ? (
          <motion.div
            key="survey"
            className="h-full min-h-0 overflow-hidden"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <StyleTestSurvey
              questions={shuffledQuestions}
              answers={answers}
              onAnswer={handleAnswer}
              onBack={handleBackFromSurvey}
            />
          </motion.div>
        ) : null}

        {screen === "analyzing" ? (
          <motion.div
            key="analyzing"
            className="h-full min-h-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <StyleTestAnalyzing />
          </motion.div>
        ) : null}

        {screen === "result" ? (
          <motion.div
            key="result"
            className="h-full min-h-0 overflow-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <StyleTestResult
              finalType={finalType}
              axisSummary={axisSummary}
              compatibleTypes={compatibleTypes}
              allTypes={allTypes}
              activeExploreCode={activeExploreCode}
              setActiveExploreCode={setActiveExploreCode}
              onRestart={handleRestart}
              onComplete={handleComplete}
              onShare={handleResultShare}
              onSignup={handleSignupFromResult}
              isLoggedIn={isLoggedIn}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
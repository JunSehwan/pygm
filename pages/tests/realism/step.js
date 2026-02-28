// /pages/tests/realism.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import {
  ALL_QUESTIONS,
  SELF_QUESTIONS,
  IDEAL_QUESTIONS,
  GENDERS,
  getOptionLabels,
  isDisabledOption,
  getChoiceScore,
  getSelfMax,
  getIdealMax,
} from "../../../data/tests/realismQuestions";
import { useRouter } from "next/router";

const STORAGE_KEY = "pygm_tests_realism_step_ui_v2";
const DUMMY_IMAGE_SRC = "/image/tests/dummy.png";

// diff = selfScore - idealScore
function stageFromDiff(diff) {
  if (diff <= -51) return "😎 현실파악불가형 (눈높이 초과)";
  if (diff <= -31) return "😂 로맨틱 과대평가형 (현실감 부족)";
  if (diff <= -16) return "🤔 현실점검 필요형";
  if (diff <= 0) return "💬 현실형";
  if (diff <= 15) return "❤️ 자기객관형";
  return "🧘 겸손형";
}
//pct = (selfScore / selfMax) * 100 내 점수가 최대점 대비 몇인지
function gradeFromSelfPct(pct) {
  if (pct >= 85) return "A";
  if (pct >= 75) return "B";
  if (pct >= 65) return "C";
  if (pct >= 55) return "D";
  if (pct >= 45) return "E";
  return "F";
}

function defaultAnswers() {
  const obj = {};
  for (const q of ALL_QUESTIONS) obj[q.id] = null;
  return obj;
}

export default function RealismStepPage() {
  const router = useRouter();

  const SELF_COUNT = SELF_QUESTIONS.length;
  const INTERLUDE_STEP = SELF_COUNT; // 이 스텝에서 설명 화면 보여줌


  const [answers, setAnswers] = useState(() => defaultAnswers());
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const cardRef = useRef(null);

  // 성별은 S1 답으로 결정 (S1: 0=남자, 1=여자)
  const userGender = useMemo(() => {
    const a = answers["S1"];
    if (a === 0) return GENDERS.male;
    if (a === 1) return GENDERS.female;
    return null;
  }, [answers]);

  // 성별 선택 전에는 S1만 풀게 (step 강제)
  useEffect(() => {
    if (!userGender) {
      setShowResult(false);
      setStep(0);
    }
  }, [userGender]);

  // 저장/복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.answers) setAnswers({ ...defaultAnswers(), ...parsed.answers });
      if (typeof parsed?.step === "number") setStep(parsed.step);
      if (typeof parsed?.showResult === "boolean") setShowResult(parsed.showResult);
    } catch { }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, step, showResult, updatedAt: Date.now() })
      );
    } catch { }
  }, [answers, step, showResult]);

  const [analyzing, setAnalyzing] = useState(false);
  const goResultWithLoading = (nextAnswers) => {
    setAnalyzing(true);

    // UX용 최소 대기 (너무 짧으면 티 안 남)
    setTimeout(() => {
      goResult(nextAnswers); // 기존 결과 페이지 이동 로직
    }, 1100);
  };

  const totalSteps = ALL_QUESTIONS.length + 1;
  const currentQ =
    step === INTERLUDE_STEP
      ? null
      : step < INTERLUDE_STEP
        ? ALL_QUESTIONS[step]
        : ALL_QUESTIONS[step - 1];


  const answeredCount = useMemo(() => {
    return ALL_QUESTIONS.filter((q) => answers[q.id] !== null).length;
  }, [answers]);

  const progressPct = useMemo(() => {
    return Math.round((answeredCount / totalSteps) * 100);
  }, [answeredCount, totalSteps]);

  const selfMax = useMemo(() => (userGender ? getSelfMax(userGender) : 310), [userGender]);
  const idealMax = useMemo(() => (userGender ? getIdealMax(userGender) : 310), [userGender]);

  const selfScore = useMemo(() => {
    if (!userGender) return 0;
    let sum = 0;
    for (const q of SELF_QUESTIONS) {
      const a = answers[q.id];
      if (a === null) continue;
      sum += getChoiceScore(q, userGender, a);
    }
    return sum;
  }, [answers, userGender]);

  const idealScore = useMemo(() => {
    if (!userGender) return 0;
    let sum = 0;
    for (const q of IDEAL_QUESTIONS) {
      const a = answers[q.id];
      if (a === null) continue;
      sum += getChoiceScore(q, userGender, a);
    }
    return sum;
  }, [answers, userGender]);

  const diff = useMemo(() => selfScore - idealScore, [selfScore, idealScore]);
  const stageLabel = useMemo(() => stageFromDiff(diff), [diff]);

  const selfPct = useMemo(() => (selfMax ? (selfScore / selfMax) * 100 : 0), [selfScore, selfMax]);
  const marriageGrade = useMemo(() => gradeFromSelfPct(selfPct), [selfPct]);

  const topConcerns = useMemo(() => {
    if (!userGender) return [];
    return IDEAL_QUESTIONS.map((q) => {
      const a = answers[q.id];
      if (a === null) return null;
      return { title: q.title, w: getChoiceScore(q, userGender, a) };
    })
      .filter(Boolean)
      .sort((a, b) => b.w - a.w)
      .slice(0, 3);
  }, [answers, userGender]);

  const advice = useMemo(() => {
    if (!userGender) return [];
    const arr = [];
    if (diff < -31) arr.push("기준을 ‘필수 2개 + 있으면 좋은 3개’로 줄이면 체감 난이도가 확 내려가.");
    if (diff < -16) arr.push("내 점수에서 낮은 2개 항목만 2주 개선해도 단계가 바뀐다.");
    if (diff > 0) arr.push("기준이 유연한 편이라 유리. 대신 절대 싫은 것 2가지는 명확히 정해.");
    arr.push("2주 뒤 재테스트하면 변화 비교로 공유 포인트가 생김.");
    return arr;
  }, [userGender, diff]);

  const bumpCard = () => {
    const el = cardRef.current;
    if (!el) return;
    el.animate(
      [
        { opacity: 0.5, transform: "translateX(10px)" },
        { opacity: 1, transform: "translateX(0px)" },
      ],
      { duration: 180, easing: "ease-out" }
    );
  };

  const goStep = (next) => {
    const n = Math.max(0, Math.min(totalSteps - 1, next));
    setStep(n);
    setTimeout(bumpCard, 0);
  };

  const goPrev = () => {
    if (step <= 0) return;
    goStep(step - 1);
  };

  // ✅ “선택하면 바로 다음” + “마지막 선택하면 즉시 결과”
  const pick = (idx) => {
    if (!currentQ) return;
    if (!userGender && currentQ.id !== "S1") return;

    const nextAnswers = { ...answers, [currentQ.id]: idx };
    setAnswers(nextAnswers);

    // 1) 성별 선택이면 다음 문항으로
    if (currentQ.id === "S1") {
      setTimeout(() => goStep(1), 140);
      return;
    }

    // 2) SELF 마지막 질문이면 interlude로
    if (step === SELF_COUNT - 1) {
      setTimeout(() => goStep(INTERLUDE_STEP), 140);
      return;
    }

    // 3) interlude에서 "계속하기" 눌러 넘어간 다음,
    //    마지막 실제 질문(ALL_QUESTIONS 끝)까지 완료하면 결과
    //    -> totalSteps는 ALL_QUESTIONS+1(인터루드)니까,
    //       마지막 스텝은 totalSteps-1 이 맞음
    if (step >= totalSteps - 2) {
      setTimeout(() => goResultWithLoading(nextAnswers), 140);
      return;
    }

    // 4) ✅ 일반 케이스: 다음 문항으로
    setTimeout(() => goStep(step + 1), 140);
  };

  const goResult = (nextAnswers) => {
    // 점수 계산 (현재 파일에 있는 getChoiceScore / getSelfMax / getIdealMax 그대로 사용)
    const gender =
      nextAnswers["S1"] === 0 ? GENDERS.male :
        nextAnswers["S1"] === 1 ? GENDERS.female :
          null;

    if (!gender) return;

    let self = 0;
    for (const q of SELF_QUESTIONS) {
      const a = nextAnswers[q.id];
      if (a === null) continue;
      self += getChoiceScore(q, gender, a);
    }

    let ideal = 0;
    for (const q of IDEAL_QUESTIONS) {
      const a = nextAnswers[q.id];
      if (a === null) continue;
      ideal += getChoiceScore(q, gender, a);
    }

    const selfMaxV = getSelfMax(gender);
    const idealMaxV = getIdealMax(gender);
    const diff = self - ideal;

    // TOP3
    const top = IDEAL_QUESTIONS.map((q) => {
      const a = nextAnswers[q.id];
      if (a === null) return null;
      return { title: q.title, w: getChoiceScore(q, gender, a) };
    })
      .filter(Boolean)
      .sort((a, b) => b.w - a.w)
      .slice(0, 3)
      .map((x) => x.title);

    // 쿼리로 넘김 (짧게)
    router.push({
      pathname: "/tests/realism/result",
      query: {
        g: gender,               // "male" | "female"
        s: String(self),
        sm: String(selfMaxV),
        i: String(ideal),
        im: String(idealMaxV),
        d: String(diff),
        grade: "",               // result.js에서 계산해도 됨
        top: top.join("|"),
      },
    });
  };


  const reset = () => {
    setAnswers(defaultAnswers());
    setStep(0);
    setShowResult(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { }
  };

  const share = async () => {
    const text = `현실파악 테스트 결과
- 내 점수: ${selfScore}/${selfMax}
- 내 기준: ${idealScore}/${idealMax}
- 갭(내점수-기준): ${diff}
- 결혼등급: ${marriageGrade}
- 주제파악: ${stageLabel}
- 중시항목: ${topConcerns.map((x) => x.title).join(", ") || "—"}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "현실파악 테스트", text, url: location.href });
        return;
      }
    } catch { }

    try {
      await navigator.clipboard.writeText(`${text}\n\n${location.href}`);
      alert("결과 + 링크 복사 완료!");
    } catch {
      alert("공유 불가 환경이야. 수동 복사해줘!");
    }
  };

  // ✅ 라벨: 점수/번호/카테고리 표시 전부 제거
  // ✅ 성별 문항 같은 “2개짜리”는 '-' 옵션을 숨겨서 자동으로 2개만 보여줌
  const labels = useMemo(() => {
    if (!currentQ) return [];
    const genderForLabels = userGender || GENDERS.male;
    const all = getOptionLabels(currentQ, genderForLabels);

    // '-' 또는 빈 옵션은 숨김(성별 문항은 자연스럽게 2개만 남음)
    return all.filter((t) => !isDisabledOption(t));
  }, [currentQ, userGender]);

  const checkedIndex = currentQ ? answers[currentQ.id] : null;

  // 결과 자동 진입 조건(안전망)
  useEffect(() => {
    if (!showResult) return;
    // noop
  }, [showResult]);

  return (
    <>
      {analyzing && (
        <div style={styles.loadingOverlay}>
          <div style={styles.spinner} />
          <div style={styles.loadingText}>현실과 기준을 비교 중입니다…</div>
        </div>
      )}

      <Head>
        <title>현실파악/주제파악 테스트</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        {/* Top Header (스샷 느낌) */}
        <div style={styles.topHeader}>
          <button
            onClick={() => (showResult ? setShowResult(false) : goPrev())}
            style={styles.backBtn}
            aria-label="back"
          >
            ‹
          </button>

          <div style={styles.topTitle}>피그말리온 방구석연구소</div>

          <button onClick={reset} style={styles.resetBtn}>
            초기화
          </button>
        </div>

        <div style={styles.pinkLine} />

        <div style={styles.container}>
          {/* sub header */}
          <div style={styles.subHeader}>
            <div style={styles.testTitle}>현실파악 테스트</div>
            <div style={styles.stepText}>
              {Math.min(step + 1, totalSteps)} / {totalSteps}
            </div>
          </div>

          {/* progress */}
          <div style={styles.progressWrap}>
            <div style={{ ...styles.progressBar, width: `${progressPct}%` }} />
          </div>

          {/* MAIN */}
          {!showResult ? (
            step === INTERLUDE_STEP ? (
              <div style={styles.card}>
                <div style={{ textAlign: "center", padding: "20px 10px" }}>
                  <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 12 }}>
                    이제부터는
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 950, color: "#ff2b86", marginBottom: 16 }}>
                    원하는 이성상에 대한 질문입니다
                  </div>

                  <div style={styles.imageWrap}>
                    <img
                      src={currentQ?.image || DUMMY_IMAGE_SRC}
                      alt="question visual"
                      style={styles.image}
                      onError={(e) => {
                        e.currentTarget.src = DUMMY_IMAGE_SRC;
                      }}
                    />
                  </div>

                  <p style={{ fontSize: 16, lineHeight: 1.6, color: "#333", marginBottom: 24 }}>
                    지금부터는<br />
                    <strong>“내가 어떤 사람을 원하고 있는지”</strong>를 묻습니다.<br />
                    <br />
                    솔직하게 선택할수록<br />
                    <strong>현실과 기준의 차이</strong>를 정확히 알 수 있어요.
                  </p>

                  <button
                    style={styles.primaryBtn}
                    onClick={() => goStep(step + 1)}
                  >
                    계속하기
                  </button>
                </div>
              </div>
            ) : (
              <div ref={cardRef} style={styles.card}>
                {/* image */}
                <div style={styles.imageWrap}>
                  <img
                    src={currentQ?.image || DUMMY_IMAGE_SRC}
                    alt="question visual"
                    style={styles.image}
                    onError={(e) => {
                      e.currentTarget.src = DUMMY_IMAGE_SRC;
                    }}
                  />
                </div>

                {/* question */}
                <div style={styles.questionText}>{currentQ?.title}</div>

                {/* choices */}
                <div style={styles.choices}>
                  {labels.map((label, idx) => {
                    // labels를 filter했으니 idx가 원래 1~5 index와 어긋날 수 있음
                    // -> 그래서 “원래 options 배열에서의 실제 index”를 다시 찾음
                    const genderForLabels = userGender || GENDERS.male;
                    const raw = getOptionLabels(currentQ, genderForLabels);
                    const realIndex = raw.findIndex((x) => x === label);

                    const isSelected = checkedIndex === realIndex;

                    return (
                      <button
                        key={`${currentQ.id}_${idx}`}
                        onClick={() => pick(realIndex)}
                        style={{
                          ...styles.choiceBtn,
                          ...(isSelected ? styles.choiceBtnSelected : {}),
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div style={styles.card}>
              <div style={styles.resultTitle}>결과</div>

              <div style={styles.resultGrid}>
                <MiniStat label="내 점수" value={`${selfScore}/${selfMax || 310}`} />
                <MiniStat label="내 기준" value={`${idealScore}/${idealMax || 310}`} />
                <MiniStat label="갭(내점수-기준)" value={`${diff}`} />
                <MiniStat label="결혼등급" value={`${marriageGrade}`} />
                <MiniStat label="주제파악 단계" value={stageLabel} />
                <MiniStat
                  label="중시항목 TOP3"
                  value={topConcerns.map((x) => x.title).join(", ") || "—"}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={styles.sectionLabel}>개선 조언</div>
                <ul style={styles.adviceList}>
                  {advice.map((t, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{t}</li>
                  ))}
                </ul>
              </div>

              <div style={styles.resultActions}>
                <button style={styles.primaryBtn} onClick={share}>
                  저장/공유
                </button>
                <button style={styles.ghostBtn} onClick={() => alert("반박하기: 다음 버전에 문항별 상세 결과를 붙이면 바이럴이 강해짐")}>
                  반박하기
                </button>
                <button style={styles.ghostBtn} onClick={() => alert("소개팅 제안: 결과 저장 → 러브랩/피그말리온 퍼널 연결")}>
                  소개팅 제안
                </button>
              </div>
            </div>
          )}

          <div style={styles.footer}>© pygm.co.kr · tests/realism</div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#FFFFFF" },

  // header
  topHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "#FFFFFF",
    height: 56,
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    border: "none",
    background: "transparent",
    fontSize: 26,
    cursor: "pointer",
    color: "#111",
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
    fontWeight: 900,
    fontSize: 18,
    color: "#111",
  },
  resetBtn: {
    border: "1px solid #eee",
    background: "#fff",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
    color: "#444",
  },
  pinkLine: { height: 3, background: "#ff2b86" },

  container: { maxWidth: 520, margin: "0 auto", padding: "10px 14px 40px" },

  subHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  testTitle: { color: "#ff2b86", fontWeight: 950, fontSize: 22 },
  stepText: { color: "#222", fontWeight: 900 },

  progressWrap: {
    height: 3,
    background: "#eee",
    borderRadius: 999,
    overflow: "hidden",
    marginTop: 10,
  },
  progressBar: { height: "100%", background: "#ff2b86", transition: "width 180ms ease" },

  card: {
    marginTop: 18,
    borderRadius: 16,
    border: "1px solid #f0f0f0",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
    padding: 16,
    background: "#fff",
  },

  imageWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "10px 0 6px",
  },
  image: { width: 380, height: 380, objectFit: "contain" },

  questionText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 1.55,
    fontWeight: 900,
    color: "#462679",
    whiteSpace: "pre-wrap",
  },

  choices: { marginTop: 24, display: "grid", gap: 12 },

  // ✅ 선택지 글씨 크게 + 클릭 시 색상 변화
  choiceBtn: {
    width: "100%",
    padding: "18px 14px",
    borderRadius: 14,

    // ✅ 여기: border 축약만 사용
    border: "1px solid #e9e9e9",
    background: "#fff",

    cursor: "pointer",
    fontSize: 16,
    fontWeight: 600,
    color: "#111",
    lineHeight: 1.35,
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
    transition: "transform 0.06s ease, border 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
  },

  choiceBtnSelected: {
    // ✅ 여기: borderColor 쓰지 말고 border 자체를 바꿈
    border: "1px solid #ff2b86",
    background: "rgba(255,43,134,0.07)",
    boxShadow: "0 0 0 4px rgba(255,43,134,0.10)",
  },

  // result
  resultTitle: { fontSize: 20, fontWeight: 950, color: "#111" },
  resultGrid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  statBox: { background: "#fafafa", border: "1px solid #eee", borderRadius: 12, padding: 12 },
  statLabel: { fontSize: 12, color: "#666", fontWeight: 800, marginBottom: 6 },
  statValue: { fontSize: 14, color: "#111", fontWeight: 950, lineHeight: 1.35 },

  sectionLabel: { fontWeight: 950, marginBottom: 8, color: "#111" },
  adviceList: { margin: 0, paddingLeft: 18, color: "#111", lineHeight: 1.6 },

  resultActions: { marginTop: 14, display: "grid", gap: 10 },
  primaryBtn: {
    padding: "14px 12px",
    borderRadius: 14,
    border: "none",
    background: "#ff2b86",
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "14px 12px",
    borderRadius: 14,
    border: "1px solid #eee",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
  },

  footer: { marginTop: 18, textAlign: "center", color: "#aaa", fontSize: 12 },

  loadingOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(255,255,255,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  spinner: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    borderWidth: 4,
    borderStyle: "solid",
    borderColor: "#eee",
    borderTopColor: "#ff2b86",
    animation: "spin 0.9s linear infinite",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: 900,
    color: "#111",
  },

};

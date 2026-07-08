// /pages/tests/realism/result.js
import React, { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

const HERO_IMG = "/images/tests/dummy.png"; // 너가 원하는 픽셀/일러스트로 교체

function stageFromDiff(diff) {
  if (diff <= -51) return "😎 주제파악불가형 (눈높이 초과)";
  if (diff <= -31) return "😂 로맨틱 과대평가형 (현실감 부족)";
  if (diff <= -16) return "🤔 현실점검 필요형";
  if (diff <= 0) return "💬 현실 감각형";
  if (diff <= 15) return "❤️ 자기객관형";
  return "🧘 기준겸손형";
}

function gradeFromSelfPct(pct) {
  if (pct >= 85) return "A";
  if (pct >= 75) return "B";
  if (pct >= 65) return "C";
  if (pct >= 55) return "D";
  if (pct >= 45) return "E";
  return "F";
}

export default function ResultPage() {
  const router = useRouter();

  const data = useMemo(() => {
    const q = router.query;

    const self = Number(q.s || 0);
    const selfMax = Number(q.sm || 310);
    const ideal = Number(q.i || 0);
    const idealMax = Number(q.im || 310);
    const diff = Number(q.d || 0);

    const stage = stageFromDiff(diff);
    const grade = gradeFromSelfPct(selfMax ? (self / selfMax) * 100 : 0);

    const top = String(q.top || "")
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);

    const oneLine =
      diff <= -31
        ? "기준이 꽤 높아요. ‘필수’부터 줄이면 매칭 성공 확률이 확 올라갑니다."
        : diff <= -16
          ? "기준과 현실의 간격이 있어요. 작은 개선만 해도 단계가 바뀔 수 있어요."
          : diff <= 0
            ? "기준과 현실이 비교적 균형입니다. 지금도 충분히 승산 있어요."
            : "기준이 유연한 편이라 유리합니다. 대신 절대 싫은 것은 명확히 해두세요.";

    const advice = [];
    if (diff < -31) advice.push("필수 조건 2개만 남기고, 나머지는 ‘있으면 좋은 조건’으로 내려보세요.");
    if (diff < -16) advice.push("내 점수에서 약한 항목 2개만 2주 개선하면 결과가 바뀝니다.");
    if (diff > 0) advice.push("조건을 너무 느슨하게만 두지 말고 ‘절대 NO’ 2개를 정해두세요.");
    advice.push("2주 뒤 재테스트해서 변화 비교하면 공유 포인트가 생깁니다.");

    return { self, selfMax, ideal, idealMax, diff, stage, grade, top, oneLine, advice };
  }, [router.query]);

  const share = async () => {
    const text = `현실파악 테스트 결과
- 내 점수: ${data.self}/${data.selfMax}
- 내 기준: ${data.ideal}/${data.idealMax}
- 갭: ${data.diff}
- 결혼등급: ${data.grade}
- 주제파악: ${data.stage}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "현실파악 테스트 결과", text, url: location.href });
        return;
      }
    } catch { }

    try {
      await navigator.clipboard.writeText(`${text}\n\n${location.href}`);
      alert("결과 + 링크 복사 완료!");
    } catch {
      alert("복사 실패. 수동 복사해줘!");
    }
  };

  return (
    <>
      <Head>
        <title>현실파악 테스트 결과</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.page}>
        {/* 히어로 */}
        <div style={styles.hero}>
          <div style={styles.heroInner}>
            <div style={styles.heroImgWrap}>
              <img src={HERO_IMG} alt="hero" style={styles.heroImg} />
            </div>

            <div style={styles.heroType}>{data.stage}</div>
            <div style={styles.heroSub}>당신의 등급: {data.grade}</div>
            <div style={styles.heroOneLine}>{data.oneLine}</div>

            <div style={styles.heroStats}>
              <Stat label="내 점수" value={`${data.self}/${data.selfMax}`} />
              <Stat label="내 기준" value={`${data.ideal}/${data.idealMax}`} />
              <Stat label="갭" value={`${data.diff}`} />
              <Stat label="등급" value={`${data.grade}`} />
            </div>

            <div style={styles.heroBtns}>
              <button style={styles.primaryBtn} onClick={share}>저장/공유</button>
              <button style={styles.ghostBtn} onClick={() => router.push("/tests/realism")}>다시하기</button>
            </div>

            <div style={styles.scrollHint}>아래로 내려서 자세히 보기 ↓</div>
          </div>
        </div>

        {/* 본문 */}
        <div style={styles.body}>
          <section style={styles.card}>
            <div style={styles.h2}>당신의 포지션</div>
            <p style={styles.p}>
              “내 점수(자기평가)”와 “내 기준(이상형)”의 차이를 통해 현재 포지션을 보여줍니다.
            </p>
          </section>

          <section style={styles.card}>
            <div style={styles.h2}>중시 항목 TOP3</div>
            <ul style={styles.ul}>
              {(data.top.length ? data.top : ["—"]).map((t, i) => (
                <li key={i} style={styles.li}>{t}</li>
              ))}
            </ul>
          </section>

          <section style={styles.card}>
            <div style={styles.h2}>개선 조언</div>
            <ul style={styles.ul}>
              {data.advice.map((t, i) => (
                <li key={i} style={styles.li}>{t}</li>
              ))}
            </ul>
          </section>

          <section style={styles.card}>
            <div style={styles.h2}>다음 액션</div>
            <div style={{ display: "grid", gap: 10 }}>
              <button style={styles.primaryBtn} onClick={share}>결과 공유하기</button>
              <button style={styles.ghostBtn} onClick={() => alert("반박하기: 문항별 상세결과로 연결")}>반박하기</button>
              <button style={styles.ghostBtn} onClick={() => alert("소개팅 제안: 러브랩/피그말리온 퍼널 연결")}>소개팅 제안</button>
            </div>
          </section>

          <div style={styles.footer}>© charmingsoup.com · tests/realism/result</div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "#fff" },

  hero: {
    background: "linear-gradient(180deg, rgba(0, 210, 255, 0.12), rgba(255,255,255,1))",
    borderBottom: "1px solid #f2f2f2",
    padding: "16px 0 10px",
  },
  heroInner: { maxWidth: 520, margin: "0 auto", padding: "0 14px", textAlign: "center" },

  heroImgWrap: { display: "flex", justifyContent: "center", padding: "6px 0 10px" },
  heroImg: { width: 260, height: 260, objectFit: "contain" },

  heroType: { fontSize: 22, fontWeight: 950, color: "#111", lineHeight: 1.25 },
  heroSub: { marginTop: 8, fontSize: 14, fontWeight: 900, color: "#555" },
  heroOneLine: { marginTop: 12, fontSize: 15, fontWeight: 800, color: "#111", lineHeight: 1.6 },

  heroStats: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 10,
  },
  stat: {
    background: "#fff",
    border: "1px solid #f0f0f0",
    borderRadius: 16,
    padding: 12,
    boxShadow: "0 10px 24px rgba(0,0,0,0.05)",
  },
  statLabel: { fontSize: 12, color: "#777", fontWeight: 800, marginBottom: 6 },
  statValue: { fontSize: 16, fontWeight: 950, color: "#111" },

  heroBtns: { marginTop: 12, display: "grid", gap: 10 },

  primaryBtn: {
    padding: "14px 12px",
    borderRadius: 16,
    border: "none",
    background: "#00B8D9",
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "14px 12px",
    borderRadius: 16,
    border: "1px solid #eee",
    background: "#fff",
    color: "#111",
    fontWeight: 900,
    fontSize: 15,
    cursor: "pointer",
  },

  scrollHint: { marginTop: 10, fontSize: 12, color: "#888", fontWeight: 800 },

  body: { maxWidth: 520, margin: "0 auto", padding: "14px 14px 40px" },
  card: {
    marginTop: 14,
    borderRadius: 18,
    border: "1px solid #f1f1f1",
    background: "#fff",
    padding: 16,
    boxShadow: "0 10px 26px rgba(0,0,0,0.05)",
  },
  h2: { fontSize: 16, fontWeight: 950, marginBottom: 10, color: "#111" },
  p: { margin: 0, color: "#222", lineHeight: 1.65, fontSize: 14, fontWeight: 700 },
  ul: { margin: 0, paddingLeft: 18, lineHeight: 1.7 },
  li: { marginBottom: 6, fontWeight: 800, color: "#111", fontSize: 14 },

  footer: { marginTop: 18, textAlign: "center", color: "#aaa", fontSize: 12 },
};

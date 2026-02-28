// /components/tests/SharePanel.jsx
import React, { useMemo } from "react";
import toast from "react-hot-toast";
import {
  SiKakaotalk,
  SiInstagram,
  SiFacebook,
  SiX,
} from "react-icons/si";
import { FiLink2, FiShare2 } from "react-icons/fi";

function formatKoreanCount(n) {
  if (typeof n !== "number") return "—";
  // 240000 -> 24만
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  return n.toLocaleString("ko-KR");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("링크 복사 완료!");
  } catch {
    // 구형 브라우저 fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("링크 복사 완료!");
    } catch {
      toast.error("복사 실패! 주소창 링크를 수동 복사해줘.");
    }
  }
}

export default function SharePanel({
  title = "테스트 공유하기",
  shareCount = 240000, // 숫자 넣으면 24만처럼 보임
  url,                // 없으면 현재 URL 사용
}) {
  const shareUrl = useMemo(() => {
    if (url) return url;
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, [url]);

  const shareCountText = useMemo(() => formatKoreanCount(shareCount), [shareCount]);

  const onNativeShare = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "현실파악 테스트",
          text: "내 연애/결혼 현실감각 점수 확인해보기",
          url: shareUrl,
        });
        return;
      }
      await copyToClipboard(shareUrl);
    } catch {
      // 사용자가 취소한 경우 등
    }
  };

  const onTwitter = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent("현실파악 테스트 해봤어?");
    const u = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${u}`, "_blank");
  };

  const onFacebook = () => {
    if (!shareUrl) return;
    const u = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${u}`, "_blank");
  };

  const onInstagram = async () => {
    // 인스타그램은 웹에서 “바로 공유 링크”가 애매해서 보통 링크복사 유도
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
    toast("인스타 스토리/DM에 붙여넣기!", { icon: "📌" });
  };

  const onKakao = async () => {
    // ✅ 나중에 Kakao SDK 붙이면 여기만 교체하면 됨
    if (!shareUrl) return;
    await copyToClipboard(shareUrl);
    toast("카카오 공유는 추후 SDK 연결로 바로 보내기 가능!", { icon: "💛" });
  };

  return (
    <section className="w-full">
      {/* 공유 헤더 */}
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="text-[22px] font-extrabold tracking-[-0.5px] text-neutral-900">
          {title}
        </div>

        <button
          type="button"
          onClick={onNativeShare}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-extrabold text-neutral-900 hover:bg-neutral-100 active:scale-[0.98]"
        >
          <FiShare2 className="text-[16px]" />
          <span>{shareCountText}</span>
        </button>
      </div>

      {/* 아이콘 버튼들 */}
      <div className="flex items-center justify-center gap-4 pb-8">
        <IconBtn aria="카카오" onClick={onKakao} className="bg-[#FEE500] text-[#191919]">
          <SiKakaotalk />
        </IconBtn>

        <IconBtn aria="인스타" onClick={onInstagram} className="bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] text-white">
          <SiInstagram />
        </IconBtn>

        <IconBtn aria="페이스북" onClick={onFacebook} className="bg-[#1877F2] text-white">
          <SiFacebook />
        </IconBtn>

        {/* <IconBtn aria="X" onClick={onTwitter} className="bg-[#1DA1F2] text-white">
          <SiX />
        </IconBtn> */}

        <IconBtn aria="링크복사" onClick={() => copyToClipboard(shareUrl)} className="bg-neutral-400 text-white">
          <FiLink2 />
        </IconBtn>
      </div>

      {/* 아래 카드(스샷 느낌) */}
      <div className="mx-auto w-full max-w-[720px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-center">
          <div className="inline-block text-[26px] font-extrabold tracking-[-1px] text-neutral-900">
            가장 많은 유형
            <span className="ml-3 inline-block h-[10px] w-[140px] translate-y-[-8px] rounded-sm bg-[#ff2b86]/35 align-middle" />
          </div>
          <div className="mt-2 text-sm font-bold text-neutral-500">
            *통계는 1시간마다 갱신됩니다.
          </div>
        </div>

        {/* 지금은 UI만 (나중에 top type 집계 붙이면 props로 꽂기) */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <RankBox
            rank="1위"
            title="연인만을 위한 치어리더"
            percent="27.60%"
            emoji="🎀"
          />
          <RankBox
            rank="2위"
            title="연인 전용 슬라임"
            percent="16.25%"
            emoji="💗"
          />
        </div>
      </div>
    </section>
  );
}

function IconBtn({ children, onClick, className = "", aria }) {
  return (
    <button
      type="button"
      aria-label={aria}
      onClick={onClick}
      className={`grid h-14 w-14 place-items-center rounded-full text-[22px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition active:scale-[0.97] ${className}`}
    >
      {children}
    </button>
  );
}

function RankBox({ rank, title, percent, emoji }) {
  return (
    <div className="text-center">
      <div className="text-[34px] font-extrabold tracking-[-1px] text-neutral-900">
        {rank}
      </div>
      <div className="mt-2 text-[22px] font-extrabold leading-snug tracking-[-0.7px] text-neutral-900">
        {title}
      </div>
      <div className="mt-2 text-[18px] font-bold text-neutral-500">
        ({percent})
      </div>

      <div className="mt-7 text-[64px]">{emoji}</div>
    </div>
  );
}

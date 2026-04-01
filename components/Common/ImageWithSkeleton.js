import React, { useState } from "react";
import Image from "next/image";
import { PiHeartFill, PiCoffeeDuotone } from "react-icons/pi";

function FloatingHeartsLoader({ variant = "heart" }) {
  const centerIcon =
    variant === "cup" ? (
      <PiCoffeeDuotone className="text-[18px] text-violet-600" />
    ) : (
      <PiHeartFill className="text-[16px] text-violet-600" />
    );

  return (
    <div className="pointer-events-none relative flex h-20 w-20 items-center justify-center">
      <div className="absolute bottom-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-1 ring-violet-100">
        {centerIcon}
      </div>

      <span className="absolute bottom-10 left-[24px] animate-loader-heart-1 text-[10px] text-violet-400">
        ♥
      </span>
      <span className="absolute bottom-9 left-[39px] animate-loader-heart-2 text-[12px] text-violet-500">
        ♥
      </span>
      <span className="absolute bottom-11 left-[52px] animate-loader-heart-3 text-[9px] text-violet-300">
        ♥
      </span>

      <style jsx>{`
        .animate-loader-heart-1 {
          animation: loaderHeart1 1.9s ease-in-out infinite;
        }

        .animate-loader-heart-2 {
          animation: loaderHeart2 2.1s ease-in-out infinite 0.2s;
        }

        .animate-loader-heart-3 {
          animation: loaderHeart3 1.7s ease-in-out infinite 0.4s;
        }

        @keyframes loaderHeart1 {
          0% {
            transform: translateY(0) scale(0.85);
            opacity: 0;
          }
          20% {
            opacity: 0.9;
          }
          60% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-18px) translateX(-4px) scale(1.15);
            opacity: 0;
          }
        }

        @keyframes loaderHeart2 {
          0% {
            transform: translateY(0) scale(0.9);
            opacity: 0;
          }
          18% {
            opacity: 1;
          }
          58% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(-22px) scale(1.18);
            opacity: 0;
          }
        }

        @keyframes loaderHeart3 {
          0% {
            transform: translateY(0) scale(0.82);
            opacity: 0;
          }
          22% {
            opacity: 0.85;
          }
          60% {
            opacity: 0.75;
          }
          100% {
            transform: translateY(-16px) translateX(4px) scale(1.08);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function ImageWithSkeleton({
  src = "",
  alt = "",
  fill = false,
  width,
  height,
  className = "",
  imageClassName = "",
  fallbackSrc = "/image/logo.png",
  objectPosition = "center center",
  sizes = "",
  priority = false,
  unoptimized = true,
  loaderVariant = "cup",
}) {
  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!loaded ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-violet-50/40">
          <FloatingHeartsLoader variant={loaderVariant} />
        </div>
      ) : null}

      <Image
        src={imgSrc || fallbackSrc}
        alt={alt}
        fill={fill}
        width={!fill ? width || 1200 : undefined}
        height={!fill ? height || 1200 : undefined}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className={`transition-all duration-300 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
          } ${imageClassName}`}
        style={{ objectPosition }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
            setLoaded(false);
          } else {
            setLoaded(true);
          }
        }}
      />
    </div>
  );
}
import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

function FloatingOrb({ className = "", delay = 0, duration = 5 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{
        opacity: [0.22, 0.42, 0.22],
        scale: [1, 1.05, 1],
        y: [0, -10, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function LoadingBar() {
  return (
    <div className="relative mt-5 h-[4px] w-[140px] overflow-hidden rounded-full bg-violet-100">
      <motion.div
        className="absolute inset-y-0 left-0 w-[42%] rounded-full bg-violet-500"
        initial={{ x: "-120%" }}
        animate={{ x: ["-120%", "260%"] }}
        transition={{
          duration: 1.25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default function LoadingPage() {

// const [loaded, setLoaded] = useState(false);

  return (
    <motion.section
      className="fixed inset-0 z-[3000] overflow-hidden bg-gradient-to-b from-[#f7f5ff] via-[#fcfbff] to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="absolute inset-0">
        <FloatingOrb
          delay={0}
          duration={6}
          className="absolute left-1/2 top-[16%] h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl"
        />
        <FloatingOrb
          delay={0.6}
          duration={7}
          className="absolute left-[20%] top-[58%] h-[180px] w-[180px] rounded-full bg-fuchsia-100/50 blur-3xl"
        />
        <FloatingOrb
          delay={1}
          duration={6.5}
          className="absolute right-[16%] top-[34%] h-[220px] w-[220px] rounded-full bg-violet-100/60 blur-3xl"
        />
      </div>

      <div className="relative flex h-full w-full items-center justify-center px-6">
        <div className="flex w-full max-w-[420px] flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="relative"
          >
            <motion.div
              className="absolute inset-0 rounded-[32px] bg-violet-200/50 blur-2xl"
              animate={{
                opacity: [0.34, 0.58, 0.34],
                scale: [0.96, 1.04, 0.96],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.div
              animate={{
                y: [0, -6, 0],
                rotate: [0, -1.2, 0.8, 0],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative flex h-[112px] w-[112px] items-center justify-center rounded-[30px] border border-white/70 bg-white/88 shadow-[0_18px_50px_rgba(109,40,217,0.12)] backdrop-blur-md"
            >
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-2xl bg-violet-50 text-[28px] font-black tracking-[-0.08em] text-violet-600">
                <Image 
                  src="/logo/logo.png"
                  alt="차밍수프 랜딩 히어로 이미지"
                  width={60}
                  height={60}
                  priority
                  sizes="60px"
                  // onLoad={() => setLoaded(true)}
                  className="h-auto w-[60px] object-contain"
                />
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="mt-8 text-center"
          >
            <div className="text-[22px] font-extrabold tracking-[-0.04em] text-slate-900">
              차밍수프 - 이동 중
            </div>

            <motion.p
              className="mt-2 break-keep text-[14px] font-medium leading-6 text-slate-500"
              animate={{ opacity: [0.55, 1, 0.55] }}
              transition={{
                duration: 1.9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              결이 잘 맞는 이성찾기! - 차밍수프
            </motion.p>

            <div className="flex justify-center">
              <LoadingBar />
            </div>
          </motion.div>

          <motion.div
            className="mt-8 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-[7px] w-[7px] rounded-full bg-violet-400"
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.35, 1, 0.35],
                  scale: [0.92, 1.08, 0.92],
                }}
                transition={{
                  duration: 0.9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.14,
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
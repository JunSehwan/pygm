import { useMemo } from "react";

export default function MatrixRain() {
  const columns = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: `${(i / 22) * 100}%`,
        duration: 7 + (i % 7),
        delay: (i % 8) * 0.55,
        opacity: 0.18 + (i % 4) * 0.08,
        content:
          i % 3 === 0
            ? "2WEEKS MATCH TRUST BYTE"
            : i % 3 === 1
            ? "01 10 01 10 2WEEKS"
            : "MEET VERIFY MATCH",
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.05),rgba(0,0,0,0.82))]" />

      {columns.map((col) => (
        <div
          key={col.id}
          className="tw-matrix-column absolute top-[-40%] w-[72px] text-[10px] font-medium tracking-[0.35em] text-orange-400/60 md:text-[11px]"
          style={{
            left: col.left,
            opacity: col.opacity,
            animationDuration: `${col.duration}s`,
            animationDelay: `${col.delay}s`,
          }}
        >
          <div className="whitespace-pre-wrap break-all leading-5 [writing-mode:vertical-rl]">
            {col.content.repeat(12)}
          </div>
        </div>
      ))}
    </div>
  );
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const SIZE_CLASS = {
  sm: "h-5 w-5 border-2",
  md: "h-9 w-9 border-4",
  lg: "h-12 w-12 border-4",
};

const TONE_CLASS = {
  dark: "border-zinc-200 border-t-zinc-950",
  light: "border-white/25 border-t-white",
  blue: "border-blue-100 border-t-[#1877f2]",
};

export default function LoadingSpinner({ size = "md", tone = "dark", className = "" }) {
  return (
    <div
      className={cx(
        "animate-spin rounded-full",
        SIZE_CLASS[size] || SIZE_CLASS.md,
        TONE_CLASS[tone] || TONE_CLASS.dark,
        className
      )}
      role="status"
      aria-label="로딩 중"
    />
  );
}

import RegisterHeader from "./RegisterHeader";

export default function RegisterLayout({ children, dark = false }) {
  return (
    <div
      className={
        dark
          ? "min-h-[100dvh] bg-black text-white"
          : "min-h-[100dvh] bg-[#f4f6f8] text-[#102a43]"
      }
    >
      <RegisterHeader />
      <div className="pt-[64px] md:pt-[72px]">{children}</div>
    </div>
  );
}

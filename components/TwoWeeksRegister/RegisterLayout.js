import RegisterHeader from "./RegisterHeader";

export default function RegisterLayout({ children, dark = false }) {
  return (
    <div className={dark ? "min-h-screen bg-black text-white" : "min-h-screen bg-[#f7f8fa] text-slate-950"}>
      <RegisterHeader />
      <div className="pt-[68px] md:pt-[78px]">{children}</div>
    </div>
  );
}

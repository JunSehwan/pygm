export default function MobileFrame({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-[430px] px-5 sm:max-w-[520px] sm:px-6 md:max-w-7xl md:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

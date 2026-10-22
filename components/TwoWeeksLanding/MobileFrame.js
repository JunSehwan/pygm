export default function MobileFrame({ children, className = "" }) {
  return (
    <div
      className={`mx-auto w-full max-w-[480px] px-5 sm:max-w-[600px] sm:px-7 md:max-w-7xl md:px-8 ${className}`}
    >
      {children}
    </div>
  );
}

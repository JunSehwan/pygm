export default function LogoMark({ variant = "dark", className = "", imgClassName = "" }) {
  const src =
    variant === "light"
      ? "/image/twoweeks/logo_mark_light.png"
      : "/image/twoweeks/logo_mark_dark.png";

  return (
    <div className={`overflow-hidden rounded-3xl ${className}`} aria-hidden="true">
      <img
        src={src}
        alt=""
        className={`h-full w-full object-cover ${imgClassName}`}
        draggable={false}
      />
    </div>
  );
}

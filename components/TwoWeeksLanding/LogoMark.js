const LOGO_PATHS = {
  dark: "/logo/2weeks_logo.png",
  light: "/logo/2weeks_logo_white.png",
  white: "/logo/2weeks_logo_white.png",
};

export default function LogoMark({
  variant = "dark",
  className = "",
  imgClassName = "",
  alt = "2WEEKS",
  decorative = true,
}) {
  const src = LOGO_PATHS[variant] || LOGO_PATHS.dark;

  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden={decorative ? "true" : undefined}>
      <img
        src={src}
        alt={decorative ? "" : alt}
        className={`h-full w-full object-contain ${imgClassName}`}
        draggable={false}
      />
    </div>
  );
}

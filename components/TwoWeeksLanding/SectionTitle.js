export default function SectionTitle({ eyebrow, title, desc, light = false }) {
  return (
    <div className="mx-auto max-w-5xl text-center">
      {eyebrow ? (
        <div
          className={`mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] md:text-sm ${
            light ? "text-orange-400" : "text-orange-500"
          }`}
        >
          {eyebrow}
        </div>
      ) : null}

      <h2
        className={`text-[34px] font-black leading-tight tracking-[-0.055em] md:text-5xl ${
          light ? "text-white" : "text-zinc-950"
        }`}
      >
        {title}
      </h2>

      {desc ? (
        <p
          className={`mx-auto mt-4 max-w-2xl whitespace-pre-line text-[14px] leading-7 md:text-base ${
            light ? "text-zinc-300" : "text-zinc-500"
          }`}
        >
          {desc}
        </p>
      ) : null}
    </div>
  );
}

type FlagIconProps = {
  flag?: string | null;
  className?: string;
};

export function FlagIcon({ flag, className = "" }: FlagIconProps) {
  const baseClasses = ["inline-flex shrink-0 items-center justify-center", className]
    .filter(Boolean)
    .join(" ");

  if (flag === "🇧🇮") {
    return (
      <svg
        viewBox="0 0 900 600"
        className={`${baseClasses} overflow-hidden`}
        role="img"
        aria-label="Burundi"
        focusable="false"
      >
        <rect width="900" height="600" fill="#CE1126" />
        <polygon points="0,0 450,300 0,600" fill="#1EB53A" />
        <polygon points="900,0 450,300 900,600" fill="#1EB53A" />
        <path d="M0 0 900 600M900 0 0 600" stroke="#FFFFFF" strokeWidth="94" />
        <circle cx="450" cy="300" r="118" fill="#FFFFFF" />
        <g fill="#CE1126" stroke="#1EB53A" strokeLinejoin="round" strokeWidth="5">
          <path d="M450 206 460 230 486 226 470 247 486 268 460 264 450 288 440 264 414 268 430 247 414 226 440 230Z" />
          <path d="M396 319 406 343 432 339 416 360 432 381 406 377 396 401 386 377 360 381 376 360 360 339 386 343Z" />
          <path d="M504 319 514 343 540 339 524 360 540 381 514 377 504 401 494 377 468 381 484 360 468 339 494 343Z" />
        </g>
      </svg>
    );
  }

  return (
    <span className={baseClasses} aria-hidden="true">
      {flag || "🌍"}
    </span>
  );
}

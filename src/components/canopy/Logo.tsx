type LogoProps = { size?: number; className?: string };

export function CanopyLogo({ size = 32, className }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Canopy"
    >
      <g fill="#0F766E">
        <path d="M96 252C96 163.6 167.6 92 256 92s160 71.6 160 160c-26.5-39.9-84.8-39.9-112 0-18.6-28-77.4-28-96 0-27.2-39.9-85.5-39.9-112 0Z" />
        <circle cx="256" cy="316" r="20" />
        <circle cx="256" cy="365" r="12" />
        <circle cx="256" cy="404" r="8" />
        <circle cx="256" cy="438" r="5" />
      </g>
    </svg>
  );
}

export function CanopyLogoBadge({ boxSize = 48, iconSize = 28 }: { boxSize?: number; iconSize?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-[#111827]"
      style={{ width: boxSize, height: boxSize }}
    >
      <CanopyLogo size={iconSize} />
    </div>
  );
}

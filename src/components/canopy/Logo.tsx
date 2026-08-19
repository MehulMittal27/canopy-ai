import { useEffect, useState } from "react";

type LogoProps = { size?: number; className?: string; color?: string };

export function CanopyLogo({ size = 32, className, color = "#0F766E" }: LogoProps) {
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
      <g fill={color}>
        <path d="M96 252C96 163.6 167.6 92 256 92s160 71.6 160 160c-26.5-39.9-84.8-39.9-112 0-18.6-28-77.4-28-96 0-27.2-39.9-85.5-39.9-112 0Z" />
        <circle cx="256" cy="316" r="20" />
        <circle cx="256" cy="365" r="12" />
        <circle cx="256" cy="404" r="8" />
        <circle cx="256" cy="438" r="5" />
      </g>
    </svg>
  );
}

export function CanopyLogoIntro({ duration = 2600 }: { duration?: number }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisible(false);
      return;
    }

    const exitTimer = window.setTimeout(() => setExiting(true), duration - 600);
    const removeTimer = window.setTimeout(() => setVisible(false), duration);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [duration]);

  if (!visible) return null;

  return (
    <div
      className={`canopy-logo-intro${exiting ? " canopy-logo-intro--exit" : ""}`}
      role="status"
      aria-label="Loading Canopy"
    >
      <div className="canopy-logo-intro__content">
        <div className="canopy-logo-intro__halo" aria-hidden="true" />
        <div className="canopy-logo-intro__umbrella">
          <CanopyLogo size={120} color="#A7F3D0" />
        </div>
      </div>
    </div>
  );
}

export function CanopyLogoBadge({
  boxSize = 48,
  iconSize = 28,
}: {
  boxSize?: number;
  iconSize?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-[#111827]"
      style={{ width: boxSize, height: boxSize }}
    >
      <CanopyLogo size={iconSize} />
    </div>
  );
}

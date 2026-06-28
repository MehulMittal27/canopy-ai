import { useMemo, useState } from "react";
import { FlagIcon } from "@/components/canopy/FlagIcon";

type NewsMediaProps = {
  imageUrl?: string | null;
  imageAlt?: string | null;
  sourceUrl?: string | null;
  flag?: string | null;
  source?: string | null;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  flagClassName?: string;
  showSource?: boolean;
};

export function NewsMedia({
  imageUrl,
  imageAlt,
  sourceUrl,
  flag,
  source,
  className = "",
  imgClassName = "",
  fallbackClassName = "",
  flagClassName = "h-8 w-11 rounded-[4px]",
  showSource = true,
}: NewsMediaProps) {
  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const candidates = useMemo(
    () =>
      [imageUrl?.trim(), screenshotUrlForArticle(sourceUrl)]
        .filter((value): value is string =>
          typeof value === "string" && value.length > 0 && isUsableImageUrl(value),
        ),
    [imageUrl, sourceUrl],
  );
  const src = candidates.find((candidate) => !failedUrls.has(candidate));
  const baseClassName = ["overflow-hidden bg-[#F4F3EE]", className].filter(Boolean).join(" ");

  if (src) {
    return (
      <img
        src={src}
        alt={imageAlt || source || "News image"}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() =>
          setFailedUrls((previous) => {
            const next = new Set(previous);
            next.add(src);
            return next;
          })
        }
        className={["block object-cover", baseClassName, imgClassName].filter(Boolean).join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "flex items-center justify-center border border-[#ECEBE4]",
        baseClassName,
        fallbackClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col items-center gap-2 px-3 text-center">
        <FlagIcon flag={flag} className={flagClassName} />
        {showSource && (
          <span className="max-w-full truncate text-[11px] font-semibold text-[#6E6E64]">
            {source || "News"}
          </span>
        )}
      </div>
    </div>
  );
}

function screenshotUrlForArticle(sourceUrl?: string | null) {
  const cleaned = sourceUrl?.trim();
  if (!cleaned) return null;

  try {
    const url = new URL(cleaned);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url.toString())}?w=1200`;
  } catch (_error) {
    return null;
  }
}

function isUsableImageUrl(value: string) {
  return !value.includes("%22%22") && !value.includes('""');
}

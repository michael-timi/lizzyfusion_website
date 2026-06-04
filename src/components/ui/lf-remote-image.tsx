"use client";

import Image, { type ImageProps } from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

type LoadPhase = "loading" | "loaded" | "error";

/** Catalogue masters live on these hosts; we serve them brand-watermarked via `/api/img`. */
function isWatermarkedStorageHost(host: string): boolean {
  return host === "firebasestorage.googleapis.com" || host === "storage.googleapis.com";
}

/**
 * Route Firebase Storage catalogue images through the brand-watermark proxy so the
 * delivered/saved image carries the Lizzy Fusion wordmark. Other sources pass through.
 */
function brandedSrc(src: ImageProps["src"]): ImageProps["src"] {
  if (typeof src !== "string") return src;
  try {
    if (isWatermarkedStorageHost(new URL(src).hostname)) {
      return `/api/img?src=${encodeURIComponent(src)}`;
    }
  } catch {
    return src;
  }
  return src;
}

/** Next's optimizer proxy times out on slow remote fetches; load these URLs directly in the browser. */
function bypassOptimizerForSrc(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  // Already processed + same-origin once routed through the watermark proxy.
  if (src.startsWith("/api/img?")) return true;
  try {
    const host = new URL(src).hostname;
    if (host === "images.unsplash.com") return true;
    // Large catalog PNGs from Storage often exceed the optimizer's ~7s fetch/resize window.
    if (isWatermarkedStorageHost(host)) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Remote `next/image` with Lizzy Fusion loading and error treatment.
 * For `fill`, use inside a `position: relative` container with explicit dimensions.
 */
export function LfRemoteImage(props: ImageProps) {
  const pathname = usePathname();
  // Admin views work with the clean Storage masters; only the public storefront is watermarked.
  const isAdminView = pathname?.startsWith("/admin") ?? false;
  const src = isAdminView ? props.src : brandedSrc(props.src);
  const unoptimized = props.unoptimized ?? bypassOptimizerForSrc(src);
  if (!props.fill) {
    return <Image {...props} src={src} alt={props.alt ?? ""} unoptimized={unoptimized} />;
  }

  return <LfRemoteImageFill {...props} src={src} fill={true} unoptimized={unoptimized} />;
}

type FillProps = ImageProps & { fill: true };

function LfRemoteImageFill(props: FillProps) {
  const { className, onLoad, onError, alt, style, fill, unoptimized, ...rest } = props;
  void fill;
  const mergedUnoptimized = unoptimized ?? bypassOptimizerForSrc(rest.src);
  const [phase, setPhase] = useState<LoadPhase>("loading");

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setPhase("loaded");
      onLoad?.(e);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setPhase("error");
      onError?.(e);
    },
    [onError],
  );

  const skeletonHidden = phase === "loaded" || phase === "error";

  return (
    <div className="absolute inset-0">
      <div
        className={`pointer-events-none absolute inset-0 z-[1] flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[var(--lf-purple-faint)] via-zinc-50 to-zinc-100 transition-opacity duration-500 ease-out ${
          skeletonHidden ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden={skeletonHidden}
      >
        <div className="flex flex-col items-center gap-3">
          <span className="section-title text-[10px] tracking-[0.28em]">Lizzy Fusion</span>
          <span className="relative h-1 w-[5.5rem] overflow-hidden rounded-full bg-[var(--lf-line)]">
            <span className="lf-image-shimmer-bar absolute inset-y-0 left-0 w-[40%] rounded-full" />
          </span>
        </div>
      </div>

      {phase === "error" ? (
        <div
          className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-2 bg-[var(--lf-purple-faint)] px-4 text-center"
          role="alert"
        >
          <p className="font-serif text-base font-semibold text-[var(--lf-ink)]">Photo did not load</p>
          <p className="max-w-[14rem] text-xs leading-relaxed text-[var(--lf-muted)]">
            Try refreshing. You can still reach the studio from the Contact page.
          </p>
        </div>
      ) : null}

      <Image
        {...rest}
        fill
        unoptimized={mergedUnoptimized}
        alt={alt ?? ""}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        className={`z-[2] transition-opacity duration-700 ease-out ${
          phase === "loaded" ? "opacity-100" : "opacity-0"
        } ${className ?? ""}`}
      />
    </div>
  );
}

"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState } from "react";

type LoadPhase = "loading" | "loaded" | "error";

/**
 * Remote `next/image` with Lizzy Fusion loading and error treatment.
 * For `fill`, use inside a `position: relative` container with explicit dimensions.
 */
export function LfRemoteImage(props: ImageProps) {
  if (!props.fill) {
    return <Image {...props} alt={props.alt ?? ""} />;
  }

  return <LfRemoteImageFill {...props} fill />;
}

type FillProps = ImageProps & { fill: true };

function LfRemoteImageFill(props: FillProps) {
  const { className, onLoad, onError, alt, style, fill, ...rest } = props;
  void fill;
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

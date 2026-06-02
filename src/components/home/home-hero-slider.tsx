"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type HomeHeroSlide = {
  src: string;
  alt: string;
  /** CSS object-position (e.g. `"center 30%"`) to keep the founder's face visible after cropping. */
  objectPosition?: string;
};

type HomeHeroSliderProps = {
  slides: readonly HomeHeroSlide[];
  /** Auto-advance interval. Auto-advance is disabled when the user has prefers-reduced-motion set. */
  intervalMs?: number;
};

const DEFAULT_INTERVAL_MS = 6000;

/**
 * Full-bleed background slider for the home hero. Renders rotating images plus the original
 * dark gradient overlay; pagination dots float above the gradient so they stay legible.
 *
 * The text/CTAs render in a sibling overlay in `page.tsx`, kept separate to keep this small
 * and focused on the image rotation behaviour.
 */
export function HomeHeroSlider({ slides, intervalMs = DEFAULT_INTERVAL_MS }: HomeHeroSliderProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (typeof window !== "undefined") {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    }
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slides.length, paused, intervalMs]);

  const goTo = (i: number) => {
    setActive(((i % slides.length) + slides.length) % slides.length);
  };

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      role="region"
      aria-roledescription="carousel"
      aria-label="Lizzy Fusion founder hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slides.map((slide, i) => {
        const isActive = i === active;
        return (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!isActive}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: slide.objectPosition ?? "center 30%" }}
            />
          </div>
        );
      })}

      {/* Same dark gradient as the original hero, kept here so dots can sit above it. */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/20"
        aria-hidden
      />

      {slides.length > 1 ? (
        <div className="pointer-events-auto absolute bottom-6 right-4 z-20 flex gap-2 sm:bottom-8 sm:right-6">
          {slides.map((slide, i) => {
            const isActive = i === active;
            return (
              <button
                key={slide.src}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show slide ${i + 1} of ${slides.length}`}
                aria-current={isActive}
                className={`h-2 rounded-full transition-all duration-300 ${
                  isActive ? "w-8 bg-white" : "w-2 bg-white/60 hover:bg-white/85"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

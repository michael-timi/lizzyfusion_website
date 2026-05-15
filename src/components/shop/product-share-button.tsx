"use client";

import { useCallback, useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { ProductShareInput } from "@/lib/product-share";
import { trackShare } from "@/lib/analytics-events";
import {
  productShareMessage,
  productShareUrl,
  productWhatsappShareHref,
} from "@/lib/product-share";

type Variant = "icon" | "button";

type ProductShareButtonProps = {
  product: ProductShareInput;
  styleLabel?: string;
  variant?: Variant;
  className?: string;
};

function IconShare({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49M17 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM7 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM17 20a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductShareButton({
  product,
  styleLabel,
  variant = "icon",
  className = "",
}: ProductShareButtonProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = productShareUrl(product.slug);
  const message = productShareMessage(product, styleLabel);
  const waHref = productWhatsappShareHref(product, styleLabel);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      void trackShare({ method: "copy_link", contentType: "product", itemId: product.slug });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
    setOpen(false);
  }, [url, product.slug]);

  const nativeShare = useCallback(async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: product.name,
        text: message,
        url,
      });
      void trackShare({ method: "native", contentType: "product", itemId: product.slug });
      setOpen(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setOpen(true);
    }
  }, [message, product.name, product.slug, url]);

  const onPrimaryClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (canNativeShare) {
      void nativeShare();
      return;
    }
    setOpen((v) => !v);
  };

  const triggerClass =
    variant === "icon"
      ? `rounded-full bg-white/90 p-2 shadow-sm backdrop-blur transition hover:bg-white text-[var(--lf-ink)] ${className}`
      : `inline-flex items-center justify-center gap-2 border border-[var(--lf-line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--lf-ink)] transition hover:border-[var(--lf-purple)] hover:text-[var(--lf-purple-deep)] ${className}`;

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={onPrimaryClick}
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={`Share ${product.name}`}
      >
        <IconShare className={variant === "button" ? "shrink-0" : "block"} />
        {variant === "button" ? <span>{copied ? "Link copied" : "Share"}</span> : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute z-20 mt-2 min-w-[11rem] rounded-xl border border-[var(--lf-line)] bg-white py-1 shadow-lg"
          style={variant === "icon" ? { left: 0, top: "100%" } : { right: 0, top: "100%" }}
        >
          {canNativeShare ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full px-3 py-2 text-left text-sm text-[var(--lf-ink)] hover:bg-violet-50"
              onClick={(e) => {
                e.stopPropagation();
                void nativeShare();
              }}
            >
              Share…
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-sm text-[var(--lf-ink)] hover:bg-violet-50"
            onClick={(e) => {
              e.stopPropagation();
              void copyLink();
            }}
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
            className="flex w-full px-3 py-2 text-left text-sm text-[var(--lf-ink)] hover:bg-violet-50"
            onClick={(e) => {
              e.stopPropagation();
              void trackShare({ method: "whatsapp", contentType: "product", itemId: product.slug });
            }}
          >
            Share on WhatsApp
          </a>
        </div>
      ) : null}
    </div>
  );
}

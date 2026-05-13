"use client";

import { effectiveCompareAtPrice } from "@/lib/catalog-pricing";
import type { CatalogPricePick } from "@/lib/catalog-pricing";
import { formatNgn } from "@/lib/site";

type Props = {
  product: CatalogPricePick;
  /** Grid cards usually align prices to the end. */
  align?: "end" | "start";
  className?: string;
};

export function CatalogPriceStack({ product, align = "end", className = "" }: Props) {
  const was = effectiveCompareAtPrice(product);
  const alignCls = align === "end" ? "items-end text-right" : "items-start text-left";
  return (
    <div className={`flex flex-col gap-0.5 tabular-nums ${alignCls} ${className}`}>
      {was !== undefined ? (
        <span className="text-xs font-medium text-[var(--lf-muted)] line-through">{formatNgn(was)}</span>
      ) : null}
      <span
        className={`text-sm font-semibold text-[var(--lf-ink)] ${was !== undefined ? "text-[var(--lf-purple-deep)]" : ""}`}
      >
        {formatNgn(product.price)}
      </span>
    </div>
  );
}

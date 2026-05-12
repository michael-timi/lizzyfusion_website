type IconHeartProps = {
  className?: string;
  /** Solid fill uses `currentColor` — pair with e.g. `text-red-600` when saved. */
  filled?: boolean;
};

/** Outline / filled heart — same path as storefront header nav. */
export function IconHeart({ className = "", filled = false }: IconHeartProps) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.49 5.49 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.49 5.49 0 0 0 0-7.78Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

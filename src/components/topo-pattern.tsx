/**
 * Light topographic-style motif inspired by the Lizzy Fusion brand overview sheet.
 */
export function TopoPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.14"
        d="M0 120c80-20 120 40 200 30s160-60 240-45 120 55 200 40 120-50 160-35"
      />
      <path
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.12"
        d="M0 200c100 30 140-40 220-25s140 50 220 35 140-45 220-30 120 40 140 25"
      />
      <path
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.1"
        d="M0 280c90-25 130 35 210 20s150-55 230-40 130 50 210 30 150-35 150-20"
      />
      <g fill="currentColor" opacity="0.06">
        <rect x="60" y="40" width="14" height="14" />
        <rect x="520" y="90" width="10" height="10" />
        <rect x="680" y="200" width="12" height="12" />
        <rect x="320" y="300" width="8" height="8" />
      </g>
    </svg>
  );
}

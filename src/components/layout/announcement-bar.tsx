import { site } from "@/lib/site";

export function AnnouncementBar() {
  return (
    <div className="bg-[var(--lf-purple-deep)] px-3 py-2.5 text-center text-xs font-medium leading-snug tracking-wide text-white text-balance sm:px-4 sm:text-sm">
      {site.announcement}
    </div>
  );
}

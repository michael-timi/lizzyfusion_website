import { site } from "@/lib/site";

export function AnnouncementBar() {
  return (
    <div className="bg-[var(--lf-purple-deep)] py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
      {site.announcement}
    </div>
  );
}

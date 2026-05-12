import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { StoreHeaderNav } from "@/components/layout/store-header-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <StoreHeaderNav />
    </header>
  );
}

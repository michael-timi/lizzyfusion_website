import { Suspense } from "react";
import { AdminSessionBar } from "@/components/layout/admin-session-bar";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { StoreHeaderNav } from "@/components/layout/store-header-nav";

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-50 overflow-visible">
      <AnnouncementBar />
      <AdminSessionBar />
      <Suspense fallback={<div className="h-[4.5rem] border-b border-[var(--lf-line)] bg-white" aria-hidden />}>
        <StoreHeaderNav />
      </Suspense>
    </header>
  );
}

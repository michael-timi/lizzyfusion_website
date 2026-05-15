export type AdminNavGroup = "overview" | "commerce" | "content" | "studio";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  group: AdminNavGroup;
  /** Short label for compact nav */
  shortLabel?: string;
};

export const ADMIN_NAV_GROUPS: { id: AdminNavGroup; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "commerce", label: "Commerce" },
  { id: "content", label: "Content" },
  { id: "studio", label: "Studio" },
];

export const ADMIN_SECTIONS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", shortLabel: "Home", description: "Orders, shortcuts, and studio pulse", group: "overview" },
  { href: "/admin/orders", label: "Orders", description: "Checkout submissions & fulfilment status", group: "commerce" },
  { href: "/admin/customers", label: "Customers", description: "Registered profiles and roles", group: "commerce" },
  { href: "/admin/catalog", label: "Catalogue", description: "Products, styles, prices, and gallery", group: "commerce" },
  { href: "/admin/catalog/add", label: "Add product", description: "New Firestore catalogue row with AI assist", group: "commerce" },
  { href: "/admin/featured", label: "Featured", description: "Homepage tiles and lookbook pins", group: "commerce" },
  { href: "/admin/blog", label: "Journal", description: "Blog posts for the storefront", group: "content" },
  { href: "/admin/processes", label: "Processes", description: "Shop, bespoke, training, WhatsApp flows", group: "studio" },
  { href: "/admin/settings", label: "Settings", description: "Firebase, Gemini, and deployment notes", group: "studio" },
];

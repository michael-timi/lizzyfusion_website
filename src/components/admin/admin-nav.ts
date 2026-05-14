export const ADMIN_SECTIONS = [
  { href: "/admin", label: "Overview", description: "Signals and shortcuts" },
  { href: "/admin/orders", label: "Orders", description: "Checkout submissions from Firestore" },
  { href: "/admin/customers", label: "Customers", description: "Registered profiles & roles" },
  { href: "/admin/blog", label: "Journal", description: "Blog posts for the storefront" },
  { href: "/admin/catalog/add", label: "Add product", description: "Create Firestore catalogue row" },
  { href: "/admin/catalog", label: "Catalog", description: "Merged storefront inventory" },
  { href: "/admin/featured", label: "Featured", description: "Pin products to homepage tiles & lookbook days" },
  { href: "/admin/processes", label: "Processes", description: "Shop, bespoke, training, WhatsApp" },
  { href: "/admin/settings", label: "Studio settings", description: "Firebase & deployment notes" },
] as const;

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ROUTE_LABELS: Record<string, string> = {
  "": "Dashboard",
  orders: "Orders",
  drafts: "Drafts",
  returns: "Returns",
  products: "Products",
  collections: "Collections",
  categories: "Categories",
  inventory: "Inventory",
  locations: "Locations",
  customers: "Customers",
  groups: "Groups",
  discounts: "Discounts",
  "gift-cards": "Gift Cards",
  pricing: "Pricing",
  settings: "Settings",
  profile: "Profile",
  users: "Team",
  store: "Store",
  regions: "Regions",
  payments: "Payments",
  "publishable-api-keys": "API Keys",
  analytics: "Analytics",
  reviews: "Reviews",
  messages: "Messages",
  notifications: "Notifications",
  marketing: "Marketing",
  advertising: "Advertising",
  campaigns: "Campaigns",
  performance: "Performance",
  catalogs: "Product Catalog",
  connect: "Connect",
  new: "New",
  blog: "Blog",
  support: "Customer Support",
  tickets: "Tickets",
  "canned-responses": "Canned Responses",
  sla: "SLA Policies",
};

// Routes that should be rendered with a custom parent breadcrumb
// Maps a path prefix to a custom breadcrumb trail
type CustomBreadcrumb = { label: string; href: string };
const CUSTOM_BREADCRUMB_ROUTES: { prefix: string; parent: CustomBreadcrumb; labelOverride?: string }[] = [
  { prefix: "/messages", parent: { label: "Customer Support", href: "/support" }, labelOverride: "Live Chat" },
  { prefix: "/support", parent: { label: "Customer Support", href: "/support" } },
];

function formatSegment(segment: string): string {
  return (
    ROUTE_LABELS[segment] ||
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export function PageBreadcrumbs() {
  const pathname = usePathname();

  if (!pathname || pathname === "/") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const segments = pathname.split("/").filter(Boolean);

  // Check if this route has a custom breadcrumb parent
  const customRoute = CUSTOM_BREADCRUMB_ROUTES.find((r) => pathname.startsWith(r.prefix));

  let crumbs: { label: string; href: string; isLast: boolean }[];

  if (customRoute) {
    if (customRoute.prefix === "/messages") {
      // /messages is a standalone route that belongs under Customer Support
      crumbs = [
        { label: customRoute.parent.label, href: customRoute.parent.href, isLast: false },
        { label: customRoute.labelOverride || "Live Chat", href: "/messages", isLast: true },
      ];
    } else {
      // /support routes: skip the first segment (support) since the parent covers it
      const subSegments = segments.slice(1);
      if (subSegments.length === 0) {
        // /support itself -> "Customer Support" > "Dashboard"
        crumbs = [
          { label: customRoute.parent.label, href: customRoute.parent.href, isLast: false },
          { label: "Dashboard", href: "/support", isLast: true },
        ];
      } else {
        crumbs = [
          { label: customRoute.parent.label, href: customRoute.parent.href, isLast: false },
          ...subSegments.map((segment, index) => {
            const isLast = index === subSegments.length - 1;
            const href = "/support/" + subSegments.slice(0, index + 1).join("/");
            // For dynamic ticket IDs, show "Ticket #..."
            const isTicketId = index === 1 && subSegments[0] === "tickets" && segment !== "new";
            const label = isTicketId ? `Ticket #${segment}` : formatSegment(segment);
            return { label, href, isLast };
          }),
        ];
      }
    }
  } else {
    // Default breadcrumb behavior
    crumbs = segments.map((segment, index) => ({
      label: formatSegment(segment),
      href: "/" + segments.slice(0, index + 1).join("/"),
      isLast: index === segments.length - 1,
    }));
  }

  const hasMany = crumbs.length >= 3;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const isIntermediate = !crumb.isLast && hasMany && index < crumbs.length - 1;
          return (
            <span key={crumb.href} className={`contents ${isIntermediate ? "hidden sm:contents" : ""}`}>
              <BreadcrumbSeparator className={isIntermediate ? "hidden sm:inline-flex" : ""} />
              <BreadcrumbItem className={isIntermediate ? "hidden sm:inline-flex" : ""}>
                {crumb.isLast ? (
                  <BreadcrumbPage className="truncate max-w-[150px] sm:max-w-none">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

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
  messages: "Messages",
  notifications: "Notifications",
  marketing: "Marketing",
  advertising: "Advertising",
  campaigns: "Campaigns",
  performance: "Performance",
  catalogs: "Product Catalog",
  connect: "Connect",
  new: "New",
};

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

  // Build breadcrumb items with accumulated paths
  const crumbs = segments.map((segment, index) => ({
    label: formatSegment(segment),
    href: "/" + segments.slice(0, index + 1).join("/"),
    isLast: index === segments.length - 1,
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb) => (
          <span key={crumb.href} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

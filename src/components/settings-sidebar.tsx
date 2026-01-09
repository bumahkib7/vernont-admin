"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const settingsNav: NavSection[] = [
  {
    title: "General",
    items: [
      { title: "Store", href: "/settings/store" },
      { title: "Users", href: "/settings/users" },
      { title: "Regions", href: "/settings/regions" },
      { title: "Tax Regions", href: "/settings/tax-regions" },
      { title: "Return Reasons", href: "/settings/return-reasons" },
      { title: "Refund Reasons", href: "/settings/refund-reasons" },
      { title: "Sales Channels", href: "/settings/sales-channels" },
      { title: "Product Types", href: "/settings/product-types" },
      { title: "Product Tags", href: "/settings/product-tags" },
      { title: "Locations & Shipping", href: "/settings/locations" },
    ],
  },
  {
    title: "Developer",
    items: [
      { title: "Publishable API Keys", href: "/settings/publishable-api-keys" },
      { title: "Secret API Keys", href: "/settings/secret-api-keys" },
      { title: "Workflows", href: "/settings/workflows" },
      { title: "Human Interventions", href: "/settings/interventions" },
    ],
  },
  {
    title: "My Account",
    items: [{ title: "Profile", href: "/settings/profile" }],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="font-semibold">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <div className="px-4 py-2 space-y-6">
          {settingsNav.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

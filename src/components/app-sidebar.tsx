"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Tag,
  LogOut,
  ChevronRight,
  Store,
  Percent,
  Gift,
  CreditCard,
  Warehouse,
  Loader2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserDisplayName, getUserInitials, getRoleDisplayName, getRoleBadgeColor } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type NavChild = {
  title: string;
  url: string;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavChild[];
};

// Organized like Medusa - logical flow from orders to settings
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart,
    children: [
      { title: "All Orders", url: "/orders" },
      { title: "Drafts", url: "/orders/drafts" },
    ],
  },
  {
    title: "Returns",
    url: "/returns",
    icon: RotateCcw,
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    children: [
      { title: "All Products", url: "/products" },
      { title: "Collections", url: "/products/collections" },
    ],
  },
  {
    title: "Categories",
    url: "/categories",
    icon: Tag,
    children: [
      { title: "All Categories", url: "/categories" },
      { title: "Add Category", url: "/categories/new" },
    ],
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Warehouse,
    children: [
      { title: "Stock Levels", url: "/inventory" },
      { title: "Locations", url: "/inventory/locations" },
    ],
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    children: [
      { title: "All Customers", url: "/customers" },
      { title: "Customer Groups", url: "/customers/groups" },
    ],
  },
  {
    title: "Discounts",
    url: "/discounts",
    icon: Percent,
  },
  {
    title: "Gift Cards",
    url: "/gift-cards",
    icon: Gift,
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

function UserMenuContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        <div className="grid flex-1 text-left text-sm leading-tight">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse mt-1" />
        </div>
      </>
    );
  }

  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
          {getUserInitials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{getUserDisplayName(user)}</span>
        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
      </div>
    </>
  );
}

function UserMenuDropdown() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <>
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{getUserDisplayName(user)}</span>
            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
          </div>
        </div>
        {user?.role && (
          <Badge className={`mt-2 ${getRoleBadgeColor(user.role)}`} variant="secondary">
            {getRoleDisplayName(user.role)}
          </Badge>
        )}
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link href="/settings/profile">
          <Settings className="mr-2 size-4" />
          Profile Settings
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <LogOut className="mr-2 size-4" />
        )}
        {isLoggingOut ? "Signing out..." : "Sign out"}
      </DropdownMenuItem>
    </>
  );
}

function NavItemWithChildren({
  item,
  isActive,
  isChildActive,
  expanded,
  onToggle,
}: {
  item: NavItem;
  isActive: boolean;
  isChildActive: (url: string) => boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={item.url}>
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible open={expanded} onOpenChange={onToggle} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive}>
            <item.icon className="size-4" />
            <span>{item.title}</span>
            <ChevronRight
              className={`ml-auto size-4 text-muted-foreground transition-transform duration-200 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuSubItem key={child.url}>
                <SidebarMenuSubButton asChild isActive={isChildActive(child.url)}>
                  <Link href={child.url}>
                    <span>{child.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand the section containing the current path
    const initial = new Set<string>();
    for (const item of navItems) {
      if (item.children) {
        const isChildActive = item.children.some((child) => {
          if (child.url === "/") return pathname === "/";
          return pathname === child.url || pathname.startsWith(child.url + "/");
        });
        if (isChildActive || (item.url !== "/" && pathname.startsWith(item.url))) {
          initial.add(item.url);
        }
      }
    }
    return initial;
  });

  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  };

  const isExactOrChildActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname === url || pathname.startsWith(url + "/");
  };

  const toggleExpanded = (url: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      <Store className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate text-xs text-muted-foreground">Store</span>
                    <span className="truncate font-semibold">Vernont</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <Settings className="mr-2 size-4" />
                  Store Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          {navItems.map((item) => (
            <NavItemWithChildren
              key={item.url}
              item={item}
              isActive={isActive(item.url)}
              isChildActive={isExactOrChildActive}
              expanded={expanded.has(item.url)}
              onToggle={() => toggleExpanded(item.url)}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <UserMenuContent />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <UserMenuDropdown />
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

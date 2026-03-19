"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { useConfirm } from "@/hooks/use-confirm";
import {
  ShoppingCart,
  Package,
  Users,
  Warehouse,
  Settings,
  LayoutDashboard,
  Plus,
  Download,
  Upload,
  Search,
  FileText,
  Tags,
  Percent,
  Gift,
  CreditCard,
  Truck,
  Globe,
  Key,
  User,
  LogOut,
  Sun,
  Moon,
  Monitor,
  RefreshCw,
  Bell,
  HelpCircle,
  MessageSquare,
  Zap,
  BarChart3,
  ArrowRight,
  Clock,
  Star,
  Keyboard,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAiPanelStore } from "@/stores/ai-panel";
import { apiFetch } from "@/lib/api";

type CommandAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
};

type CommandGroup = {
  heading: string;
  items: CommandAction[];
};

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const router = useRouter();
  const [ConfirmDialog, confirmAction] = useConfirm();

  // Live search state
  const [searchResults, setSearchResults] = React.useState<{
    products: Array<{ id: string; title: string; thumbnail?: string; status: string }>;
    orders: Array<{ id: string; displayId: string; status: string; total: number }>;
    customers: Array<{ id: string; name: string; email: string }>;
  }>({ products: [], orders: [], customers: [] });
  const [isSearching, setIsSearching] = React.useState(false);

  // Recently viewed state
  const [recentItems, setRecentItems] = React.useState<Array<{ label: string; url: string; type: string }>>([]);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("vernont-recent-items");
      if (stored) setRecentItems(JSON.parse(stored).slice(0, 5));
    } catch {}
  }, [open]);

  // Debounced live search
  React.useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults({ products: [], orders: [], customers: [] });
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [products, orders, customers] = await Promise.allSettled([
          apiFetch(`/admin/products/search?q=${encodeURIComponent(search)}&size=5`),
          apiFetch(`/admin/orders/search?q=${encodeURIComponent(search)}&size=5`),
          apiFetch(`/admin/customers/search?q=${encodeURIComponent(search)}&size=5`),
        ]);
        const toList = <T,>(result: PromiseSettledResult<unknown>, key: string): T[] => {
          if (result.status !== "fulfilled") return [];
          const data = result.value as Record<string, unknown>;
          return ((data?.[key] ?? data?.content ?? []) as T[]).slice(0, 5);
        };
        setSearchResults({
          products: toList<{ id: string; title: string; thumbnail?: string; status: string }>(products, "products"),
          orders: toList<{ id: string; displayId: string; status: string; total: number }>(orders, "orders"),
          customers: toList<{ id: string; name: string; email: string }>(customers, "customers"),
        });
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function navigateAndSave(label: string, url: string, type: string) {
    const item = { label, url, type };
    try {
      const stored = JSON.parse(localStorage.getItem("vernont-recent-items") || "[]");
      const filtered = stored.filter((i: { url: string }) => i.url !== url);
      localStorage.setItem("vernont-recent-items", JSON.stringify([item, ...filtered].slice(0, 10)));
    } catch {}
    router.push(url);
    setOpen(false);
  }

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Also support Escape to close
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setSearch("");
    command();
  }, []);

  // Navigation commands
  const navigationCommands: CommandGroup = {
    heading: "Navigation",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        shortcut: "G D",
        action: () => router.push("/"),
        keywords: ["home", "overview", "analytics"],
      },
      {
        id: "orders",
        label: "Orders",
        icon: <ShoppingCart className="h-4 w-4" />,
        shortcut: "G O",
        action: () => router.push("/orders"),
        keywords: ["sales", "purchases", "transactions"],
      },
      {
        id: "products",
        label: "Products",
        icon: <Package className="h-4 w-4" />,
        shortcut: "G P",
        action: () => router.push("/products"),
        keywords: ["items", "catalog", "merchandise"],
      },
      {
        id: "customers",
        label: "Customers",
        icon: <Users className="h-4 w-4" />,
        shortcut: "G C",
        action: () => router.push("/customers"),
        keywords: ["users", "clients", "buyers"],
      },
      {
        id: "inventory",
        label: "Inventory",
        icon: <Warehouse className="h-4 w-4" />,
        shortcut: "G I",
        action: () => router.push("/inventory"),
        keywords: ["stock", "warehouse", "levels"],
      },
      {
        id: "discounts",
        label: "Discounts",
        icon: <Percent className="h-4 w-4" />,
        action: () => router.push("/discounts"),
        keywords: ["promotions", "coupons", "sales", "offers"],
      },
      {
        id: "gift-cards",
        label: "Gift Cards",
        icon: <Gift className="h-4 w-4" />,
        action: () => router.push("/gift-cards"),
        keywords: ["vouchers", "certificates"],
      },
      {
        id: "collections",
        label: "Collections",
        icon: <Tags className="h-4 w-4" />,
        action: () => router.push("/collections"),
        keywords: ["categories", "groups"],
      },
    ],
  };

  // Quick Actions
  const quickActions: CommandGroup = {
    heading: "Quick Actions",
    items: [
      {
        id: "new-order",
        label: "Create New Order",
        icon: <Plus className="h-4 w-4" />,
        shortcut: "N O",
        action: () => router.push("/orders/new"),
        keywords: ["add", "new", "create order"],
      },
      {
        id: "new-product",
        label: "Add New Product",
        icon: <Plus className="h-4 w-4" />,
        shortcut: "N P",
        action: () => router.push("/products?action=add"),
        keywords: ["add", "new", "create product"],
      },
      {
        id: "new-customer",
        label: "Add New Customer",
        icon: <Plus className="h-4 w-4" />,
        shortcut: "N C",
        action: () => router.push("/customers/new"),
        keywords: ["add", "new", "create customer"],
      },
      {
        id: "new-discount",
        label: "Create Discount",
        icon: <Plus className="h-4 w-4" />,
        action: () => router.push("/discounts/new"),
        keywords: ["add", "new", "promotion", "coupon"],
      },
      {
        id: "export-orders",
        label: "Export Orders",
        icon: <Download className="h-4 w-4" />,
        action: () => {
          // Trigger export
          alert("Exporting orders...");
        },
        keywords: ["download", "csv", "excel"],
      },
      {
        id: "import-products",
        label: "Import Products",
        icon: <Upload className="h-4 w-4" />,
        action: () => {
          alert("Opening product import...");
        },
        keywords: ["upload", "bulk", "csv"],
      },
      {
        id: "sync-inventory",
        label: "Sync Inventory",
        icon: <RefreshCw className="h-4 w-4" />,
        action: () => {
          alert("Syncing inventory...");
        },
        keywords: ["refresh", "update", "stock"],
      },
    ],
  };

  // Settings commands
  const settingsCommands: CommandGroup = {
    heading: "Settings",
    items: [
      {
        id: "settings",
        label: "Settings",
        icon: <Settings className="h-4 w-4" />,
        shortcut: "G S",
        action: () => router.push("/settings"),
        keywords: ["preferences", "configuration"],
      },
      {
        id: "store-settings",
        label: "Store Settings",
        icon: <Globe className="h-4 w-4" />,
        action: () => router.push("/settings/store"),
        keywords: ["shop", "details"],
      },
      {
        id: "regions",
        label: "Regions",
        icon: <Globe className="h-4 w-4" />,
        action: () => router.push("/settings/regions"),
        keywords: ["markets", "countries", "zones"],
      },
      {
        id: "shipping",
        label: "Shipping & Locations",
        icon: <Truck className="h-4 w-4" />,
        action: () => router.push("/settings/locations"),
        keywords: ["fulfillment", "delivery", "warehouses"],
      },
      {
        id: "payments",
        label: "Payment Providers",
        icon: <CreditCard className="h-4 w-4" />,
        action: () => router.push("/settings/payments"),
        keywords: ["stripe", "paypal", "checkout"],
      },
      {
        id: "api-keys",
        label: "API Keys",
        icon: <Key className="h-4 w-4" />,
        action: () => router.push("/settings/publishable-api-keys"),
        keywords: ["tokens", "integration", "developer"],
      },
      {
        id: "users",
        label: "Team Members",
        icon: <Users className="h-4 w-4" />,
        action: () => router.push("/settings/users"),
        keywords: ["staff", "admin", "permissions"],
      },
    ],
  };

  // User actions
  const userActions: CommandGroup = {
    heading: "Account",
    items: [
      {
        id: "profile",
        label: "My Profile",
        icon: <User className="h-4 w-4" />,
        action: () => router.push("/settings/profile"),
        keywords: ["account", "personal"],
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: <Bell className="h-4 w-4" />,
        action: () => {
          alert("Opening notifications...");
        },
        keywords: ["alerts", "updates"],
      },
      {
        id: "keyboard-shortcuts",
        label: "Keyboard Shortcuts",
        icon: <Keyboard className="h-4 w-4" />,
        shortcut: "?",
        action: () => setShortcutsOpen(true),
        keywords: ["hotkeys", "keys"],
      },
      {
        id: "help",
        label: "Help & Documentation",
        icon: <HelpCircle className="h-4 w-4" />,
        action: () => {
          window.open("https://docs.medusajs.com", "_blank");
        },
        keywords: ["support", "docs", "guide"],
      },
      {
        id: "feedback",
        label: "Send Feedback",
        icon: <MessageSquare className="h-4 w-4" />,
        action: () => {
          alert("Opening feedback form...");
        },
        keywords: ["report", "suggest"],
      },
      {
        id: "logout",
        label: "Log Out",
        icon: <LogOut className="h-4 w-4" />,
        action: async () => {
          const ok = await confirmAction({ title: "Log out", description: "Are you sure you want to log out?", confirmLabel: "Log out", variant: "destructive" });
          if (ok) router.push("/login");
        },
        keywords: ["sign out", "exit"],
      },
    ],
  };

  // Theme commands
  const themeCommands: CommandGroup = {
    heading: "Appearance",
    items: [
      {
        id: "theme-light",
        label: "Light Mode",
        icon: <Sun className="h-4 w-4" />,
        action: () => {
          document.documentElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
        },
        keywords: ["bright", "day"],
      },
      {
        id: "theme-dark",
        label: "Dark Mode",
        icon: <Moon className="h-4 w-4" />,
        action: () => {
          document.documentElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
        },
        keywords: ["night"],
      },
      {
        id: "theme-system",
        label: "System Theme",
        icon: <Monitor className="h-4 w-4" />,
        action: () => {
          localStorage.removeItem("theme");
          if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        },
        keywords: ["auto", "default"],
      },
    ],
  };

  // Reports & Analytics
  const reportsCommands: CommandGroup = {
    heading: "Reports",
    items: [
      {
        id: "sales-report",
        label: "Sales Report",
        icon: <BarChart3 className="h-4 w-4" />,
        action: () => router.push("/reports/sales"),
        keywords: ["revenue", "analytics"],
      },
      {
        id: "inventory-report",
        label: "Inventory Report",
        icon: <FileText className="h-4 w-4" />,
        action: () => router.push("/reports/inventory"),
        keywords: ["stock", "levels"],
      },
      {
        id: "customer-report",
        label: "Customer Report",
        icon: <Users className="h-4 w-4" />,
        action: () => router.push("/reports/customers"),
        keywords: ["users", "analytics"],
      },
    ],
  };

  // AI commands
  const aiCommands: CommandGroup = {
    heading: "AI Agent",
    items: [
      {
        id: "ai-open",
        label: "Open AI Agent",
        icon: <Sparkles className="h-4 w-4 text-violet-500" />,
        shortcut: "⌘J",
        action: () => useAiPanelStore.getState().setOpen(true),
        keywords: ["ai", "agent", "chat", "assistant", "claude"],
      },
      {
        id: "ai-sales",
        label: "Ask AI: Sales Summary",
        icon: <Sparkles className="h-4 w-4 text-violet-500" />,
        action: () => {
          useAiPanelStore.getState().setOpen(true);
          // Small delay so panel opens first
          setTimeout(() => {
            const event = new CustomEvent("ai-quick-prompt", { detail: "Give me a sales summary for this week" });
            window.dispatchEvent(event);
          }, 200);
        },
        keywords: ["ai", "revenue", "analytics", "report"],
      },
      {
        id: "ai-low-stock",
        label: "Ask AI: Low Stock Report",
        icon: <Sparkles className="h-4 w-4 text-violet-500" />,
        action: () => {
          useAiPanelStore.getState().setOpen(true);
          setTimeout(() => {
            const event = new CustomEvent("ai-quick-prompt", { detail: "Show me items that are low on stock" });
            window.dispatchEvent(event);
          }, 200);
        },
        keywords: ["ai", "inventory", "stock", "alert"],
      },
      {
        id: "ai-recent-orders",
        label: "Ask AI: Recent Orders",
        icon: <Sparkles className="h-4 w-4 text-violet-500" />,
        action: () => {
          useAiPanelStore.getState().setOpen(true);
          setTimeout(() => {
            const event = new CustomEvent("ai-quick-prompt", { detail: "What are the most recent orders?" });
            window.dispatchEvent(event);
          }, 200);
        },
        keywords: ["ai", "orders", "latest", "recent"],
      },
    ],
  };

  const allGroups = [
    aiCommands,
    navigationCommands,
    quickActions,
    settingsCommands,
    reportsCommands,
    themeCommands,
    userActions,
  ];

  return (
    <>
      {/* Trigger button for mobile / visual indicator */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-[400px]">
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p>No results found.</p>
              <p className="text-xs text-muted-foreground">
                Try searching for something else
              </p>
            </div>
          </CommandEmpty>

          {/* Recently Viewed */}
          {!search && recentItems.length > 0 && (
            <CommandGroup heading="Recently Viewed">
              {recentItems.map((item, i) => (
                <CommandItem key={i} onSelect={() => navigateAndSave(item.label, item.url, item.type)}>
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground capitalize">{item.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Live search results */}
          {search.length >= 2 && (
            <>
              {isSearching && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <span className="text-sm text-muted-foreground mt-2">Searching...</span>
                </div>
              )}

              {searchResults.products.length > 0 && (
                <CommandGroup heading="Products">
                  {searchResults.products.map((p) => (
                    <CommandItem key={p.id} onSelect={() => navigateAndSave(p.title, `/products/${p.id}`, "product")}>
                      <Package className="mr-2 h-4 w-4" />
                      <span>{p.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{p.status}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.orders.length > 0 && (
                <CommandGroup heading="Orders">
                  {searchResults.orders.map((o) => (
                    <CommandItem key={o.id} onSelect={() => navigateAndSave(`#${o.displayId || o.id.slice(0, 8)}`, `/orders/${o.id}`, "order")}>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      <span>#{o.displayId || o.id.slice(0, 8)}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{o.status}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {searchResults.customers.map((c) => (
                    <CommandItem key={c.id} onSelect={() => navigateAndSave(c.name || c.email, `/customers/${c.id}`, "customer")}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>{c.name || c.email}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{c.email}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isSearching && searchResults.products.length === 0 && searchResults.orders.length === 0 && searchResults.customers.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No results found for &quot;{search}&quot;
                </div>
              )}

              <CommandSeparator />
            </>
          )}

          {allGroups.map((group, groupIndex) => (
            <React.Fragment key={group.heading}>
              <CommandGroup heading={group.heading}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.label} ${item.keywords?.join(" ") || ""}`}
                    onSelect={() => runCommand(item.action)}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span>{item.label}</span>
                    </div>
                    {item.shortcut && (
                      <CommandShortcut>{item.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {groupIndex < allGroups.length - 1 && <CommandSeparator />}
            </React.Fragment>
          ))}
        </CommandList>

        {/* Footer with keyboard hints */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">↑</kbd>
              <kbd className="rounded border bg-muted px-1">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">↵</kbd>
              to select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1">esc</kbd>
              to close
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            <span>Powered by Vernont</span>
          </div>
        </div>
      </CommandDialog>

      <KeyboardShortcutsModal
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
      />
      <ConfirmDialog />
    </>
  );
}

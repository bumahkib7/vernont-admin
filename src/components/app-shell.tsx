"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ConditionalSidebar } from "@/components/conditional-sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationHandlerProvider } from "@/hooks/use-notification-handler";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

// Routes that don't show the sidebar/header
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // Show loading spinner while checking auth
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes: render without sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Not authenticated and not on public route: show nothing (redirect happens in auth-context)
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authenticated: render with sidebar
  return (
    <NotificationHandlerProvider>
      <SidebarProvider>
        <ConditionalSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Dashboard</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <CommandPalette />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </NotificationHandlerProvider>
  );
}

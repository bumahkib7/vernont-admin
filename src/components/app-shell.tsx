"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ConditionalSidebar } from "@/components/conditional-sidebar";
import { Separator } from "@/components/ui/separator";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { NotificationHandlerProvider } from "@/hooks/use-notification-handler";
import { useAuth } from "@/lib/auth-context";

import { PageBreadcrumbs } from "@/components/page-breadcrumbs";
import { AiChatButton } from "@/components/ai/ai-chat-button";
import { GlobalKeyboardShortcuts } from "@/components/global-keyboard-shortcuts";
import { useAgentNavigation } from "@/hooks/use-agent-navigation";
import { useAiPanelStore } from "@/stores/ai-panel";

// Routes that don't show the sidebar/header
const PUBLIC_ROUTES = ["/login", "/forgot-password", "/reset-password", "/set-password"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  // Hooks must be called unconditionally (Rules of Hooks).
  useAgentNavigation();

  // Cmd+J to toggle AI panel
  const toggleAiPanel = useAiPanelStore((s) => s.toggle);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleAiPanel();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [toggleAiPanel]);

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));

  // Show branded loading screen while checking auth
  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <span className="text-2xl font-bold tracking-widest text-foreground">VERNONT</span>
          <span className="text-xs text-muted-foreground tracking-wide uppercase">Admin</span>
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <span className="text-2xl font-bold tracking-widest text-foreground">VERNONT</span>
          <span className="text-xs text-muted-foreground tracking-wide uppercase">Redirecting...</span>
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
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-b-transparent px-3 sm:px-4 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-indigo-500/40 after:via-border after:to-border">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <PageBreadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
              <CommandPalette />
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
        <GlobalKeyboardShortcuts />
        <AiChatButton />
      </SidebarProvider>
    </NotificationHandlerProvider>
  );
}

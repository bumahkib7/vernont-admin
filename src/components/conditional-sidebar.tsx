"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { SettingsSidebar } from "./settings-sidebar";

export function ConditionalSidebar() {
  const pathname = usePathname();
  const isSettings = pathname.startsWith("/settings");

  if (isSettings) {
    return <SettingsSidebar />;
  }

  return <AppSidebar />;
}

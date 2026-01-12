"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";
import { setStoreConfig } from "@/stores";

// Configure stores with API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function Providers({ children }: { children: React.ReactNode }) {
  // Configure stores on mount
  useEffect(() => {
    setStoreConfig({
      apiBaseUrl: API_URL,
      wsEndpoint: "/ws",
      wsTokenEndpoint: "/api/v1/internal/auth/ws-token",
    });
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

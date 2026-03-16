"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgentActionsStore } from "@/stores/agent-actions";

/**
 * Reacts to pendingNavigation changes in the agent actions store.
 * Uses a ref + useEffect to avoid Zustand v5 subscribe selector issues.
 */
export function useAgentNavigation() {
  const router = useRouter();
  const pendingNavigation = useAgentActionsStore((s) => s.pendingNavigation);
  const consumeNavigation = useAgentActionsStore((s) => s.consumeNavigation);
  const navigatingRef = useRef(false);

  useEffect(() => {
    if (pendingNavigation && !navigatingRef.current) {
      navigatingRef.current = true;
      router.push(pendingNavigation.path);
      // Delay consume to let React settle after navigation
      requestAnimationFrame(() => {
        consumeNavigation();
        navigatingRef.current = false;
      });
    }
  }, [pendingNavigation, router, consumeNavigation]);
}

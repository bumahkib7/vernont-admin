"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentActionsStore } from "@/stores/agent-actions";

export function useAgentNavigation() {
  const router = useRouter();

  useEffect(() => {
    const unsub = useAgentActionsStore.subscribe((state) => {
      if (state.pendingNavigation) {
        router.push(state.pendingNavigation.path);
        // Use setTimeout to avoid updating store during subscribe callback
        setTimeout(() => useAgentActionsStore.getState().consumeNavigation(), 0);
      }
    });
    return unsub;
  }, [router]);
}

"use client";

import { useEffect } from "react";
import { useAgentActionsStore } from "@/stores/agent-actions";

export function usePageContext(page: string, entityId?: string, entityType?: string) {
  const setPageContext = useAgentActionsStore((s) => s.setPageContext);

  useEffect(() => {
    setPageContext(page, entityId, entityType);
  }, [page, entityId, entityType, setPageContext]);
}

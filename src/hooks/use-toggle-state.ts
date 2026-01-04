"use client";

import { useState, useCallback } from "react";

/**
 * A hook for managing boolean toggle state with both object and array destructuring
 * Based on Medusa's useToggleState pattern
 */
export default function useToggleState(initialState = false) {
  const [state, setState] = useState(initialState);

  const open = useCallback(() => setState(true), []);
  const close = useCallback(() => setState(false), []);
  const toggle = useCallback(() => setState((prev) => !prev), []);

  // Support both object and array destructuring
  const hookData = { state, open, close, toggle };
  return Object.assign([state, open, close, toggle] as const, hookData);
}

"use client";

import { useRef, useCallback } from "react";
import { Howl } from "howler";

const ORDER_SOUND_SRC = "/sounds/order-notification.wav";

/**
 * Plays a notification sound via Howler.js.
 * Lazily initializes the Howl instance on first play to avoid
 * loading audio until actually needed and to respect mobile
 * auto-play policies (first call must come from user gesture context
 * or after the AudioContext is unlocked by a prior interaction).
 */
export function useNotificationSound() {
  const howlRef = useRef<Howl | null>(null);

  const play = useCallback(() => {
    if (!howlRef.current) {
      howlRef.current = new Howl({
        src: [ORDER_SOUND_SRC],
        volume: 0.6,
        preload: true,
      });
    }
    howlRef.current.play();
  }, []);

  return { play };
}

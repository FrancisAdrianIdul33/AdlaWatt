import type { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/* ============================================================
   RESILIENT REALTIME SUBSCRIPTIONS
   Shared recovery for every postgres_changes watcher
   (notification monitoring + components, navbar badge,
   dashboard components). Flaky transport drops sockets with
   CHANNEL_ERROR / TIMED_OUT / closes; the socket client heals
   itself, but a dead channel object never recovers — so this
   helper recreates the channel on capped exponential backoff
   with jitter, forever while the owner is alive.
   Safety rules, applied uniformly:
   - Stable per-owner topic, deduped via getChannels (adopt,
     never stack duplicates on StrictMode remounts).
   - removeChannel before every recreate; guaranteed removal
     on stop (unmount / logout / user change).
   - Backoff is capped (30s) and jittered: no hot loops, no
     thundering herds across tabs.
   - Warn-once logging: the first error in a window warns,
     repeats stay silent so reconnect storms don't spam.
   - CLOSED after explicit removal is expected teardown: silent.
   - Notification evaluation, filters, topics, cooldowns are
     untouched — this only owns channel lifecycle.
   ============================================================ */

export type ResilientChannel = ReturnType<
  typeof supabase.channel
>;

interface ResilientSubscriptionOptions {
  topic: string;
  label: string;
  build: (
    base: ResilientChannel,
  ) => ResilientChannel;
  isAlive: () => boolean;
  onChannel?: (
    channel: ResilientChannel | null,
  ) => void;
  onSubscribed?: () => void;
}

export interface ResilientSubscription {
  stop: () => void;
}

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
const WARN_QUIET_MS = 30000;
const JITTER_MS = 500;

function getErrorMessage(
  error: unknown,
): unknown {
  return error instanceof Error
    ? error.message
    : error;
}

export function subscribeResilientChannel(
  options: ResilientSubscriptionOptions,
): ResilientSubscription {
  let stopped = false;
  let attempts = 0;
  let unhealthy = false;
  let lastWarnAt = 0;

  let timer: ReturnType<typeof setTimeout> | null =
    null;

  let current: ResilientChannel | null =
    null;

  const isActive = () =>
    !stopped && options.isAlive();

  const clearTimer = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const warnOnce = (
    status: REALTIME_SUBSCRIBE_STATES,
    error: unknown,
  ) => {
    const now = Date.now();

    if (now - lastWarnAt < WARN_QUIET_MS) {
      return;
    }

    lastWarnAt = now;

    console.warn(
      `${options.label} channel issue:`,
      status,
      getErrorMessage(error),
    );
  };

  const scheduleRetry = () => {
    if (!isActive()) {
      return;
    }

    attempts += 1;

    const backoff = Math.min(
      MAX_DELAY_MS,
      BASE_DELAY_MS * 2 ** (attempts - 1),
    );

    const delay =
      backoff + Math.random() * JITTER_MS;

    clearTimer();

    timer = setTimeout(() => {
      timer = null;

      if (!isActive()) {
        return;
      }

      if (current != null) {
        supabase
          .removeChannel(current)
          .catch(() => {});
      }

      current = null;
      options.onChannel?.(null);

      connect();
    }, delay);
  };

  const handleStatus = (
    status: REALTIME_SUBSCRIBE_STATES,
    error?: Error,
  ) => {
    if (!isActive()) {
      return;
    }

    if (status === "SUBSCRIBED") {
      attempts = 0;
      unhealthy = false;
      options.onSubscribed?.();

      return;
    }

    if (
      status === "CHANNEL_ERROR" ||
      status === "TIMED_OUT"
    ) {
      unhealthy = true;
      warnOnce(status, error);
      scheduleRetry();

      return;
    }

    // CLOSED after explicit removeChannel (logout / unmount /
    // user change) is expected teardown — stay silent.
    // Unexpected closes surface via CHANNEL_ERROR/TIMED_OUT.
  };

  const connect = () => {
    if (!isActive()) {
      return;
    }

    const reused = supabase
      .getChannels()
      .find(
        (candidate) =>
          (
            candidate as unknown as {
              topic?: string;
            }
          ).topic === `realtime:${options.topic}`,
      ) as ResilientChannel | undefined;

    if (reused) {
      current = reused;
      options.onChannel?.(reused);

      return;
    }

    const built = options.build(
      supabase.channel(options.topic),
    );

    current = built;
    options.onChannel?.(built);

    built.subscribe(handleStatus);
  };

  const reconnectNow = () => {
    if (!isActive() || !unhealthy) {
      return;
    }

    attempts = 0;
    clearTimer();

    if (current != null) {
      supabase
        .removeChannel(current)
        .catch(() => {});
    }

    current = null;
    options.onChannel?.(null);

    connect();
  };

  const handleOnline = () => {
    reconnectNow();
  };

  const handleVisibility = () => {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      reconnectNow();
    }
  };

  if (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof window.addEventListener === "function"
  ) {
    window.addEventListener("online", handleOnline);
    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );
  }

  connect();

  return {
    stop: () => {
      stopped = true;
      clearTimer();

      if (
        typeof window !== "undefined" &&
        typeof document !== "undefined" &&
        typeof window.removeEventListener ===
          "function"
      ) {
        window.removeEventListener(
          "online",
          handleOnline,
        );
        document.removeEventListener(
          "visibilitychange",
          handleVisibility,
        );
      }

      if (current != null) {
        supabase
          .removeChannel(current)
          .catch(() => {});
      }

      current = null;
      options.onChannel?.(null);
    },
  };
}

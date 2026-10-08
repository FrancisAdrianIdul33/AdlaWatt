import { useEffect, useState } from "react";

import NetInfo from "@react-native-community/netinfo";

// ============================================================
// USE CONNECTIVITY
// ============================================================
//
// Phone-side connectivity (NOT device status — that stays in
// monitoringService). Distinguishes "phone offline" (show
// cached readings + banner) from "unit offline" (device
// problem worth troubleshooting).
//
// `connected` starts null (unknown) and only drives UI once
// resolved — the banner renders solely on an explicit false,
// never on first paint.
// ============================================================

export function useConnectivity(): {
  connected: boolean | null;
} {
  const [connected, setConnected] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    const unsubscribe =
      NetInfo.addEventListener(
        (state) => {
          setConnected(
            state.isConnected ?? null,
          );
        },
      );

    return () => {
      unsubscribe();
    };
  }, []);

  return { connected };
}

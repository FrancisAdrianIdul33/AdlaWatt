import { useEffect, useState } from "react";

import {
  getAuthenticatedUserSafe,
  supabase,
} from "@/lib/supabase";

// ============================================================
// TYPES
// ============================================================

export type TemperatureStatus =
  | "Nominal"
  | "Elevated"
  | "High"
  | "Critical";

export type DeviceStatus =
  | "Online"
  | "Offline";

export type BatteryStatus =
  | "Charging"
  | "Discharging"
  | "Idle";

export type SolarStatus =
  | "Low"
  | "Moderate"
  | "High";

export type DoDStatus =
  | "Safe"
  | "Unsafe";

// ============================================================
// MONITORING DATA
// ============================================================

export interface MonitoringData {

  // ----------------------------------------------------------
  // BATTERY
  // ----------------------------------------------------------

  battery_level: number;

  battery_status: BatteryStatus;

  time_remaining: string;

  voltage: number;

  watt_hours: number;

  current_load: number;

  device_status: DeviceStatus;

  // ----------------------------------------------------------
  // SOLAR
  // ----------------------------------------------------------

  solar_input: number;

  solar_status: SolarStatus;

  solar_timer: string;

  solar_voltage: number;

  solar_current: number;

  total_energy: number;

  // ----------------------------------------------------------
  // BATTERY TEMPERATURE
  // ----------------------------------------------------------

  battery_temperature: number;

  battery_temperature_status: TemperatureStatus;

  // ----------------------------------------------------------
  // DEPTH OF DISCHARGE
  // ----------------------------------------------------------

  dod_status: DoDStatus;

  // ----------------------------------------------------------
  // SOLAR PANEL TEMPERATURE
  // ----------------------------------------------------------

  solar_temperature: number;

  solar_temperature_status: TemperatureStatus;

  // ----------------------------------------------------------
  // INTERIOR TEMPERATURE
  // ----------------------------------------------------------

  interior_temp: number;

  interior_temp_status: TemperatureStatus;
}

// ============================================================
// SAFE TEMPERATURE STATUS
// ============================================================

const normalizeTemperatureStatus = (
  status: unknown,
): TemperatureStatus => {

  if (
    status === "Nominal" ||
    status === "Elevated" ||
    status === "High" ||
    status === "Critical"
  ) {

    return status;
  }

  return "Nominal";
};

// ============================================================
// SAFE NUMERIC VALUE
// ============================================================

const normalizeNumber = (
  value: unknown,
): number => {

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {

    return value;
  }

  if (
    typeof value === "string"
  ) {

    const parsed =
      Number(value);

    if (
      Number.isFinite(parsed)
    ) {

      return parsed;
    }
  }

  return 0;
};

// ============================================================
// NORMALIZE MONITORING DATA
// ============================================================

const normalizeMonitoringData = (
  data: any,
): MonitoringData => {

  return {

    // --------------------------------------------------------
    // BATTERY
    // --------------------------------------------------------

    battery_level:
      normalizeNumber(
        data?.battery_level,
      ),

    battery_status:
      data?.battery_status === "Charging" ||
      data?.battery_status === "Discharging" ||
      data?.battery_status === "Idle"
        ? data.battery_status
        : "Idle",

    time_remaining:
      typeof data?.time_remaining === "string"
        ? data.time_remaining
        : "0h 00m",

    voltage:
      normalizeNumber(
        data?.voltage,
      ),

    watt_hours:
      normalizeNumber(
        data?.watt_hours,
      ),

    current_load:
      normalizeNumber(
        data?.current_load,
      ),

    device_status:
      data?.device_status === "Online"
        ? "Online"
        : "Offline",

    // --------------------------------------------------------
    // SOLAR
    // --------------------------------------------------------

    solar_input:
      normalizeNumber(
        data?.solar_input,
      ),

    solar_status:
      data?.solar_status === "Low" ||
      data?.solar_status === "Moderate" ||
      data?.solar_status === "High"
        ? data.solar_status
        : "Low",

    solar_timer:
      typeof data?.solar_timer === "string"
        ? data.solar_timer
        : "00:00:00",

    solar_voltage:
      normalizeNumber(
        data?.solar_voltage,
      ),

    solar_current:
      normalizeNumber(
        data?.solar_current,
      ),

    total_energy:
      normalizeNumber(
        data?.total_energy,
      ),

    // --------------------------------------------------------
    // BATTERY TEMPERATURE
    // --------------------------------------------------------

    battery_temperature:
      normalizeNumber(
        data?.battery_temperature,
      ),

    battery_temperature_status:
      normalizeTemperatureStatus(
        data?.battery_temperature_status,
      ),

    // --------------------------------------------------------
    // DEPTH OF DISCHARGE
    // --------------------------------------------------------

    dod_status:
      data?.dod_status === "Safe"
        ? "Safe"
        : "Unsafe",

    // --------------------------------------------------------
    // SOLAR PANEL TEMPERATURE
    // --------------------------------------------------------

    solar_temperature:
      normalizeNumber(
        data?.solar_temperature,
      ),

    solar_temperature_status:
      normalizeTemperatureStatus(
        data?.solar_temperature_status,
      ),

    // --------------------------------------------------------
    // INTERIOR TEMPERATURE
    // --------------------------------------------------------

    interior_temp:
      normalizeNumber(
        data?.interior_temp,
      ),

    interior_temp_status:
      normalizeTemperatureStatus(
        data?.interior_temp_status,
      ),
  };
};

// ============================================================
// FETCH MONITORING DATA
// ============================================================

export const getMonitoringData =
  async (): Promise<MonitoringData | null> => {

    const user = await getAuthenticatedUserSafe();

    if (!user) {

      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("monitoring")
      .select(`
        battery_level,
        battery_status,
        time_remaining,
        voltage,
        watt_hours,
        solar_input,
        solar_status,
        solar_timer,
        solar_voltage,
        solar_current,
        total_energy,
        current_load,
        device_status,
        battery_temperature,
        battery_temperature_status,
        dod_status,
        solar_temperature,
        solar_temperature_status,
        interior_temp,
        interior_temp_status
      `)
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

    if (error) {

      console.error(
        "Error loading monitoring data:",
        error.message,
      );

      return null;
    }

    if (!data) {

      return null;
    }

    return normalizeMonitoringData(
      data,
    );
  };

// ============================================================
// FETCH DEVICE STATUS ONLY
// ============================================================

export const getDeviceStatus =
  async (): Promise<DeviceStatus> => {

    const user = await getAuthenticatedUserSafe();

    if (!user) {

      return "Offline";
    }

    const {
      data,
      error,
    } = await supabase
      .from("monitoring")
      .select(
        "device_status",
      )
      .eq(
        "user_id",
        user.id,
      )
      .maybeSingle();

    if (error) {

      console.error(
        "Error loading device status:",
        error,
      );

      return "Offline";
    }

    return data?.device_status === "Online"
      ? "Online"
      : "Offline";
  };

// ============================================================
// SUBSCRIBE TO MONITORING
// ============================================================

export const subscribeToMonitoring =
  async (
    onChange: (
      data: MonitoringData | null,
    ) => void,
  ) => {

    const user = await getAuthenticatedUserSafe();

    if (!user) {

      return null;
    }

    const topic = `monitoring-hook-${user.id}`;

    const reused = supabase
      .getChannels()
      .find(
        (c) =>
          (c as unknown as { topic?: string }).topic ===
          `realtime:${topic}`,
      );

    if (reused) {
      return reused as unknown as ReturnType<
        typeof supabase.channel
      >;
    }

    const channel =
      supabase
        .channel(
          topic,
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "monitoring",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {

            // ------------------------------------------------
            // DELETE
            // ------------------------------------------------

            if (
              payload.eventType === "DELETE"
            ) {

              onChange(null);

              return;
            }

            // ------------------------------------------------
            // INSERT / UPDATE
            // ------------------------------------------------

            if (
              payload.new
            ) {

              onChange(
                normalizeMonitoringData(
                  payload.new,
                ),
              );
            }
          },
        )
        .subscribe(
          (status) => {

            if (
              status === "CHANNEL_ERROR"
            ) {

              console.warn(
                "Monitoring Realtime channel error.",
              );
            }

            if (
              status === "TIMED_OUT"
            ) {

              console.warn(
                "Monitoring Realtime connection timed out.",
              );
            }

            if (
              status === "CLOSED"
            ) {

              console.warn(
                "Monitoring Realtime channel closed.",
              );
            }
          },
        );

    return channel;
  };

// ============================================================
// SUBSCRIBE TO DEVICE STATUS ONLY
// ============================================================

export const subscribeToDeviceStatus =
  async (
    onChange: (
      status: DeviceStatus,
    ) => void,
  ) => {

    const user = await getAuthenticatedUserSafe();

    if (!user) {

      onChange("Offline");

      return null;
    }

    const topic = `device-status-${user.id}`;

    const reused = supabase
      .getChannels()
      .find(
        (c) =>
          (c as unknown as { topic?: string }).topic ===
          `realtime:${topic}`,
      );

    if (reused) {
      return reused as unknown as ReturnType<
        typeof supabase.channel
      >;
    }

    const channel =
      supabase
        .channel(
          topic,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "monitoring",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {

            onChange(
              payload.new?.device_status ===
                "Online"
                ? "Online"
                : "Offline",
            );
          },
        )
        .subscribe(
          (status) => {

            if (
              status === "CHANNEL_ERROR"
            ) {

              console.warn(
                "Device status Realtime channel error.",
              );
            }

            if (
              status === "TIMED_OUT"
            ) {

              console.warn(
                "Device status Realtime connection timed out.",
              );
            }

            if (
              status === "CLOSED"
            ) {

              console.warn(
                "Device status Realtime channel closed.",
              );
            }
          },
        );

    return channel;
  };

// ============================================================
// UNSUBSCRIBE
// ============================================================

export const unsubscribeFromMonitoring =
  (
    channel:
      | ReturnType<
          typeof supabase.channel
        >
      | null,
  ) => {

    if (
      channel
    ) {

      supabase.removeChannel(
        channel,
      );
    }
  };

// ============================================================
// UNSUBSCRIBE FROM DEVICE STATUS
// ============================================================

export const unsubscribeFromDeviceStatus =
  (
    channel:
      | ReturnType<
          typeof supabase.channel
        >
      | null,
  ) => {

    if (
      channel
    ) {

      supabase.removeChannel(
        channel,
      );
    }
  };

// ============================================================
// USE MONITORING HOOK
// ============================================================

export const useMonitoring =
  () => {

    const [
      monitoring,
      setMonitoring,
    ] = useState<
      MonitoringData | null
    >(null);

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(
      () => {

        let mounted =
          true;

        let channel:
          | ReturnType<
              typeof supabase.channel
            >
          | null = null;

        const initializeMonitoring =
          async () => {

            try {

              // ------------------------------------------------
              // GET INITIAL MONITORING DATA
              // ------------------------------------------------

              const data =
                await getMonitoringData();

              if (
                !mounted
              ) {

                return;
              }

              setMonitoring(
                data,
              );

              // ------------------------------------------------
              // SUBSCRIBE TO REALTIME MONITORING
              // ------------------------------------------------

              channel =
                await subscribeToMonitoring(
                  (
                    updatedData,
                  ) => {

                    if (
                      !mounted
                    ) {

                      return;
                    }

                    setMonitoring(
                      updatedData,
                    );
                  },
                );

            } catch (
              error
            ) {

              console.error(
                "Unexpected monitoring error:",
                error,
              );

              if (
                mounted
              ) {

                setMonitoring(
                  null,
                );
              }

            } finally {

              if (
                mounted
              ) {

                setLoading(
                  false,
                );
              }
            }
          };

        initializeMonitoring();

        // ======================================================
        // CLEANUP
        // ======================================================

        return () => {

          mounted =
            false;

          unsubscribeFromMonitoring(
            channel,
          );
        };

      },
      [],
    );

    return {
      monitoring,
      loading,
    };
  };

// ============================================================
// USE DEVICE STATUS HOOK
// ============================================================

export const useDeviceStatus =
  () => {

    const [
      deviceStatus,
      setDeviceStatus,
    ] = useState<DeviceStatus>(
      "Offline",
    );

    const [
      loading,
      setLoading,
    ] = useState(true);

    useEffect(
      () => {

        let mounted =
          true;

        let channel:
          | ReturnType<
              typeof supabase.channel
            >
          | null = null;

        const initializeDeviceStatus =
          async () => {

            try {

              // ------------------------------------------------
              // GET INITIAL DEVICE STATUS
              // ------------------------------------------------

              const status =
                await getDeviceStatus();

              if (
                !mounted
              ) {

                return;
              }

              setDeviceStatus(
                status,
              );

              // ------------------------------------------------
              // SUBSCRIBE TO REALTIME DEVICE STATUS
              // ------------------------------------------------

              channel =
                await subscribeToDeviceStatus(
                  (
                    updatedStatus,
                  ) => {

                    if (
                      !mounted
                    ) {

                      return;
                    }

                    setDeviceStatus(
                      updatedStatus,
                    );
                  },
                );

            } catch (
              error
            ) {

              console.error(
                "Unexpected device status error:",
                error,
              );

              if (
                mounted
              ) {

                setDeviceStatus(
                  "Offline",
                );
              }

            } finally {

              if (
                mounted
              ) {

                setLoading(
                  false,
                );
              }
            }
          };

        initializeDeviceStatus();

        // ======================================================
        // CLEANUP
        // ======================================================

        return () => {

          mounted =
            false;

          unsubscribeFromDeviceStatus(
            channel,
          );
        };

      },
      [],
    );

    return {
      deviceStatus,
      loading,
    };
  };


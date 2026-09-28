import { supabase } from "@/lib/supabase";

import type {
  MonitoringData
} from "@/services/monitoringService";
import {
  logActivity,
  type ActivityLogType,
} from "@/services/activityLogService";
import {
  classifyBatteryState,
  computeWattCap,
  parseWattageRange,
} from "@/services/recommendation";

// ============================================================
// TYPES
// ============================================================

export type NotificationType =
  "normal" |
  "alert";

export interface NotificationData {
  notif_id: string;
  user_id: string;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface NotificationRule {
  title: string;
  description: string;
  type: NotificationType;
  /**
   * Mirror severity for the activity log. Set only on rules
   * significant enough for activity history; routine
   * transitions omit it. Cooldowns apply to the mirror via
   * the notification insert gate below.
   */
  logAs?: ActivityLogType;
}

// ============================================================
// CONFIGURATION
// ============================================================
//
// These values are intentionally kept here so the notification
// rules can be adjusted without changing the monitoring table.
//
// The monitoring table itself does not define safe-load or
// safe-voltage thresholds, so those values are configurable
// rather than assumed to be database constraints.
// ============================================================

const NOTIFICATION_COOLDOWN_MS =
  10 * 60 * 1000;

const UPDATE_NOTIFICATION_COOLDOWN_MS =
  5 * 60 * 1000;

const SOLAR_INPUT_MILESTONE_WATTS =
  50;

const CURRENT_LOAD_MILESTONE_WATTS =
  50;

const STALE_MONITORING_INTERVAL_MS =
  10 * 1000;

// ------------------------------------------------------------
// OPTIONAL SAFE THRESHOLDS (DISABLED — all null)
// ------------------------------------------------------------
//
// Set a real value to enable its rule; null keeps the rule
// dormant (each check early-returns). The monitoring table
// does NOT define these thresholds.
//
//   SAFE_CURRENT_LOAD_THRESHOLD → checkHighCurrentLoad
//     ("High Current Load", alert, logs critical)
//   SAFE_BATTERY_VOLTAGE_MIN → checkBatteryVoltageTooLow
//     ("Battery Voltage Too Low", alert, logs critical)
//   SAFE_BATTERY_VOLTAGE_MAX → checkBatteryVoltageTooHigh
//     ("Battery Voltage Too High", alert, logs critical)
//
// See implementation plan/notification_catalog.md.
// ------------------------------------------------------------

const SAFE_CURRENT_LOAD_THRESHOLD:
  number | null = null;

const SAFE_BATTERY_VOLTAGE_MIN:
  number | null = null;

const SAFE_BATTERY_VOLTAGE_MAX:
  number | null = null;


// ============================================================
// INTERNAL STATE
// ============================================================

let previousMonitoring:
  MonitoringData | null = null;

let currentUserId:
  string | null = null;

let monitoringChannel:
  | ReturnType<typeof supabase.channel>
  | null = null;

let componentsChannel:
  | ReturnType<typeof supabase.channel>
  | null = null;

let staleMonitoringTimer:
  | ReturnType<typeof setInterval>
  | null = null;

let authSubscription:
  | ReturnType<
      typeof supabase.auth.onAuthStateChange
    >["data"]["subscription"]
  | null = null;

let notificationServiceStarted =
  false;

let notificationProcessing =
  false;

const notificationCooldowns =
  new Map<string, number>();

const milestoneState = {
  solarInputMilestone: 0,
  currentLoadMilestone: 0,
};


// ============================================================
// HELPER: CURRENT USER
// ============================================================

const getAuthenticatedUser =
  async () => {

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error(
        "Error getting authenticated user:",
        error.message,
      );

      return null;
    }

    if (!user) {
      return null;
    }

    return user;
  };


// ============================================================
// FETCH CURRENT MONITORING DATA
// ============================================================
//
// This follows the exact identity pattern used by
// monitoringService.ts:
//
// Supabase Auth user.id
//        ↓
// monitoring.user_id
//        ↓
// user's monitoring row
// ============================================================

export const getCurrentMonitoringData =
  async (): Promise<MonitoringData | null> => {

    const user =
      await getAuthenticatedUser();

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
        current_load,
        device_status,
        battery_temperature,
        battery_temperature_status,
        dod_status,
        solar_temperature,
        solar_temperature_status
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading monitoring data for notifications:",
        error.message,
      );

      return null;
    }

    return data as MonitoringData | null;
  };


// ============================================================
// FETCH CURRENT MONITORING DATA WITH LAST-SEEN
// ============================================================
//
// Notification logic for stale monitoring and missing
// last_seen requires the last_seen value.
//
// This function intentionally uses the monitoring table
// directly instead of relying on ChartCard.tsx.
// ============================================================

interface MonitoringNotificationData
  extends MonitoringData {
  last_seen: string | null;
}

const getCurrentMonitoringNotificationData =
  async (): Promise<
    MonitoringNotificationData | null
  > => {

    const user =
      await getAuthenticatedUser();

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
        current_load,
        device_status,
        battery_temperature,
        battery_temperature_status,
        dod_status,
        solar_temperature,
        solar_temperature_status,
        last_seen
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Error loading monitoring notification data:",
        error.message,
      );

      return null;
    }

    return data as MonitoringNotificationData | null;
  };


// ============================================================
// CREATE NOTIFICATION
// ============================================================
//
// Notifications are always assigned to the authenticated
// user's ID.
//
// This maintains:
//
// auth user.id
//      ↓
// notifications.user_id
//
// RLS also requires user_id = auth.uid().
// ============================================================

const createNotification = async (
  userId: string,
  rule: NotificationRule,
): Promise<boolean> => {

  const now = Date.now();

  const cooldownKey =
    `${userId}:${rule.type}:${rule.title}`;

  const previousNotificationTime =
    notificationCooldowns.get(
      cooldownKey,
    );

  if (
    previousNotificationTime !==
      undefined &&
    now -
      previousNotificationTime <
        NOTIFICATION_COOLDOWN_MS
  ) {
    return false;
  }

  const {
    data: existingNotification,
    error: existingError,
  } = await supabase
    .from("notifications")
    .select(
      "notif_id, created_at",
    )
    .eq(
      "user_id",
      userId,
    )
    .eq(
      "title",
      rule.title,
    )
    .eq(
      "type",
      rule.type,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    )
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error(
      "Error checking previous notification:",
      existingError.message,
    );

    return false;
  }

  if (existingNotification) {

    const lastCreatedAt =
      new Date(
        existingNotification.created_at,
      ).getTime();

    if (
      !Number.isNaN(lastCreatedAt) &&
      now -
        lastCreatedAt <
          NOTIFICATION_COOLDOWN_MS
    ) {

      notificationCooldowns.set(
        cooldownKey,
        lastCreatedAt,
      );

      return false;
    }
  }

  const {
    error: insertError,
  } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title: rule.title,
      description: rule.description,
      type: rule.type,
      read: false,
    });

  if (insertError) {
    console.error(
      `Error creating notification "${rule.title}":`,
      insertError.message,
    );

    return false;
  }

  notificationCooldowns.set(
    cooldownKey,
    now,
  );

  console.log(
    `Notification created: ${rule.title}`,
  );

  if (rule.logAs !== undefined) {
    logActivity({
      title: rule.title,
      description: rule.description,
      type: rule.logAs,
      userId,
    });
  }

  return true;
};


// ============================================================
// CREATE NOTIFICATION WITHOUT COOLDOWN
// ============================================================
//
// Used only where the service needs a special transition
// behavior and the normal cooldown mechanism should not
// interfere.
// ============================================================

const createNotificationWithCooldown =
  async (
    userId: string,
    rule: NotificationRule,
    cooldownMs: number,
  ): Promise<boolean> => {

    const now = Date.now();

    const cooldownKey =
      `${userId}:${rule.type}:${rule.title}`;

    const previousNotificationTime =
      notificationCooldowns.get(
        cooldownKey,
      );

    if (
      previousNotificationTime !==
        undefined &&
      now -
        previousNotificationTime <
          cooldownMs
    ) {
      return false;
    }

    const {
      data: existingNotification,
      error: existingError,
    } = await supabase
      .from("notifications")
      .select(
        "notif_id, created_at",
      )
      .eq(
        "user_id",
        userId,
      )
      .eq(
        "title",
        rule.title,
      )
      .eq(
        "type",
        rule.type,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "Error checking notification cooldown:",
        existingError.message,
      );

      return false;
    }

    if (existingNotification) {

      const lastCreatedAt =
        new Date(
          existingNotification.created_at,
        ).getTime();

      if (
        !Number.isNaN(lastCreatedAt) &&
        now -
          lastCreatedAt <
            cooldownMs
      ) {

        notificationCooldowns.set(
          cooldownKey,
          lastCreatedAt,
        );

        return false;
      }
    }

    const {
      error: insertError,
    } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: rule.title,
        description: rule.description,
        type: rule.type,
        read: false,
      });

    if (insertError) {
      console.error(
        `Error creating notification "${rule.title}":`,
        insertError.message,
      );

      return false;
    }

    notificationCooldowns.set(
      cooldownKey,
      now,
    );

    console.log(
      `Notification created: ${rule.title}`,
    );

    if (rule.logAs !== undefined) {
      logActivity({
        title: rule.title,
        description: rule.description,
        type: rule.logAs,
        userId,
      });
    }

    return true;
  };


// ============================================================
// NORMAL NOTIFICATION RULES
// ============================================================

// ------------------------------------------------------------
// DEVICE ONLINE
// ------------------------------------------------------------

const checkDeviceOnline = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
) => {

  if (
    current.device_status ===
      "Online" &&
    previous?.device_status !==
      "Online"
  ) {

    await createNotification(
      userId,
      {
        title: "Device Online",
        description:
          "The monitoring device status is Online.",
        type: "normal",
        logAs: "info",
      },
    );
  }
};


// ------------------------------------------------------------
// DEVICE OFFLINE
// ------------------------------------------------------------
//
// This normal notification represents an explicit transition
// from Online to Offline.
//
// A separate alert is generated when the monitoring data is
// stale or last_seen is missing.
// ------------------------------------------------------------

const checkDeviceOffline = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
) => {

  if (
    current.device_status ===
      "Offline" &&
    previous?.device_status ===
      "Online"
  ) {

    await createNotification(
      userId,
      {
        title: "Device Offline",
        description:
          "The monitoring device status is Offline.",
        type: "normal",
        logAs: "critical",
      },
    );
  }
};


// ------------------------------------------------------------
// BATTERY CHARGING
// ------------------------------------------------------------

const checkBatteryCharging = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
) => {

  if (
    current.battery_status ===
      "Charging" &&
    previous?.battery_status !==
      "Charging"
  ) {

    await createNotification(
      userId,
      {
        title: "Battery Charging",
        description:
          "The battery status is Charging.",
        type: "normal",
      },
    );
  }
};


// ------------------------------------------------------------
// BATTERY DISCHARGING
// ------------------------------------------------------------

const checkBatteryDischarging = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
) => {

  if (
    current.battery_status ===
      "Discharging" &&
    previous?.battery_status !==
      "Discharging"
  ) {

    await createNotification(
      userId,
      {
        title: "Battery Discharging",
        description:
          "The battery status is Discharging.",
        type: "normal",
      },
    );
  }
};


// ------------------------------------------------------------
// BATTERY IDLE
// ------------------------------------------------------------

const checkBatteryIdle = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
) => {

  if (
    current.battery_status ===
      "Idle" &&
    previous?.battery_status !==
      "Idle"
  ) {

    await createNotification(
      userId,
      {
        title: "Battery Idle",
        description:
          "The battery status is Idle.",
        type: "normal",
      },
    );
  }
};


// ------------------------------------------------------------
// BATTERY FULLY CHARGED
// ------------------------------------------------------------
//
// 100% is NORMAL.
//
// It fires when the battery reaches 100% from a lower level.
// ------------------------------------------------------------

const checkBatteryFullyCharged =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_level ===
        100 &&
      previous !== null &&
      previous.battery_level <
        100
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Fully Charged",
          description:
            "The battery level is 100%.",
          type: "normal",
          logAs: "info",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY LEVEL UPDATED
// ------------------------------------------------------------
//
// This is intentionally cooldown-protected because the ESP32
// can update the battery level repeatedly.
// ------------------------------------------------------------

const checkBatteryLevelUpdated =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      current.battery_level !==
        previous.battery_level
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Battery Level Updated",
          description:
            `The battery level has been updated with the latest percentage value from ${current.battery_level}%.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// BATTERY TEMPERATURE STATUS
// ------------------------------------------------------------

const checkBatteryTemperatureStatus =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (previous === null) {
      return;
    }

    if (
      current.battery_temperature_status ===
        "Nominal" &&
      previous.battery_temperature_status !==
        "Nominal"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Temperature Nominal",
          description:
            "The battery temperature status is Nominal.",
          type: "normal",
        },
      );
    }

    if (
      current.battery_temperature_status ===
        "Elevated" &&
      previous.battery_temperature_status !==
        "Elevated"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Temperature Elevated",
          description:
            "The battery temperature status is Elevated.",
          type: "normal",
        },
      );
    }

    if (
      current.battery_temperature_status ===
        "High" &&
      previous.battery_temperature_status !==
        "High"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Temperature High",
          description:
            "The battery temperature status is High. This is a normal status according to your notification rules.",
          type: "normal",
        },
      );
    }

    if (
      current.battery_temperature_status ===
        "Critical" &&
      previous.battery_temperature_status !==
        "Critical"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Temperature Critical",
          description:
            "The battery temperature status is Critical.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// SOLAR TEMPERATURE STATUS
// ------------------------------------------------------------

const checkSolarTemperatureStatus =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (previous === null) {
      return;
    }

    if (
      current.solar_temperature_status ===
        "Nominal" &&
      previous.solar_temperature_status !==
        "Nominal"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Temperature Nominal",
          description:
            "The solar temperature status is Nominal.",
          type: "normal",
        },
      );
    }

    if (
      current.solar_temperature_status ===
        "Elevated" &&
      previous.solar_temperature_status !==
        "Elevated"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Temperature Elevated",
          description:
            "The solar temperature status is Elevated.",
          type: "normal",
        },
      );
    }

    if (
      current.solar_temperature_status ===
        "High" &&
      previous.solar_temperature_status !==
        "High"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Temperature High",
          description:
            "The solar temperature status is High. This is a normal status according to your notification rules.",
          type: "normal",
        },
      );
    }

    if (
      current.solar_temperature_status ===
        "Critical" &&
      previous.solar_temperature_status !==
        "Critical"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Temperature Critical",
          description:
            "The solar temperature status is Critical.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// SOLAR STATUS
// ------------------------------------------------------------

const checkSolarStatus = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
) => {

  if (previous === null) {
    return;
  }

  if (
    current.solar_status !==
    previous.solar_status
  ) {

    const description =
      current.solar_status ===
        "Low"
        ? "The solar status is Low."
        : current.solar_status ===
            "Moderate"
          ? "The solar status is Moderate."
          : "The solar status is High.";

    await createNotification(
      userId,
      {
        title:
          `Solar Input ${current.solar_status}`,
        description,
        type: "normal",
      },
    );

    await createNotificationWithCooldown(
      userId,
      {
        title:
          "Solar Status Changed",
        description:
          `The solar_status changed to ${current.solar_status}.`,
        type: "normal",
      },
      UPDATE_NOTIFICATION_COOLDOWN_MS,
    );
  }
};


// ------------------------------------------------------------
// SOLAR INPUT DETECTED / NO SOLAR INPUT
// ------------------------------------------------------------

const checkSolarInputState =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (previous === null) {
      return;
    }

    if (
      previous.solar_input <= 0 &&
      current.solar_input > 0
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Input Detected",
          description:
            "The solar_input value is greater than zero.",
          type: "normal",
        },
      );
    }

    if (
      previous.solar_input > 0 &&
      current.solar_input === 0
    ) {

      await createNotification(
        userId,
        {
          title:
            "No Solar Input",
          description:
            "The solar_input value is zero.",
          type: "normal",
        },
      );
    }
  };


// ------------------------------------------------------------
// SOLAR INPUT MILESTONES
// ------------------------------------------------------------
//
// Example:
//
// 0 W → 50 W
// 50 W → 100 W
// 100 W → 150 W
//
// A notification is created when a higher 50 W milestone
// is reached.
// ------------------------------------------------------------

const checkSolarInputMilestone =
  async (
    userId: string,
    current: MonitoringData,
  ) => {

    const currentMilestone =
      Math.floor(
        current.solar_input /
          SOLAR_INPUT_MILESTONE_WATTS,
      ) *
      SOLAR_INPUT_MILESTONE_WATTS;

    if (
      currentMilestone <= 0
    ) {

      milestoneState.solarInputMilestone =
        0;

      return;
    }

    if (
      currentMilestone >
      milestoneState.solarInputMilestone
    ) {

      milestoneState.solarInputMilestone =
        currentMilestone;

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Solar Input Increased",
          description:
            `The solar input increased to ${current.solar_input} W and reached the ${currentMilestone} W milestone.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// CURRENT LOAD DETECTED / NO CURRENT LOAD
// ------------------------------------------------------------

const checkCurrentLoadState =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (previous === null) {
      return;
    }

    if (
      previous.current_load <= 0 &&
      current.current_load > 0
    ) {

      await createNotification(
        userId,
        {
          title:
            "Current Load Detected",
          description:
            "The current_load value is greater than zero.",
          type: "normal",
        },
      );
    }

    if (
      previous.current_load > 0 &&
      current.current_load === 0
    ) {

      await createNotification(
        userId,
        {
          title:
            "No Current Load",
          description:
            "The current_load value is zero.",
          type: "normal",
        },
      );
    }
  };


// ------------------------------------------------------------
// CURRENT LOAD MILESTONES
// ------------------------------------------------------------

const checkCurrentLoadMilestone =
  async (
    userId: string,
    current: MonitoringData,
  ) => {

    const currentMilestone =
      Math.floor(
        current.current_load /
          CURRENT_LOAD_MILESTONE_WATTS,
      ) *
      CURRENT_LOAD_MILESTONE_WATTS;

    if (
      currentMilestone <= 0
    ) {

      milestoneState.currentLoadMilestone =
        0;

      return;
    }

    if (
      currentMilestone >
      milestoneState.currentLoadMilestone
    ) {

      milestoneState.currentLoadMilestone =
        currentMilestone;

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Power Consumption Increased",
          description:
            `The current load increased to ${current.current_load} W and reached the ${currentMilestone} W milestone.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// BATTERY VOLTAGE UPDATED
// ------------------------------------------------------------

const checkBatteryVoltageUpdated =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      current.voltage !==
        previous.voltage
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Battery Voltage Updated",
          description:
            `The battery voltage value has been updated to ${current.voltage} V.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// BATTERY RUNTIME UPDATED
// ------------------------------------------------------------

const checkBatteryRuntimeUpdated =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      current.time_remaining !==
        previous.time_remaining
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Battery Runtime Updated",
          description:
            `The time_remaining value has been updated to ${current.time_remaining}.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// WATT-HOURS UPDATED
// ------------------------------------------------------------

const checkWattHoursUpdated =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      current.watt_hours !==
        previous.watt_hours
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Watt-Hours Updated",
          description:
            `The watt_hours value has been updated to ${current.watt_hours} Wh.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// DEPTH OF DISCHARGE SAFE
// ------------------------------------------------------------

const checkDepthOfDischarge =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (previous === null) {
      return;
    }

    // dod_status is binary (Safe | Unsafe), so any arrival
    // at Safe comes from Unsafe: only the transition-accurate
    // title fires (the generic "Safe" title was a duplicate).
    if (
      current.dod_status ===
        "Safe" &&
      previous.dod_status ===
        "Unsafe"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Depth of Discharge Returned to Safe",
          description:
            "The dod_status value changed from Unsafe to Safe.",
          type: "normal",
        },
      );
    }

    if (
      current.dod_status ===
        "Unsafe" &&
      previous.dod_status !==
        "Unsafe"
    ) {

      await createNotification(
        userId,
        {
          title:
            "Unsafe Depth of Discharge",
          description:
            "The dod_status value is Unsafe.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// APPLIANCES BECAME ADVISABLE
// ------------------------------------------------------------
//
// Fires when the battery tier recovers to Safe while the
// user still has selected appliances waiting. Tier comes
// from the shared recommendation engine so the rule and
// the UI verdicts can never disagree.
// ------------------------------------------------------------

const checkAppliancesBecameAdvisable = async (
  userId: string,
  current: MonitoringData,
  previous: MonitoringData | null,
): Promise<void> => {

  if (previous === null) {
    return;
  }

  const toTier = (row: MonitoringData): string =>
    classifyBatteryState({
      soc: row.battery_level,
      voltage: row.voltage,
      remainingWh: row.watt_hours,
      dod: row.dod_status,
    }).tier;

  if (
    toTier(previous) === "Safe" ||
    toTier(current) !== "Safe"
  ) {
    return;
  }

  const { count, error } = await supabase
    .from("appliances")
    .select("app_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("selection", true);

  if (error) {
    console.error(
      "Appliances-became-advisable check error:",
      error.message,
    );

    return;
  }

  if ((count ?? 0) <= 0) {
    return;
  }

  await createNotification(
    userId,
    {
      title: "Appliances Became Advisable",
      description:
        "The battery recovered to a safe level. Selected appliances are advisable again.",
      type: "normal",
      logAs: "info",
    },
  );
};


// ------------------------------------------------------------
// HIGH LOAD WHILE BATTERY LOW
// ------------------------------------------------------------
//
// Compares the combined mid-wattage of selected appliances
// against the charge-scaled safe cap while SoC is at or
// below the 20% cutoff. The 10-minute notification cooldown
// protects against refires while the condition persists.
// ------------------------------------------------------------

const checkHighLoadWhileBatteryLow = async (
  userId: string,
  current: MonitoringData,
): Promise<void> => {

  const level = current.battery_level ?? 0;

  if (level > 20) {
    return;
  }

  const { data, error } = await supabase
    .from("appliances")
    .select("wattage")
    .eq("user_id", userId)
    .eq("selection", true);

  if (error) {
    console.error(
      "High-load-while-low check error:",
      error.message,
    );

    return;
  }

  const combinedMidWatts = (data ?? []).reduce(
    (total, row) =>
      total +
      (parseWattageRange(row.wattage)?.mid ?? 0),
    0,
  );

  if (combinedMidWatts <= 0) {
    return;
  }

  const safeCap = Math.round(
    computeWattCap(level),
  );

  if (combinedMidWatts <= safeCap) {
    return;
  }

  await createNotification(
    userId,
    {
      title: "High Load While Battery Low",
      description:
        `Selected appliances draw about ${combinedMidWatts}W against a ${safeCap}W safe cap at ${level}% battery.`,
      type: "alert",
      logAs: "critical",
    },
  );
};


// ------------------------------------------------------------
// BATTERY STATUS CHANGED
// ------------------------------------------------------------

const checkBatteryStatusChanged =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      current.battery_status !==
        previous.battery_status
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Battery Status Changed",
          description:
            `The battery_status changed to ${current.battery_status}.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// DEVICE STATUS CHANGED
// ------------------------------------------------------------

const checkDeviceStatusChanged =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      current.device_status !==
        previous.device_status
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Device Status Changed",
          description:
            `The device_status changed to ${current.device_status}.`,
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ------------------------------------------------------------
// MONITORING DATA UPDATED
// ------------------------------------------------------------
//
// This is intentionally broad and cooldown-protected.
// It will not create a notification for every ESP32
// heartbeat.
// ------------------------------------------------------------

const checkMonitoringDataUpdated =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      previous !== null &&
      JSON.stringify(current) !==
        JSON.stringify(previous)
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Monitoring Data Updated",
          description:
            "A monitoring record has been updated for the user.",
          type: "normal",
        },
        UPDATE_NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ============================================================
// ALERT NOTIFICATION RULES
// ============================================================

// ------------------------------------------------------------
// BATTERY LEVEL AT RECOMMENDED CUTOFF
// ------------------------------------------------------------
//
// 20% or lower = approximately 80% DoD.
//
// This is an ALERT.
//
// IMPORTANT:
// This rule intentionally does NOT require the previous
// battery level to be above 20%.
//
// The notification itself is protected by the normal
// 10-minute cooldown.
//
// Therefore:
//
// 25% → 20%
// 50% → 20%
// 30% → 15%
// service starts at 20%
//
// can all trigger the alert.
//
// Repeated ESP32 updates while remaining at 20% or lower
// will not create notification storms because the cooldown
// prevents repeated inserts.
// ------------------------------------------------------------

const checkBatteryRecommendedCutoff =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_level <= 20
    ) {

      console.log(
        "Battery cutoff condition detected:",
        {
          currentBatteryLevel:
            current.battery_level,
          previousBatteryLevel:
            previous?.battery_level ??
            null,
        },
      );

      await createNotification(
        userId,
        {
          title:
            "Battery Level at Recommended Cutoff",
          description:
            "The battery level is 20% or lower, meaning approximately 80% DoD has been reached. This is the recommended normal-use cutoff and the battery should be recharged.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY DISCHARGING AT LOW LEVEL
// ------------------------------------------------------------

const checkBatteryDischargingAtLowLevel =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_level <=
        20 &&
      current.battery_status ===
        "Discharging" &&
      (
        previous === null ||
        previous.battery_level >
          20 ||
        previous.battery_status !==
          "Discharging"
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Discharging at Low Level",
          description:
            "The battery level is at or below 20% while the battery status is Discharging.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY DISCHARGING WITH UNSAFE DOD
// ------------------------------------------------------------

const checkBatteryDischargingWithUnsafeDoD =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_status ===
        "Discharging" &&
      current.dod_status ===
        "Unsafe" &&
      (
        previous === null ||
        previous.battery_status !==
          "Discharging" ||
        previous.dod_status !==
          "Unsafe"
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Discharging with Unsafe DoD",
          description:
            "The battery status is Discharging while dod_status is Unsafe.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY RUNTIME DEPLETED
// ------------------------------------------------------------

const checkBatteryRuntimeDepleted =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.time_remaining ===
        "0h 00m" &&
      (
        previous === null ||
        previous.time_remaining !==
          "0h 00m"
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Runtime Depleted",
          description:
            "The time_remaining value is 0h 00m.",
          type: "alert",
          logAs: "warning",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY VOLTAGE ZERO
// ------------------------------------------------------------

const checkBatteryVoltageZero =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.voltage === 0 &&
      (
        previous === null ||
        previous.voltage !==
          0
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Voltage Reading Zero",
          description:
            "The voltage value is 0. This may indicate a disconnected sensor, unavailable reading, or battery measurement problem.",
          type: "alert",
          logAs: "error",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY TEMPERATURE ZERO
// ------------------------------------------------------------

const checkBatteryTemperatureZero =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_temperature ===
        0 &&
      (
        previous === null ||
        previous.battery_temperature !==
          0
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Temperature Reading Zero",
          description:
            "The battery_temperature value is 0. This may indicate a missing or invalid temperature reading, depending on your sensor setup.",
          type: "alert",
          logAs: "error",
        },
      );
    }
  };


// ------------------------------------------------------------
// SOLAR TEMPERATURE ZERO
// ------------------------------------------------------------

const checkSolarTemperatureZero =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.solar_temperature ===
        0 &&
      (
        previous === null ||
        previous.solar_temperature !==
          0
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Temperature Reading Zero",
          description:
            "The solar_temperature value is 0. This may indicate a missing or invalid temperature reading, depending on your sensor setup.",
          type: "alert",
          logAs: "error",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY CHARGING NOT DETECTED
// ------------------------------------------------------------
//
// This is evaluated when the battery is below 100% and
// is not Charging while solar input indicates that charging
// may reasonably be expected.
// ------------------------------------------------------------

const checkBatteryChargingNotDetected =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_level <
        100 &&
      current.battery_status !==
        "Charging" &&
      current.solar_input > 0 &&
      (
        previous === null ||
        previous.battery_status ===
          "Charging" ||
        previous.solar_input <=
          0
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Charging Not Detected",
          description:
            "The battery level is below 100%, but the battery status is not Charging when charging is expected.",
          type: "alert",
          logAs: "warning",
        },
      );
    }
  };


// ------------------------------------------------------------
// SOLAR INPUT UNAVAILABLE
// ------------------------------------------------------------
//
// This is only treated as an alert when the battery is
// Charging, because the provided rule says solar charging
// is expected in that condition.
// ------------------------------------------------------------

const checkSolarInputUnavailable =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.solar_input ===
        0 &&
      current.battery_status ===
        "Charging" &&
      (
        previous === null ||
        previous.solar_input > 0 ||
        previous.battery_status !==
          "Charging"
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Solar Input Unavailable",
          description:
            "The solar_input value is 0 while solar charging is expected.",
          type: "alert",
          logAs: "warning",
        },
      );
    }
  };


// ------------------------------------------------------------
// LOW SOLAR INPUT DURING CHARGING
// ------------------------------------------------------------

const checkLowSolarInputDuringCharging =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      current.battery_status ===
        "Charging" &&
      current.solar_status ===
        "Low" &&
      (
        previous === null ||
        previous.battery_status !==
          "Charging" ||
        previous.solar_status !==
          "Low"
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Low Solar Input During Charging",
          description:
            "The battery status is Charging, but the solar status is Low.",
          type: "alert",
          logAs: "warning",
        },
      );
    }
  };


// ------------------------------------------------------------
// HIGH CURRENT LOAD
// ------------------------------------------------------------
//
// Disabled until the actual safe current-load threshold
// has been configured.
// ------------------------------------------------------------

const checkHighCurrentLoad =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      SAFE_CURRENT_LOAD_THRESHOLD ===
        null
    ) {
      return;
    }

    if (
      current.current_load >
        SAFE_CURRENT_LOAD_THRESHOLD &&
      (
        previous === null ||
        previous.current_load <=
          SAFE_CURRENT_LOAD_THRESHOLD
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "High Current Load",
          description:
            "The current_load value is above your configured safe load threshold.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY VOLTAGE TOO LOW
// ------------------------------------------------------------
//
// Disabled until SAFE_BATTERY_VOLTAGE_MIN is configured.
// ------------------------------------------------------------

const checkBatteryVoltageTooLow =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      SAFE_BATTERY_VOLTAGE_MIN ===
        null
    ) {
      return;
    }

    if (
      current.voltage <
        SAFE_BATTERY_VOLTAGE_MIN &&
      (
        previous === null ||
        previous.voltage >=
          SAFE_BATTERY_VOLTAGE_MIN
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Voltage Too Low",
          description:
            "The voltage value is below your configured safe battery-voltage threshold.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// BATTERY VOLTAGE TOO HIGH
// ------------------------------------------------------------
//
// Disabled until SAFE_BATTERY_VOLTAGE_MAX is configured.
// ------------------------------------------------------------

const checkBatteryVoltageTooHigh =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      SAFE_BATTERY_VOLTAGE_MAX ===
        null
    ) {
      return;
    }

    if (
      current.voltage >
        SAFE_BATTERY_VOLTAGE_MAX &&
      (
        previous === null ||
        previous.voltage <=
          SAFE_BATTERY_VOLTAGE_MAX
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Voltage Too High",
          description:
            "The voltage value is above your configured safe battery-voltage threshold.",
          type: "alert",
          logAs: "critical",
        },
      );
    }
  };


// ------------------------------------------------------------
// INVALID TIME REMAINING
// ------------------------------------------------------------
//
// The database only requires non-whitespace text.
// Therefore, this service performs basic validation without
// assuming a particular runtime calculation format beyond
// the expected "0h 00m" style.
// ------------------------------------------------------------

const isValidTimeRemaining =
  (
    value: string,
  ): boolean => {

    if (
      typeof value !==
        "string" ||
      value.trim().length ===
        0
    ) {
      return false;
    }

    const pattern =
      /^\d+h\s+\d{2}m$/;

    return pattern.test(
      value.trim(),
    );
  };


const checkInvalidTimeRemaining =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      !isValidTimeRemaining(
        current.time_remaining,
      )
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Invalid Time Remaining",
          description:
            "The time_remaining field is empty or contains an invalid value.",
          type: "alert",
          logAs: "warning",
        },
        NOTIFICATION_COOLDOWN_MS,
      );

      return;
    }

    if (
      previous !== null &&
      !isValidTimeRemaining(
        previous.time_remaining,
      )
    ) {

      await createNotification(
        userId,
        {
          title:
            "Battery Runtime Updated",
          description:
            `The time_remaining value has been updated to ${current.time_remaining}.`,
          type: "normal",
        },
      );
    }
  };


// ============================================================
// PROCESS ALL MONITORING RULES
// ============================================================

const processMonitoringNotifications =
  async (
    userId: string,
    current: MonitoringData,
    previous: MonitoringData | null,
  ) => {

    if (
      notificationProcessing
    ) {
      console.warn(
        "Notification processing already in progress. Skipping overlapping monitoring event.",
      );

      return;
    }

    notificationProcessing =
      true;

    try {

      // --------------------------------------------------------
      // NORMAL RULES
      // --------------------------------------------------------

      await checkDeviceOnline(
        userId,
        current,
        previous,
      );

      await checkDeviceOffline(
        userId,
        current,
        previous,
      );

      await checkBatteryCharging(
        userId,
        current,
        previous,
      );

      await checkBatteryDischarging(
        userId,
        current,
        previous,
      );

      await checkBatteryIdle(
        userId,
        current,
        previous,
      );

      await checkBatteryFullyCharged(
        userId,
        current,
        previous,
      );

      await checkBatteryLevelUpdated(
        userId,
        current,
        previous,
      );

      await checkBatteryTemperatureStatus(
        userId,
        current,
        previous,
      );

      await checkSolarTemperatureStatus(
        userId,
        current,
        previous,
      );

      await checkSolarStatus(
        userId,
        current,
        previous,
      );

      await checkSolarInputState(
        userId,
        current,
        previous,
      );

      await checkSolarInputMilestone(
        userId,
        current,
      );

      await checkCurrentLoadState(
        userId,
        current,
        previous,
      );

      await checkCurrentLoadMilestone(
        userId,
        current,
      );

      await checkBatteryVoltageUpdated(
        userId,
        current,
        previous,
      );

      await checkBatteryRuntimeUpdated(
        userId,
        current,
        previous,
      );

      await checkWattHoursUpdated(
        userId,
        current,
        previous,
      );

      await checkDepthOfDischarge(
        userId,
        current,
        previous,
      );

      await checkBatteryStatusChanged(
        userId,
        current,
        previous,
      );

      await checkDeviceStatusChanged(
        userId,
        current,
        previous,
      );

      await checkMonitoringDataUpdated(
        userId,
        current,
        previous,
      );


      // --------------------------------------------------------
      // ALERT RULES
      // --------------------------------------------------------

      await checkBatteryRecommendedCutoff(
        userId,
        current,
        previous,
      );

      await checkBatteryDischargingAtLowLevel(
        userId,
        current,
        previous,
      );

      await checkBatteryDischargingWithUnsafeDoD(
        userId,
        current,
        previous,
      );

      await checkBatteryRuntimeDepleted(
        userId,
        current,
        previous,
      );

      await checkBatteryVoltageZero(
        userId,
        current,
        previous,
      );

      await checkBatteryTemperatureZero(
        userId,
        current,
        previous,
      );

      await checkSolarTemperatureZero(
        userId,
        current,
        previous,
      );

      await checkBatteryChargingNotDetected(
        userId,
        current,
        previous,
      );

      await checkSolarInputUnavailable(
        userId,
        current,
        previous,
      );

      await checkLowSolarInputDuringCharging(
        userId,
        current,
        previous,
      );

      await checkHighCurrentLoad(
        userId,
        current,
        previous,
      );

      await checkBatteryVoltageTooLow(
        userId,
        current,
        previous,
      );

      await checkBatteryVoltageTooHigh(
        userId,
        current,
        previous,
      );

      await checkInvalidTimeRemaining(
        userId,
        current,
        previous,
      );

      await checkAppliancesBecameAdvisable(
        userId,
        current,
        previous,
      );

      await checkHighLoadWhileBatteryLow(
        userId,
        current,
      );

    } catch (error) {

      console.error(
        "Unexpected notification processing error:",
        error,
      );

    } finally {

      notificationProcessing =
        false;
    }
  };


// ============================================================
// HANDLE MONITORING UPDATE
// ============================================================

const handleMonitoringUpdate =
  async (
    monitoringData:
      MonitoringNotificationData,
  ) => {

    if (!currentUserId) {
      return;
    }

    const currentMonitoring =
      monitoringData as MonitoringData;

    const previousMonitoringState =
      previousMonitoring;

    // ----------------------------------------------------------
    // UPDATE THE BASELINE BEFORE PROCESSING
    // ----------------------------------------------------------
    //
    // This ensures that the newest Realtime event becomes the
    // known monitoring state immediately.
    // ----------------------------------------------------------

    previousMonitoring =
      currentMonitoring;

    console.log(
      "Monitoring update received by notification service:",
      {
        userId:
          currentUserId,
        batteryLevel:
          currentMonitoring.battery_level,
        batteryStatus:
          currentMonitoring.battery_status,
        deviceStatus:
          currentMonitoring.device_status,
        solarInput:
          currentMonitoring.solar_input,
        currentLoad:
          currentMonitoring.current_load,
      },
    );

    await processMonitoringNotifications(
      currentUserId,
      currentMonitoring,
      previousMonitoringState,
    );
  };


// ============================================================
// CHECK MISSING MONITORING RECORD
// ============================================================

const checkMonitoringRecordMissing =
  async (
    userId: string,
  ) => {

    const data =
      await getCurrentMonitoringNotificationData();

    if (data !== null) {
      return;
    }

    await createNotificationWithCooldown(
      userId,
      {
          title:
            "Monitoring Record Missing",
          description:
            "No monitoring record is available for the user.",
          type: "alert",
          logAs: "error",
      },
      NOTIFICATION_COOLDOWN_MS,
    );
  };


// ============================================================
// CHECK LAST-SEEN STATUS
// ============================================================

const checkLastSeenStatus =
  async (
    userId: string,
  ) => {

    const data =
      await getCurrentMonitoringNotificationData();

    if (data === null) {

      await checkMonitoringRecordMissing(
        userId,
      );

      return;
    }

    // ----------------------------------------------------------
    // MISSING LAST-SEEN TIMESTAMP
    // ----------------------------------------------------------

    if (
      data.last_seen ===
        null
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Missing Last-Seen Timestamp",
          description:
            "The last_seen value is null.",
          type: "alert",
          logAs: "error",
        },
        NOTIFICATION_COOLDOWN_MS,
      );

      return;
    }

    // ----------------------------------------------------------
    // INVALID LAST-SEEN TIMESTAMP
    // ----------------------------------------------------------

    const lastSeenTime =
      new Date(
        data.last_seen,
      ).getTime();

    if (
      Number.isNaN(
        lastSeenTime,
      )
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Monitoring Data Stale",
          description:
            "The last_seen timestamp is invalid or older than the allowed monitoring interval.",
          type: "alert",
          logAs: "error",
        },
        NOTIFICATION_COOLDOWN_MS,
      );

      return;
    }

    // ----------------------------------------------------------
    // STALE MONITORING
    // ----------------------------------------------------------

    const elapsed =
      Date.now() -
      lastSeenTime;

    if (
      elapsed >
      STALE_MONITORING_INTERVAL_MS
    ) {

      await createNotificationWithCooldown(
        userId,
        {
          title:
            "Monitoring Data Stale",
          description:
            "The last_seen timestamp is older than the allowed monitoring interval.",
          type: "alert",
          logAs: "error",
        },
        NOTIFICATION_COOLDOWN_MS,
      );
    }
  };


// ============================================================
// START STALE MONITORING CHECK
// ============================================================

const startStaleMonitoringCheck =
  (
    userId: string,
  ) => {

    if (
      staleMonitoringTimer
    ) {

      clearInterval(
        staleMonitoringTimer,
      );
    }

    staleMonitoringTimer =
      setInterval(
        () => {

          checkLastSeenStatus(
            userId,
          ).catch(
            (error) => {

              console.error(
                "Error checking monitoring freshness:",
                error,
              );
            },
          );

        },
        STALE_MONITORING_INTERVAL_MS,
      );
  };


// ============================================================
// STOP STALE MONITORING CHECK
// ============================================================

const stopStaleMonitoringCheck =
  () => {

    if (
      staleMonitoringTimer
    ) {

      clearInterval(
        staleMonitoringTimer,
      );

      staleMonitoringTimer =
        null;
    }
  };


// ============================================================
// RESET INTERNAL STATE
// ============================================================

const resetNotificationState =
  () => {

    previousMonitoring =
      null;

    currentUserId =
      null;

    notificationProcessing =
      false;

    notificationCooldowns.clear();

    milestoneState.solarInputMilestone =
      0;

    milestoneState.currentLoadMilestone =
      0;
  };


// ============================================================
// UNSUBSCRIBE FROM MONITORING
// ============================================================

export const unsubscribeFromNotificationMonitoring =
  async () => {

    if (
      monitoringChannel
    ) {

      await supabase.removeChannel(
        monitoringChannel,
      );

    monitoringChannel =
      null;
    }

    await stopComponentsNotificationWatcher();

    stopStaleMonitoringCheck();

    resetNotificationState();
  };


// ============================================================
// COMPONENT STATUS RULES
// ============================================================
//
// Components change independently of monitoring rows, so
// they get their own watcher on the components table.
// Titles stay fixed (live names go in description) so
// cooldown keys and activity mirrors stay stable.
//
// Critical-component set: power-path hardware whose failure
// threatens the system (matches the hardware list).
// ============================================================

const CRITICAL_COMPONENTS: readonly string[] = [
  "Relay",
  "INA228",
  "Voltage Sensor",
];

interface ComponentStatusPayload {
  component_name?: string;
  status?: string;
}

const checkComponentStatusTransition = async (
  userId: string,
  previous: ComponentStatusPayload | null,
  current: ComponentStatusPayload,
): Promise<void> => {

  const previousStatus = previous?.status;
  const currentStatus = current.status;
  const componentName =
    current.component_name ?? "Component";

  if (
    previousStatus === "Active" &&
    currentStatus === "Inactive"
  ) {

    const critical =
      CRITICAL_COMPONENTS.includes(
        componentName,
      );

    await createNotification(
      userId,
      {
        title: "Component Went Inactive",
        description:
          `${componentName} changed from Active to Inactive.`,
        type: "alert",
        logAs: critical
          ? "critical"
          : "warning",
      },
    );

    return;
  }

  if (
    previousStatus === "Inactive" &&
    currentStatus === "Active"
  ) {

    await createNotification(
      userId,
      {
        title: "Component Back Online",
        description:
          `${componentName} changed from Inactive to Active.`,
        type: "normal",
        logAs: "info",
      },
    );
  }
};

const startComponentsNotificationWatcher =
  async (
    userId: string,
  ): Promise<void> => {

    if (componentsChannel) {
      await supabase.removeChannel(
        componentsChannel,
      );

      componentsChannel =
        null;
    }

    componentsChannel =
      supabase
        .channel(
          `notification-components-${userId}-${Date.now()}`,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "components",
            filter:
              `user_id=eq.${userId}`,
          },
          async (payload) => {

            const previous =
              payload.old as ComponentStatusPayload | null;

            const current =
              payload.new as ComponentStatusPayload;

            if (!current) {
              return;
            }

            await checkComponentStatusTransition(
              userId,
              previous,
              current,
            );
          },
        )
        .subscribe(
          (status) => {

            if (
              status ===
                "SUBSCRIBED"
            ) {

              console.log(
                "Notification service components watcher subscribed.",
              );
            }

            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT" ||
              status ===
                "CLOSED"
            ) {

              console.warn(
                "Notification service components channel issue:",
                status,
              );
            }
          },
        );
  };

const stopComponentsNotificationWatcher =
  async (): Promise<void> => {

    if (
      componentsChannel
    ) {

      await supabase.removeChannel(
        componentsChannel,
      );

      componentsChannel =
        null;
    }
  };


// ============================================================
// START MONITORING NOTIFICATION WATCHER
// ============================================================

export const startMonitoringNotificationWatcher =
  async () => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      console.warn(
        "Notification service could not start because there is no authenticated user.",
      );

      return null;
    }

    // ----------------------------------------------------------
    // PREVENT DUPLICATE CHANNEL FOR SAME USER
    // ----------------------------------------------------------

    if (
      monitoringChannel &&
      currentUserId ===
        user.id
    ) {

      return monitoringChannel;
    }

    // ----------------------------------------------------------
    // REMOVE PREVIOUS CHANNEL IF USER CHANGED
    // ----------------------------------------------------------

    if (
      monitoringChannel
    ) {

      await supabase.removeChannel(
        monitoringChannel,
      );

      monitoringChannel =
        null;
    }

    stopStaleMonitoringCheck();

    resetNotificationState();

    currentUserId =
      user.id;

    // ----------------------------------------------------------
    // GET INITIAL MONITORING DATA
    // ----------------------------------------------------------

    const initialMonitoring =
      await getCurrentMonitoringNotificationData();

    if (
      initialMonitoring ===
        null
    ) {

      await checkMonitoringRecordMissing(
        user.id,
      );

    } else {

      // --------------------------------------------------------
      // INITIAL STATE
      // --------------------------------------------------------
      //
      // The initial state is stored as the baseline.
      //
      // Unlike the previous implementation, the battery cutoff
      // condition is also checked immediately. This means that
      // if the service starts while the battery is already at
      // 20% or lower, the alert can still be generated.
      //
      // The normal notification cooldown prevents repeated
      // notifications from ESP32 heartbeat updates.
      // --------------------------------------------------------

      previousMonitoring =
        initialMonitoring as MonitoringData;

      milestoneState.solarInputMilestone =
        Math.floor(
          initialMonitoring.solar_input /
            SOLAR_INPUT_MILESTONE_WATTS,
        ) *
        SOLAR_INPUT_MILESTONE_WATTS;

      milestoneState.currentLoadMilestone =
        Math.floor(
          initialMonitoring.current_load /
            CURRENT_LOAD_MILESTONE_WATTS,
        ) *
        CURRENT_LOAD_MILESTONE_WATTS;

      // --------------------------------------------------------
      // CHECK BATTERY CUTOFF ON INITIAL LOAD
      // --------------------------------------------------------
      //
      // This specifically ensures that a manually entered
      // battery value of 20% or lower is recognized even when
      // the notification service was started after the value
      // was already changed.
      // --------------------------------------------------------

      await checkBatteryRecommendedCutoff(
        user.id,
        initialMonitoring as MonitoringData,
        null,
      );
    }

    // ----------------------------------------------------------
    // START LAST-SEEN MONITORING
    // ----------------------------------------------------------

    startStaleMonitoringCheck(
      user.id,
    );

    // ----------------------------------------------------------
    // SUBSCRIBE TO USER'S MONITORING ROW
    // ----------------------------------------------------------

    monitoringChannel =
      supabase
        .channel(
          `notification-monitoring-${user.id}-${Date.now()}`,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "monitoring",
            filter:
              `user_id=eq.${user.id}`,
          },
          async (payload) => {

            const updatedData =
              payload.new as MonitoringNotificationData;

            console.log(
              "Notification service received monitoring Realtime UPDATE:",
              {
                batteryLevel:
                  updatedData.battery_level,
                batteryStatus:
                  updatedData.battery_status,
                deviceStatus:
                  updatedData.device_status,
              },
            );

            await handleMonitoringUpdate(
              updatedData,
            );
          },
        )
        .subscribe(
          (status) => {

            if (
              status ===
              "SUBSCRIBED"
            ) {

              console.log(
                "Notification service monitoring watcher subscribed.",
              );
            }

            if (
              status ===
              "CHANNEL_ERROR"
            ) {

              console.warn(
                "Notification service Realtime channel error.",
              );
            }

            if (
              status ===
              "TIMED_OUT"
            ) {

              console.warn(
                "Notification service Realtime connection timed out.",
              );
            }

            if (
              status ===
              "CLOSED"
            ) {

              console.warn(
                "Notification service Realtime channel closed.",
              );
            }
          },
        );

    await startComponentsNotificationWatcher(
      user.id,
    );

    return monitoringChannel;
  };


// ============================================================
// STOP MONITORING NOTIFICATION WATCHER
// ============================================================

export const stopMonitoringNotificationWatcher =
  async () => {

    await unsubscribeFromNotificationMonitoring();
  };


// ============================================================
// INITIALIZE NOTIFICATION SERVICE
// ============================================================
//
// This function connects the notification service to the
// Supabase authentication lifecycle.
//
// SIGNED_IN:
// Start monitoring watcher for that user.
//
// SIGNED_OUT:
// Stop the watcher and clear the previous state.
//
// TOKEN_REFRESHED:
// Keep the current user's watcher active.
//
// USER_UPDATED:
// Keep the current user's watcher active.
// ============================================================

export const initializeNotificationService =
  async () => {

    if (
      notificationServiceStarted
    ) {
      return;
    }

    notificationServiceStarted =
      true;

    // ----------------------------------------------------------
    // START FOR CURRENTLY AUTHENTICATED USER
    // ----------------------------------------------------------

    const currentUser =
      await getAuthenticatedUser();

    if (
      currentUser
    ) {

      await startMonitoringNotificationWatcher();
    }

    // ----------------------------------------------------------
    // LISTEN FOR AUTH STATE CHANGES
    // ----------------------------------------------------------

    const {
      data,
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          session,
        ) => {

          try {

            if (
              event ===
              "SIGNED_IN"
            ) {

              if (
                session?.user
              ) {

                await startMonitoringNotificationWatcher();
              }

              return;
            }

            if (
              event ===
              "SIGNED_OUT"
            ) {

              await stopMonitoringNotificationWatcher();

              return;
            }

            if (
              event ===
              "USER_UPDATED"
            ) {

              if (
                session?.user
              ) {

                await startMonitoringNotificationWatcher();
              }

              return;
            }

            if (
              event ===
              "TOKEN_REFRESHED"
            ) {

              if (
                session?.user &&
                currentUserId !==
                  session.user.id
              ) {

                await startMonitoringNotificationWatcher();
              }
            }

          } catch (error) {

            console.error(
              "Notification service auth state error:",
              error,
            );
          }
        },
      );

    authSubscription =
      data.subscription;
  };


// ============================================================
// SHUTDOWN NOTIFICATION SERVICE
// ============================================================

export const shutdownNotificationService =
  async () => {

    await stopMonitoringNotificationWatcher();

    if (
      authSubscription
    ) {

      authSubscription.unsubscribe();

      authSubscription =
        null;
    }

    notificationServiceStarted =
      false;
  };


// ============================================================
// GET USER NOTIFICATIONS
// ============================================================
//
// This fetches notifications belonging only to the currently
// authenticated user.
//
// It follows the same user identity concept used by
// monitoringService.ts.
// ============================================================

export const getUserNotifications =
  async (): Promise<
    NotificationData[]
  > => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("notifications")
      .select(`
        notif_id,
        user_id,
        title,
        description,
        type,
        read,
        created_at
      `)
      .eq(
        "user_id",
        user.id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {

      console.error(
        "Error loading user notifications:",
        error.message,
      );

      return [];
    }

    return (
      data as NotificationData[]
    );
  };


// ============================================================
// GET UNREAD NOTIFICATIONS
// ============================================================

export const getUnreadNotifications =
  async (): Promise<
    NotificationData[]
  > => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from("notifications")
      .select(`
        notif_id,
        user_id,
        title,
        description,
        type,
        read,
        created_at
      `)
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "read",
        false,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {

      console.error(
        "Error loading unread notifications:",
        error.message,
      );

      return [];
    }

    return (
      data as NotificationData[]
    );
  };


// ============================================================
// GET UNREAD NOTIFICATION COUNT
// ============================================================

export const getUnreadNotificationCount =
  async (): Promise<number> => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return 0;
    }

    const {
      count,
      error,
    } = await supabase
      .from("notifications")
      .select(
        "notif_id",
        {
          count:
            "exact",
          head:
            true,
        },
      )
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "read",
        false,
      );

    if (error) {

      console.error(
        "Error loading unread notification count:",
        error.message,
      );

      return 0;
    }

    return count ?? 0;
  };


// ============================================================
// MARK NOTIFICATION AS READ
// ============================================================
//
// RLS ensures that the user can only update a notification
// whose user_id matches auth.uid().
// ============================================================

export const markNotificationAsRead =
  async (
    notificationId: string,
  ): Promise<boolean> => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from("notifications")
      .update({
        read: true,
      })
      .eq(
        "notif_id",
        notificationId,
      )
      .eq(
        "user_id",
        user.id,
      );

    if (error) {

      console.error(
        "Error marking notification as read:",
        error.message,
      );

      return false;
    }

    return true;
  };


// ============================================================
// MARK ALL USER NOTIFICATIONS AS READ
// ============================================================

export const markAllNotificationsAsRead =
  async (): Promise<boolean> => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from("notifications")
      .update({
        read: true,
      })
      .eq(
        "user_id",
        user.id,
      )
      .eq(
        "read",
        false,
      );

    if (error) {

      console.error(
        "Error marking all notifications as read:",
        error.message,
      );

      return false;
    }

    return true;
  };


// ============================================================
// DELETE USER NOTIFICATION
// ============================================================
//
// This function is intentionally included only for a future
// UI that may allow users to delete individual notifications.
//
// It remains protected by user_id = auth.uid().
// ============================================================

export const deleteNotification =
  async (
    notificationId: string,
  ): Promise<boolean> => {

    const user =
      await getAuthenticatedUser();

    if (!user) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from("notifications")
      .delete()
      .eq(
        "notif_id",
        notificationId,
      )
      .eq(
        "user_id",
        user.id,
      );

    if (error) {

      console.error(
        "Error deleting notification:",
        error.message,
      );

      return false;
    }

    return true;
  };


// ============================================================
// AUTO-INITIALIZATION
// ============================================================
//
// Importing this service initializes the authentication-aware
// monitoring watcher.
//
// The service remains independent from ChartCard.tsx.
// ============================================================

initializeNotificationService().catch(
  (error) => {

    console.error(
      "Failed to initialize notification service:",
      error,
    );
  },
);
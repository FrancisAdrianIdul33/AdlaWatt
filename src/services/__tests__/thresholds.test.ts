// Threshold cache + safety-rule unit tests.
//
// The three admin-published rules (high load, voltage min/max)
// are exercised with injected values through the real pipeline
// helpers; Supabase is spied (no network, no DB).
//
// Covers: cache defaults before load, published load, stale
// failure keeps previous, upward/downward crossing fires once,
// no repeat without re-crossing, boundary equality.

import {
  checkBatteryVoltageTooHigh,
  checkBatteryVoltageTooLow,
  checkHighCurrentLoad,
  getThresholdCache,
  loadThresholdCache,
  setThresholdCacheForTests,
  startMonitoringNotificationWatcher,
  stopMonitoringNotificationWatcher,
} from "@/services/notificationService";
import type { MonitoringData } from "@/services/monitoringService";
import * as supabaseLib from "@/lib/supabase";
import * as adminService from "@/admin/services/adminService";
import { getDefaultThresholds } from "@/admin/services/adminService";

const USER_ID = "user-1";

const mon = (
  overrides: Partial<MonitoringData>,
): MonitoringData =>
  ({
    battery_level: 80,
    battery_status: "Charging",
    time_remaining: "5h 00m",
    voltage: 12.6,
    watt_hours: 500,
    solar_input: 100,
    solar_status: "Moderate",
    solar_timer: "00:00:00",
    solar_voltage: 18.0,
    solar_current: 5.0,
    total_energy: 1200,
    current_load: 50,
    device_status: "Online",
    battery_temperature: 30,
    battery_temperature_status: "Nominal",
    dod_status: "Safe",
    solar_temperature: 35,
    solar_temperature_status: "Nominal",
    interior_temp: 28,
    interior_temp_status: "Nominal",
    ...overrides,
  }) as unknown as MonitoringData;

// Chainable query-builder stub recording inserts.
const inserts: Record<string, unknown>[] =
  [];

const chain: Record<string, jest.Mock> = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  update: jest.fn(),
  maybeSingle: jest.fn(),
  insert: jest.fn(),
};

const channelStub = {
  on: jest.fn(),
  subscribe: jest.fn(),
};

const resetChain = () => {
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.order.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.maybeSingle.mockResolvedValue({
    data: null,
    error: null,
  });
  chain.insert.mockImplementation(
    async (row: Record<string, unknown>) => {
      inserts.push(row);

      return { error: null };
    },
  );
};

beforeAll(() => {
  resetChain();

  jest
    .spyOn(supabaseLib, "getAuthenticatedUserSafe")
    .mockResolvedValue({
      id: USER_ID,
      email: "test@adlawatt.test",
    } as never);

  jest
    .spyOn(supabaseLib.supabase.auth, "getSession")
    .mockResolvedValue({
      data: {
        session: {
          user: {
            id: USER_ID,
            email: "test@adlawatt.test",
          },
        },
      },
    } as never);

  jest
    .spyOn(supabaseLib.supabase, "from")
    .mockImplementation((() => chain) as never);

  jest
    .spyOn(supabaseLib.supabase, "channel")
    .mockImplementation((() => {
      channelStub.on.mockReturnValue(
        channelStub,
      );
      channelStub.subscribe.mockReturnValue(
        channelStub,
      );

      return channelStub;
    }) as never);

  jest
    .spyOn(
      supabaseLib.supabase,
      "removeChannel",
    )
    .mockResolvedValue({} as never);

  jest
    .spyOn(
      supabaseLib.supabase.functions,
      "invoke",
    )
    .mockResolvedValue({} as never);
});

afterAll(async () => {
  await stopMonitoringNotificationWatcher();
  jest.restoreAllMocks();
});

describe("threshold cache", () => {
  test("defaults before any load (fail-safe armed)", () => {
    setThresholdCacheForTests(null);

    const cache = getThresholdCache();
    const defaults = getDefaultThresholds();

    expect(cache).toEqual({
      highLoadWatts: defaults.highLoadWatts,
      batteryVoltageMin:
        defaults.batteryVoltageMin,
      batteryVoltageMax:
        defaults.batteryVoltageMax,
    });
  });

  test("published load updates the cache", async () => {
    const spy = jest
      .spyOn(
        adminService,
        "getPublishedThresholds",
      )
      .mockResolvedValue({
        thresholds: {
          ...getDefaultThresholds(),
          highLoadWatts: 500,
          batteryVoltageMin: 11.0,
          batteryVoltageMax: 14.0,
        },
        stale: false,
      });

    try {
      const cache =
        await loadThresholdCache();

      expect(cache.highLoadWatts).toBe(
        500,
      );
      expect(cache.batteryVoltageMin).toBe(
        11.0,
      );
      expect(cache.batteryVoltageMax).toBe(
        14.0,
      );
    } finally {
      spy.mockRestore();
    }
  });

  test("stale failure keeps the previous cache", async () => {
    setThresholdCacheForTests({
      highLoadWatts: 500,
      batteryVoltageMin: 11.0,
      batteryVoltageMax: 14.0,
    });

    const spy = jest
      .spyOn(
        adminService,
        "getPublishedThresholds",
      )
      .mockRejectedValue(
        new Error("offline"),
      );

    try {
      const cache =
        await loadThresholdCache();

      expect(cache.highLoadWatts).toBe(
        500,
      );
    } finally {
      spy.mockRestore();
    }
  });
});

describe("safety rules with injected thresholds", () => {
  beforeAll(async () => {
    // Arms currentUserId + loads the cache through the real
    // starter; the initial missing-record insert is discarded
    // (insert already records into `inserts` by default).
    await startMonitoringNotificationWatcher();
    inserts.length = 0;

    setThresholdCacheForTests(null);
  });

  beforeEach(() => {
    inserts.length = 0;
  });

  test("high load crossing fires once with threshold values", async () => {
    // Unique title per firing path is fixed ("High Current
    // Load"); cooldown isolation comes from beforeEach +
    // distinct thresholds per test via fresh module state is
    // unnecessary — each rule fires at most once here because
    // the memory cooldown suppresses immediate repeats.
    await checkHighCurrentLoad(
      USER_ID,
      mon({ current_load: 900 }),
      mon({ current_load: 100 }),
      800,
    );

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      user_id: USER_ID,
      title: "High Current Load",
      type: "alert",
    });
    expect(
      String(inserts[0].description),
    ).toMatch(/800W/);
  });

  test("high load without re-crossing does not refire", async () => {
    await checkHighCurrentLoad(
      USER_ID,
      mon({ current_load: 900 }),
      mon({ current_load: 850 }),
      800,
    );

    expect(inserts).toHaveLength(0);
  });

  test("load below threshold never fires", async () => {
    await checkHighCurrentLoad(
      USER_ID,
      mon({ current_load: 100 }),
      mon({ current_load: 50 }),
      800,
    );

    expect(inserts).toHaveLength(0);
  });

  test("voltage dipping below minimum fires", async () => {
    await checkBatteryVoltageTooLow(
      USER_ID,
      mon({ voltage: 11.2 }),
      mon({ voltage: 12.0 }),
      11.6,
    );

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      title: "Battery Voltage Too Low",
      type: "alert",
    });
  });

  test("voltage already below minimum does not refire", async () => {
    await checkBatteryVoltageTooLow(
      USER_ID,
      mon({ voltage: 11.2 }),
      mon({ voltage: 11.3 }),
      11.6,
    );

    expect(inserts).toHaveLength(0);
  });

  test("voltage exceeding maximum fires", async () => {
    await checkBatteryVoltageTooHigh(
      USER_ID,
      mon({ voltage: 15.0 }),
      mon({ voltage: 14.0 }),
      14.6,
    );

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({
      title: "Battery Voltage Too High",
      type: "alert",
    });
  });

  test("voltage at exactly the maximum does not fire", async () => {
    await checkBatteryVoltageTooHigh(
      USER_ID,
      mon({ voltage: 14.6 }),
      mon({ voltage: 14.0 }),
      14.6,
    );

    expect(inserts).toHaveLength(0);
  });
});

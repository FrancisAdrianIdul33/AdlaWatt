// Admin threshold store tests: client-side range validation
// (pure) and publish/read paths with a spied Supabase surface
// (no network, no DB).
//
// Locks the honesty contract: out-of-range drafts never reach
// the network, failed reads fall back to defaults flagged
// stale, and publishes stamp updated_by.

import {
  getDefaultThresholds,
  getPublishedThresholds,
  isValidThresholds,
  publishThresholds,
} from "@/admin/services/adminService";
import * as supabaseLib from "@/lib/supabase";

const chain: Record<string, jest.Mock> = {
  select: jest.fn(),
  eq: jest.fn(),
  update: jest.fn(),
  maybeSingle: jest.fn(),
};

beforeAll(() => {
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);

  jest
    .spyOn(supabaseLib.supabase, "from")
    .mockImplementation((() => chain) as never);

  jest
    .spyOn(supabaseLib.supabase.auth, "getUser")
    .mockResolvedValue({
      data: {
        user: { id: "admin-1" },
      },
    } as never);
});

afterAll(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  jest.clearAllMocks();

  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
});

describe("isValidThresholds", () => {
  test("admin defaults are valid", () => {
    expect(
      isValidThresholds(
        getDefaultThresholds(),
      ),
    ).toBe(true);
  });

  test("boundary values are valid", () => {
    expect(
      isValidThresholds({
        batteryVoltageMin: 10,
        batteryVoltageMax: 15,
        highLoadWatts: 100,
        batteryTempHigh: 30,
        solarTempHigh: 40,
        interiorTempHigh: 30,
      }),
    ).toBe(true);
  });

  test("min above max is invalid", () => {
    expect(
      isValidThresholds({
        ...getDefaultThresholds(),
        batteryVoltageMin: 14.0,
        batteryVoltageMax: 13.5,
      }),
    ).toBe(false);
  });

  test.each([
    ["batteryVoltageMin", 9.9],
    ["batteryVoltageMax", 15.1],
    ["highLoadWatts", 99],
    ["highLoadWatts", 1001],
    ["batteryTempHigh", 29],
    ["solarTempHigh", 81],
    ["interiorTempHigh", 71],
  ])(
    "out-of-range %s=%s is invalid",
    (key, value) => {
      expect(
        isValidThresholds({
          ...getDefaultThresholds(),
          [key]: value,
        }),
      ).toBe(false);
    },
  );
});

describe("publishThresholds", () => {
  test("valid draft writes the singleton row with author stamp", async () => {
    chain.update.mockReturnValue(chain);
    chain.eq.mockResolvedValue({
      error: null,
    });

    await publishThresholds(
      getDefaultThresholds(),
    );

    expect(
      supabaseLib.supabase.from,
    ).toHaveBeenCalledWith(
      "alert_thresholds",
    );
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        battery_voltage_min: 11.6,
        battery_voltage_max: 14.6,
        high_load_watts: 800,
        updated_by: "admin-1",
      }),
    );
    expect(chain.eq).toHaveBeenCalledWith(
      "id",
      1,
    );
  });

  test("invalid draft never reaches the network", async () => {
    await expect(
      publishThresholds({
        ...getDefaultThresholds(),
        highLoadWatts: 5000,
      }),
    ).rejects.toThrow(/allowed ranges/);

    expect(
      supabaseLib.supabase.from,
    ).not.toHaveBeenCalled();
  });

  test("server error rejects with its message", async () => {
    chain.eq.mockResolvedValue({
      error: { message: "RLS denied" },
    });

    await expect(
      publishThresholds(
        getDefaultThresholds(),
      ),
    ).rejects.toThrow(/RLS denied/);
  });
});

describe("getPublishedThresholds", () => {
  test("row maps snake_case to thresholds, not stale", async () => {
    chain.maybeSingle.mockResolvedValue({
      data: {
        battery_voltage_min: 11.0,
        battery_voltage_max: 14.0,
        high_load_watts: 500,
        battery_temp_high: 44,
        solar_temp_high: 60,
        interior_temp_high: 48,
      },
      error: null,
    });

    const result =
      await getPublishedThresholds();

    expect(result.stale).toBe(false);
    expect(result.thresholds).toEqual({
      batteryVoltageMin: 11.0,
      batteryVoltageMax: 14.0,
      highLoadWatts: 500,
      batteryTempHigh: 44,
      solarTempHigh: 60,
      interiorTempHigh: 48,
    });
  });

  test("non-numeric cells fall back per-field to defaults", async () => {
    chain.maybeSingle.mockResolvedValue({
      data: {
        battery_voltage_min: "broken",
        battery_voltage_max: 14.0,
        high_load_watts: null,
        battery_temp_high: 44,
        solar_temp_high: 60,
        interior_temp_high: 48,
      },
      error: null,
    });

    const result =
      await getPublishedThresholds();
    const defaults = getDefaultThresholds();

    expect(result.stale).toBe(false);
    expect(
      result.thresholds.batteryVoltageMin,
    ).toBe(defaults.batteryVoltageMin);
    expect(result.thresholds.highLoadWatts).toBe(
      defaults.highLoadWatts,
    );
    expect(
      result.thresholds.batteryVoltageMax,
    ).toBe(14.0);
  });

  test("read failure falls back to defaults flagged stale", async () => {
    chain.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: "offline" },
    });

    const result =
      await getPublishedThresholds();

    expect(result.stale).toBe(true);
    expect(result.thresholds).toEqual(
      getDefaultThresholds(),
    );
  });
});

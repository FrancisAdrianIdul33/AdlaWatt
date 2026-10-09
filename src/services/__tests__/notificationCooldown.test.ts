// Notification cooldown unit tests (pure helper extracted
// from the Supabase-coupled create paths — no mocks).
//
// Locks the anti-spam contract: a firing suppresses refires
// inside its window (10-min default, 5-min for high-frequency
// fields) and never suppresses outside it.

import { isWithinCooldown } from "@/services/notificationService";

const TEN_MINUTES = 10 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe("isWithinCooldown", () => {
  test("never-fired (undefined) never suppresses", () => {
    expect(
      isWithinCooldown(
        undefined,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(false);
  });

  test("recent firing inside the window suppresses", () => {
    expect(
      isWithinCooldown(
        NOW - 60 * 1000,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(true);

    expect(
      isWithinCooldown(
        NOW - 60 * 1000,
        NOW,
        FIVE_MINUTES,
      ),
    ).toBe(true);
  });

  test("expired window no longer suppresses", () => {
    expect(
      isWithinCooldown(
        NOW - TEN_MINUTES - 1,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(false);

    expect(
      isWithinCooldown(
        NOW - FIVE_MINUTES - 1,
        NOW,
        FIVE_MINUTES,
      ),
    ).toBe(false);
  });

  test("exact window boundary expires (>=, not >)", () => {
    expect(
      isWithinCooldown(
        NOW - TEN_MINUTES,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(false);
  });

  test("same-timestamp refire suppresses (sensor replays)", () => {
    expect(
      isWithinCooldown(
        NOW,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(true);
  });

  test("high-frequency 5-min window is shorter than default", () => {
    const sixMinutesAgo =
      NOW - 6 * 60 * 1000;

    // Still inside the 10-min gate ...
    expect(
      isWithinCooldown(
        sixMinutesAgo,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(true);

    // ... but outside the 5-min gate.
    expect(
      isWithinCooldown(
        sixMinutesAgo,
        NOW,
        FIVE_MINUTES,
      ),
    ).toBe(false);
  });

  test("invalid inputs fail open (never suppress)", () => {
    expect(
      isWithinCooldown(
        NaN,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(false);

    expect(
      isWithinCooldown(
        NOW - 1000,
        NaN,
        TEN_MINUTES,
      ),
    ).toBe(false);

    expect(
      isWithinCooldown(
        NOW - 1000,
        NOW,
        NaN,
      ),
    ).toBe(false);

    expect(
      isWithinCooldown(
        NOW - 1000,
        NOW,
        0,
      ),
    ).toBe(false);

    expect(
      isWithinCooldown(
        NOW - 1000,
        NOW,
        -5000,
      ),
    ).toBe(false);
  });

  test("future lastMs (clock skew) suppresses conservatively", () => {
    expect(
      isWithinCooldown(
        NOW + 1000,
        NOW,
        TEN_MINUTES,
      ),
    ).toBe(true);
  });
});

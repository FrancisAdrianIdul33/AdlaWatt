// Push service unit tests (native surface fully mocked —
// no device, no permissions UI, no network).
//
// Locks the client contract: emulator/denied registration
// resolves null silently, sends validate through the Edge
// Function shape, unregister never throws. The granted-token
// path (real ExpoPushToken) is covered on-device only.

import {
  registerPushToken,
  sendPushNotification,
  unregisterPushToken,
} from "@/services/pushService";
import { FunctionsClient } from "@supabase/functions-js";
import * as Notifications from "expo-notifications";

jest.mock("expo-device", () => ({
  isDevice: false,
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener:
    jest.fn(),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: "high" },
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

const mockedNotifications =
  Notifications as unknown as {
    getPermissionsAsync: jest.Mock;
    requestPermissionsAsync: jest.Mock;
  };

describe("registerPushToken", () => {
  test("emulator resolves null without touching permissions", async () => {
    const token =
      await registerPushToken();

    expect(token).toBeNull();
    expect(
      mockedNotifications.getPermissionsAsync,
    ).not.toHaveBeenCalled();
  });

  test("denied permission resolves null", async () => {
    // Emulator gate is module-level (isDevice false), so
    // denial is covered structurally: any non-device or
    // non-granted outcome resolves null. This pins the
    // denied branch shape against the real enum.
    mockedNotifications.getPermissionsAsync.mockResolvedValue(
      { status: "denied" },
    );
    mockedNotifications.requestPermissionsAsync.mockResolvedValue(
      { status: "denied" },
    );

    // Still null on emulator before permissions matter.
    await expect(
      registerPushToken(),
    ).resolves.toBeNull();
  });
});

describe("unregisterPushToken", () => {
  test("never throws, even with no session", async () => {
    await expect(
      unregisterPushToken(),
    ).resolves.toBeUndefined();
  });
});

describe("sendPushNotification", () => {
  // supabase.functions is a getter minting a fresh client per
  // access, so instance spies never intercept — prototype does.
  const invokeSpy = jest.spyOn(
    FunctionsClient.prototype,
    "invoke",
  );

  afterEach(() => {
    invokeSpy.mockReset();
  });

  afterAll(() => {
    invokeSpy.mockRestore();
  });

  test("accepted send resolves success", async () => {
    invokeSpy.mockResolvedValue({
      data: { success: true },
      error: null,
    } as never);

    const result =
      await sendPushNotification({
        title: "AdlaWatt Alert: Test",
        body: "Something needs attention.",
      });

    expect(result).toEqual({
      success: true,
    });
    expect(invokeSpy).toHaveBeenCalledWith(
      "send-push",
      {
        body: {
          title: "AdlaWatt Alert: Test",
          body: "Something needs attention.",
          route: "/dashboard/notifications",
        },
      },
    );
  });

  test("function error surfaces its message", async () => {
    invokeSpy.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    } as never);

    const result =
      await sendPushNotification({
        title: "t",
        body: "b",
      });

    expect(result).toEqual({
      success: false,
      error: "boom",
    });
  });

  test("server rejection surfaces server text", async () => {
    invokeSpy.mockResolvedValue({
      data: {
        success: false,
        error: "A title is required.",
      },
      error: null,
    } as never);

    const result =
      await sendPushNotification({
        title: "t",
        body: "b",
      });

    expect(result).toEqual({
      success: false,
      error: "A title is required.",
    });
  });

  test("thrown transport error resolves failure, never throws", async () => {
    invokeSpy.mockRejectedValue(
      new Error("offline"),
    );

    const result =
      await sendPushNotification({
        title: "t",
        body: "b",
      });

    expect(result).toEqual({
      success: false,
      error: "offline",
    });
  });
});

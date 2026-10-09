// Avatar resolver unit tests (pure — no network, no auth).
//
// Locks the photo contract: Google metadata wins in order,
// everything else maps to null, and the initial fallback is
// never blank.

import {
  avatarInitialForName,
  resolveAvatarPhotoUrl,
} from "@/services/avatar";

describe("resolveAvatarPhotoUrl", () => {
  test("avatar_url wins when present", () => {
    expect(
      resolveAvatarPhotoUrl({
        user_metadata: {
          avatar_url:
            "https://example.com/a.png",
          picture:
            "https://example.com/b.png",
        },
      } as never),
    ).toBe("https://example.com/a.png");
  });

  test("picture is the fallback", () => {
    expect(
      resolveAvatarPhotoUrl({
        user_metadata: {
          picture:
            "https://example.com/b.png",
        },
      } as never),
    ).toBe("https://example.com/b.png");
  });

  test.each([
    ["null user", null],
    ["missing metadata", {}],
    ["null metadata", { user_metadata: null }],
    [
      "empty strings",
      {
        user_metadata: {
          avatar_url: "   ",
          picture: "",
        },
      },
    ],
    [
      "non-string values",
      {
        user_metadata: {
          avatar_url: 42,
          picture: false,
        },
      },
    ],
    [
      "unrelated metadata only",
      {
        user_metadata: {
          username: "someone",
        },
      },
    ],
  ])("%s resolves null", (_label, user) => {
    expect(
      resolveAvatarPhotoUrl(
        user as never,
      ),
    ).toBeNull();
  });

  test("trims surrounding whitespace", () => {
    expect(
      resolveAvatarPhotoUrl({
        user_metadata: {
          avatar_url:
            "  https://example.com/a.png  ",
        },
      } as never),
    ).toBe("https://example.com/a.png");
  });
});

describe("avatarInitialForName", () => {
  test("first alphanumeric, uppercased", () => {
    expect(
      avatarInitialForName("francis"),
    ).toBe("F");
    expect(
      avatarInitialForName("user_123"),
    ).toBe("U");
  });

  test("skips leading non-alphanumerics", () => {
    expect(
      avatarInitialForName("_ghost"),
    ).toBe("G");
  });

  test.each([
    ["null", null],
    ["empty", ""],
    ["blank", "   "],
    ["symbols only", "___"],
  ])("%s falls back to ?", (_label, name) => {
    expect(
      avatarInitialForName(name as never),
    ).toBe("?");
  });
});

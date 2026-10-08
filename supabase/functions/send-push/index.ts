// ============================================================
// SUPABASE EDGE FUNCTION: send-push
// ============================================================
//
// Server-side fan-out for AdlaWatt alert push banners via the
// Expo Push Service. No push secrets live anywhere: Expo
// routes to FCM/APNs server-side using the project's uploaded
// credentials, and this function only needs the per-user
// device tokens stored in public.push_tokens.
//
// Request (POST, authenticated via the caller's JWT):
//   { title, body, route? }
//
// Response:
//   { success: true, sent, tickets } | { success: false, error }
//
// Flow: JWT -> caller user -> that user's push_notifications
// toggle (fail-closed here would strand alerts; the app gate
// already checked it, so a missing row still sends) ->
// tokens -> Expo Push API (chunked at 100/request).
//
// Ticket errors (e.g. DeviceNotRegistered) are returned per
// token so misconfiguration surfaces in logs instead of
// silence. Stale-token pruning is a phase-2 cron.
//
// Deploy:
//   supabase functions deploy send-push
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL =
  "https://exp.host/--/api/v2/push/send";

const SEND_TIMEOUT_MS = 15000;
const CHUNK_SIZE = 100;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

interface PushTicket {
  token: string;
  status: string;
  message?: string;
  details?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(
      { success: false, error: "Method not allowed." },
      405,
    );
  }

  // ---- Caller must be a signed-in Supabase user ----
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  const jwt = (req.headers.get("Authorization") ?? "").replace(
    /^Bearer\s+/i,
    "",
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(jwt);

  if (authError || !user) {
    return json(
      { success: false, error: "Unauthorized." },
      401,
    );
  }

  // ---- Validate payload ----
  let payload: {
    title?: unknown;
    body?: unknown;
    route?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return json(
      { success: false, error: "Invalid JSON body." },
      400,
    );
  }

  const title =
    typeof payload.title === "string"
      ? payload.title.trim()
      : "";

  const body =
    typeof payload.body === "string"
      ? payload.body.trim()
      : "";

  const route =
    typeof payload.route === "string" &&
    payload.route.startsWith("/")
      ? payload.route
      : "/dashboard/notifications";

  if (!title) {
    return json(
      { success: false, error: "A title is required." },
      400,
    );
  }

  if (!body) {
    return json(
      { success: false, error: "A body is required." },
      400,
    );
  }

  // ---- Caller’s own tokens only (RLS would scope this
  // anyway; the service-role-free anon client enforces it) ----
  const { data: tokenRows, error: tokenError } =
    await supabase
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_id", user.id);

  if (tokenError) {
    console.error(
      "Push token lookup failed:",
      tokenError.message,
    );

    return json(
      { success: false, error: "Unable to load push tokens." },
      500,
    );
  }

  const tokens = (
    (tokenRows ?? []) as {
      expo_push_token?: unknown;
    }[]
  )
    .map((row) =>
      typeof row.expo_push_token === "string"
        ? row.expo_push_token.trim()
        : "",
    )
    .filter((token) => token.length > 0);

  if (tokens.length === 0) {
    // No device registered: not an error for the caller —
    // the in-app row and email paths already delivered.
    return json({ success: true, sent: 0, tickets: [] });
  }

  // ---- Fan out through Expo (chunked per Expo limits) ----
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SEND_TIMEOUT_MS,
  );

  try {
    const tickets: PushTicket[] = [];

    for (
      let offset = 0;
      offset < tokens.length;
      offset += CHUNK_SIZE
    ) {
      const chunk = tokens.slice(
        offset,
        offset + CHUNK_SIZE,
      );

      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          chunk.map((token) => ({
            to: token,
            sound: "default",
            title,
            body,
            data: { route },
            channelId: "adlawatt-alerts",
            priority: "high",
          })),
        ),
        signal: controller.signal,
      });

      const data = (await res
        .json()
        .catch(() => null)) as {
        data?: {
          status?: unknown;
          message?: unknown;
          details?: unknown;
        }[];
      } | null;

      if (!res.ok) {
        console.error(
          "Expo push chunk failed:",
          res.status,
          data,
        );

        return json(
          {
            success: false,
            error: `Push provider returned ${res.status}.`,
          },
          502,
        );
      }

      (data?.data ?? []).forEach(
        (ticket, index) => {
          const status =
            typeof ticket?.status === "string"
              ? ticket.status
              : "unknown";

          if (status !== "ok") {
            console.warn(
              "Expo push ticket error:",
              chunk[index],
              ticket?.message ?? ticket,
            );
          }

          tickets.push({
            token: chunk[index],
            status,
            message:
              typeof ticket?.message ===
              "string"
                ? ticket.message
                : undefined,
            details: ticket?.details,
          });
        },
      );
    }

    const sent = tickets.filter(
      (ticket) => ticket.status === "ok",
    ).length;

    return json({ success: true, sent, tickets });
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return json(
        { success: false, error: "Push request timed out." },
        504,
      );
    }

    console.error("Expo push send error:", error);

    return json(
      { success: false, error: "Unable to send push." },
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
});

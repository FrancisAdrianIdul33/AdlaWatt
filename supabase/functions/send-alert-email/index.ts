// ============================================================
// SUPABASE EDGE FUNCTION: send-alert-email
// ============================================================
//
// Server-side proxy for AgentMail transactional sends.
// The AgentMail API key lives ONLY here (Supabase secret
// AGENTMAIL_API_KEY) — it never ships in the app bundle.
//
// Request (POST, authenticated via the caller's JWT):
//   { to, subject, text, html }
//
// Response:
//   { success: true, messageId? } | { success: false, error }
//
// Env (set via `supabase secrets set`):
//   AGENTMAIL_API_KEY      (required, server-only)
//   AGENTMAIL_SENDER_INBOX (optional, default below)
//
// Deploy:
//   supabase functions deploy send-alert-email
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SENDER_INBOX =
  Deno.env.get("AGENTMAIL_SENDER_INBOX") ??
  "adlawatt@agentmail.to";

const AGENTMAIL_SEND_URL = (inbox: string) =>
  `https://api.agentmail.to/v0/inboxes/${encodeURIComponent(inbox)}/messages/send`;

const SEND_TIMEOUT_MS = 15000;

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
    to?: unknown;
    subject?: unknown;
    text?: unknown;
    html?: unknown;
  };

  try {
    payload = await req.json();
  } catch {
    return json(
      { success: false, error: "Invalid JSON body." },
      400,
    );
  }

  const to =
    typeof payload.to === "string" ? payload.to.trim() : "";

  const subject =
    typeof payload.subject === "string"
      ? payload.subject.trim()
      : "";

  const text =
    typeof payload.text === "string" ? payload.text : "";

  const html =
    typeof payload.html === "string" ? payload.html : "";

  if (!to || !to.includes("@")) {
    return json(
      {
        success: false,
        error: "A valid recipient email address is required.",
      },
      400,
    );
  }

  if (!subject) {
    return json(
      { success: false, error: "A subject is required." },
      400,
    );
  }

  if (!text && !html) {
    return json(
      {
        success: false,
        error: "A text or html body is required.",
      },
      400,
    );
  }

  const apiKey = Deno.env.get("AGENTMAIL_API_KEY") ?? "";

  if (!apiKey) {
    console.error("AGENTMAIL_API_KEY secret is not set.");

    return json(
      { success: false, error: "Email service is not configured." },
      500,
    );
  }

  // ---- Send via AgentMail (15s timeout) ----
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SEND_TIMEOUT_MS,
  );

  try {
    const res = await fetch(AGENTMAIL_SEND_URL(SENDER_INBOX), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, text, html }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (res.status === 429) {
      return json(
        {
          success: false,
          error: "Email rate limit reached. Please try again later.",
        },
        429,
      );
    }

    if (!res.ok) {
      const upstream =
        (data as { message?: unknown } | null)?.message;

      console.error("AgentMail send failed:", res.status, data);

      return json(
        {
          success: false,
          error:
            typeof upstream === "string" && upstream
              ? upstream
              : `Email provider returned ${res.status}.`,
        },
        502,
      );
    }

    return json({
      success: true,
      messageId:
        (data as { message_id?: unknown } | null)?.message_id ??
        null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return json(
        { success: false, error: "Email request timed out." },
        504,
      );
    }

    console.error("AgentMail send error:", error);

    return json(
      { success: false, error: "Unable to send email." },
      500,
    );
  } finally {
    clearTimeout(timeout);
  }
});

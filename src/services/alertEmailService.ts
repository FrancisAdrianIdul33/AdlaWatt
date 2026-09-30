import {
  getAuthenticatedUserSafe,
  supabase,
} from "@/lib/supabase";

// ============================================================
// ALERT EMAIL SERVICE (AgentMail via Edge Function)
// ============================================================
//
// Client-side companion to supabase/functions/send-alert-email.
// The AgentMail API key lives ONLY server-side — this module
// never sees it. Sends go through functions.invoke with the
// caller's JWT, so only signed-in users can send.
//
// Branded layout: Gmail-safe 600px table, inline styles only.
// ============================================================

export interface AlertEmailResult {
  success: boolean;
  error?: string;
  messageId?: string | null;
}

export interface AlertEmailOptions {
  subject: string;
  title: string;
  description: string;
  type: "alert" | "normal";
  to?: string;
  timestamp?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildAlertEmailHtml = ({
  title,
  description,
  type,
  timestamp,
}: {
  title: string;
  description: string;
  type: "alert" | "normal";
  timestamp?: string;
}): string => {
  const isAlert = type === "alert";

  const badgeBg = isAlert ? "#D32F2F" : "#00805A";
  const badgeLabel = isAlert ? "&#9650; ALERT" : "&#9679; NORMAL";
  const badgeText = isAlert ? "Alert" : "Normal";

  // Hosted logo icon (Supabase Storage public URL). Falls back
  // to a styled-text lockup when unset or when images are off.
  const logoUrl =
    process.env.EXPO_PUBLIC_AGENTMAIL_LOGO_URL?.trim() ?? "";

  const logoImg = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="AdlaWatt" width="56" style="display:block;border:0;width:56px;height:56px;" />`
    : "";

  const wordmark = `<div style="font-size:26px;font-weight:800;color:#FFFFFF;letter-spacing:0.5px;line-height:1.1;">Adla<span style="color:#FFBF00;">W</span>att</div>
<div style="font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.7);margin-top:6px;">ENERGY MONITORING</div>`;

  const headerLockup = logoUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td valign="middle" style="padding-right:14px;">${logoImg}</td><td valign="middle">${wordmark}</td></tr></table>`
    : wordmark;

  const severityRule = isAlert ? "#D32F2F" : "#00805A";

  const descriptionBlock = isAlert
    ? `<div style="background-color:#FEE2E2;border-radius:8px;padding:12px 14px;font-size:15px;line-height:1.6;color:#1C1B1F;">${escapeHtml(description).replace(/\n/g, "<br />")}</div>`
    : `<div style="font-size:15px;line-height:1.6;color:#1C1B1F;">${escapeHtml(description).replace(/\n/g, "<br />")}</div>`;

  const preheader = `${title} — ${description}`.slice(0, 120);
  const timeLine = timestamp ?? new Date().toLocaleString();

  return `<!doctype html><html><body style="margin:0;padding:0;background-color:#F0EAD6;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0EAD6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;">
<tr><td style="background-color:${severityRule};font-size:4px;line-height:4px;">&nbsp;</td></tr>
<tr><td style="background-color:#FFBF00;font-size:4px;line-height:4px;">&nbsp;</td></tr>
<tr><td style="background-color:#00805A;padding:20px 24px;">
${headerLockup}
</td></tr>
<tr><td style="padding:24px 24px 8px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background-color:${badgeBg};color:#FFFFFF;font-size:12px;font-weight:800;padding:6px 12px;border-radius:999px;">${badgeLabel}</td></tr></table>
<div style="font-size:22px;font-weight:800;color:#1C1B1F;margin:14px 0 12px 0;">${escapeHtml(title)}</div>
${descriptionBlock}
</td></tr>
<tr><td style="padding:8px 24px 0 24px;">
<hr style="border:none;border-top:1px solid #D8D2C2;margin:12px 0;" />
<div style="font-size:13px;color:#747775;">${escapeHtml(timeLine)} &nbsp;|&nbsp; Type: ${badgeText}</div>
</td></tr>
<tr><td style="padding:16px 24px 8px 24px;">
<a href="adlawatt://dashboard/notifications" style="display:inline-block;background-color:#00805A;color:#FFFFFF;font-size:16px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:12px;">Open AdlaWatt</a>
</td></tr>
<tr><td align="center" style="padding:16px 24px 24px 24px;font-size:13px;color:#747775;">
Sent by AdlaWatt monitoring &middot; Do not reply
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
};

const buildAlertEmailText = (
  title: string,
  description: string,
  timestamp?: string,
): string =>
  `${title}\n\n${description}\n\n${timestamp ?? new Date().toLocaleString()}`;

// ------------------------------------------------------------
// SESSION-FIRST RECIPIENT
// ------------------------------------------------------------
//
// Reads the signed-in user's email from the local session
// first (immediate, no network), falling back to a server
// revalidation only when the session is empty.
// ------------------------------------------------------------

const getSessionEmail = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user?.email) {
    return session.user.email;
  }

  const user = await getAuthenticatedUserSafe();

  return user?.email ?? null;
};

export const sendAlertEmail = async ({
  subject,
  title,
  description,
  type,
  to,
  timestamp,
}: AlertEmailOptions): Promise<AlertEmailResult & { recipient: string | null }> => {
  const recipient = to?.trim() || (await getSessionEmail());

  if (!recipient || !recipient.includes("@")) {
    return {
      success: false,
      recipient: null,
      error:
        "No signed-in user email available. Sign in and try again.",
    };
  }

  const timeLine = timestamp ?? new Date().toLocaleString();

  try {
    const { data, error } = await supabase.functions.invoke(
      "send-alert-email",
      {
        body: {
          to: recipient,
          subject,
          text: buildAlertEmailText(title, description, timeLine),
          html: buildAlertEmailHtml({
            title,
            description,
            type,
            timestamp: timeLine,
          }),
        },
      },
    );

    if (error) {
      return {
        success: false,
        recipient,
        error: error.message,
      };
    }

    const body = data as
      | { success?: boolean; error?: string; messageId?: string | null }
      | null;

    if (!body || body.success !== true) {
      return {
        success: false,
        recipient,
        error: body?.error ?? "Email service reported failure.",
      };
    }

    return {
      success: true,
      recipient,
      messageId: body.messageId ?? null,
    };
  } catch (error) {
    return {
      success: false,
      recipient,
      error:
        error instanceof Error
          ? error.message
          : "Unable to send email. Please try again.",
    };
  }
};

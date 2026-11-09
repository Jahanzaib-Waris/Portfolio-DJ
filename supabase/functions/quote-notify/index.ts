import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

/**
 * quote-notify — runs when a row is inserted into public.quote_requests
 * (called by the database trigger in supabase/quote_notify.sql, not by browsers).
 *
 *  1. Notifies the studio owner (email via Resend and/or a chat webhook).
 *  2. Sends the submitter a short acknowledgement (rate-limited, plain text).
 *  3. Creates a CRM lead for the quote (idempotent on quote_request_id).
 *
 * Secrets (supabase secrets set ...):
 *   QUOTE_WEBHOOK_SECRET  required; must match the x-webhook-secret header
 *   RESEND_API_KEY        optional; without it no email is sent
 *   NOTIFY_EMAIL          where owner alerts go
 *   FROM_EMAIL            verified sender, e.g. "Jerry Dev Studio <hello@yourdomain.com>"
 *   NOTIFY_WEBHOOK_URL    optional Slack/Discord-compatible incoming webhook
 *   AUTO_REPLY            "true" to enable the submitter acknowledgement (default off)
 * Provided automatically: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

const BUDGET_DEAL_VALUES: Record<string, number> = {
  "Under $500": 400,
  "$500 – $2,000": 1250,
  "$2,000 – $5,000": 3500,
  "$5,000+": 5000,
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Strip control characters / newlines so user text can't break out of a header or subject.
const oneLine = (v: unknown, max = 120) =>
  String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

async function sendEmail(
  apiKey: string,
  payload: { from: string; to: string[]; subject: string; text: string; reply_to?: string },
) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("QUOTE_WEBHOOK_SECRET");
  if (!expected || req.headers.get("x-webhook-secret") !== expected) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await req.json().catch(() => null);
  const quote = body?.record;
  if (!quote?.id) return json({ error: "Missing record" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const name = oneLine(quote.name, 80);
  const email = oneLine(quote.email, 200);
  const results: Record<string, string> = {};

  // 1. CRM lead (idempotent)
  try {
    const { data: existing } = await supabase
      .from("crm_leads")
      .select("id")
      .eq("quote_request_id", quote.id)
      .limit(1);
    if (existing && existing.length > 0) {
      results.lead = "exists";
    } else {
      const { error } = await supabase.from("crm_leads").insert({
        name,
        email,
        company: "",
        job_title: "Inbound Lead",
        company_website: oneLine(quote.project_link, 300),
        stage: "lead",
        temperature: "hot",
        source: "website_inbound",
        deal_value: BUDGET_DEAL_VALUES[quote.budget] ?? 0,
        currency: "USD",
        tech_stack: [quote.service, quote.backend].filter(Boolean).map((v: string) => oneLine(v, 60)),
        notes: `Website Quote Submission:\n\nService: ${quote.service}\nBackend: ${quote.backend}\nBudget: ${quote.budget}\nTimeline: ${quote.timeline}\n\nProject Details:\n${quote.project_details}`,
        quote_request_id: quote.id,
        next_follow_up: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      });
      results.lead = error ? `error: ${error.message}` : "created";
    }
  } catch (err) {
    results.lead = `error: ${(err as Error).message}`;
  }

  const summary =
    `New quote request from ${name} <${email}>\n` +
    `Service: ${oneLine(quote.service)} | Backend: ${oneLine(quote.backend)}\n` +
    `Budget: ${oneLine(quote.budget)} | Timeline: ${oneLine(quote.timeline)}\n\n` +
    `${String(quote.project_details ?? "").slice(0, 1500)}`;

  // 2. Owner alerts
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const notifyEmail = Deno.env.get("NOTIFY_EMAIL");
  const fromEmail = Deno.env.get("FROM_EMAIL");

  if (resendKey && notifyEmail && fromEmail) {
    try {
      await sendEmail(resendKey, {
        from: fromEmail,
        to: [notifyEmail],
        subject: `New quote request: ${name}`,
        text: summary,
        reply_to: EMAIL_RE.test(email) ? email : undefined,
      });
      results.ownerEmail = "sent";
    } catch (err) {
      results.ownerEmail = `error: ${(err as Error).message}`;
    }
  }

  const webhook = Deno.env.get("NOTIFY_WEBHOOK_URL");
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: summary.slice(0, 1900), text: summary.slice(0, 1900) }),
      });
      results.webhook = res.ok ? "sent" : `error: ${res.status}`;
    } catch (err) {
      results.webhook = `error: ${(err as Error).message}`;
    }
  }

  // 3. Submitter acknowledgement. The form is public, so this could be abused to send
  //    mail to someone else's address: send at most one per address per 24h and cap the
  //    overall rate. The message never repeats anything the submitter typed except their name.
  if (Deno.env.get("AUTO_REPLY") === "true" && resendKey && fromEmail && EMAIL_RE.test(email)) {
    try {
      const since24h = new Date(Date.now() - 86400000).toISOString();
      const sinceHour = new Date(Date.now() - 3600000).toISOString();
      const [{ count: sameAddress }, { count: lastHour }] = await Promise.all([
        supabase.from("quote_requests").select("id", { count: "exact", head: true })
          .ilike("email", email).gte("submitted_at", since24h),
        supabase.from("quote_requests").select("id", { count: "exact", head: true })
          .gte("submitted_at", sinceHour),
      ]);

      if ((sameAddress ?? 0) > 1) {
        results.autoReply = "skipped: repeat address";
      } else if ((lastHour ?? 0) > 20) {
        results.autoReply = "skipped: rate cap";
      } else {
        await sendEmail(resendKey, {
          from: fromEmail,
          to: [email],
          subject: "Thanks for your project enquiry",
          text:
            `Hi ${name.split(" ")[0] || "there"},\n\n` +
            `Thanks for getting in touch. I've received your enquiry and will reply personally, ` +
            `usually within one working day.\n\n` +
            `If you didn't submit this request, you can ignore this email.\n\n` +
            `Jerry\nJerry Dev Studio\nhttps://jerry-dev-studio.web.app`,
          reply_to: notifyEmail,
        });
        results.autoReply = "sent";
      }
    } catch (err) {
      results.autoReply = `error: ${(err as Error).message}`;
    }
  }

  console.log("quote-notify", quote.id, JSON.stringify(results));
  return json({ success: true, results });
});

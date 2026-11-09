import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { fetchHnItems, fetchRemoteItems } from "../_shared/radar/sources.js";
import { computeOpportunityScore } from "../_shared/radar/scoring.js";

/**
 * radar-ingest — fetches Client Radar sources server-side, scores them, stores them
 * in public.radar_items, and (optionally) emails a digest of new contract-fit posts.
 *
 * Triggered by pg_cron (supabase/radar_cron.sql, header x-cron-secret) or by a
 * signed-in admin pressing "Refresh Feeds" in the radar (Authorization: Bearer <user JWT>).
 *
 * Secrets (supabase secrets set ...):
 *   RADAR_CRON_SECRET     required for the scheduled call
 *   RESEND_API_KEY, NOTIFY_EMAIL, FROM_EMAIL   optional; enable the digest email
 *   NOTIFY_WEBHOOK_URL    optional Slack/Discord-compatible webhook for the digest
 *   DIGEST_MIN_SCORE      minimum score for the digest (default 65)
 *   SITE_URL              base URL for links (default https://jerry-dev-studio.web.app)
 * Provided automatically: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// deno-lint-ignore no-explicit-any
type RadarItem = Record<string, any>;

const chunk = <T>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

async function isAuthorised(req: Request): Promise<boolean> {
  const cronSecret = Deno.env.get("RADAR_CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return true;

  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user }, error } = await userClient.auth.getUser();
  return Boolean(user) && !error;
}

function toRow(item: RadarItem, nowIso: string) {
  const opp = computeOpportunityScore(item);
  return {
    source: item.source,
    source_label: item.sourceLabel ?? "",
    source_url: item.url,
    external_id: item.id ?? "",
    company: item.company ?? "",
    title: item.title ?? "",
    location: item.location ?? "",
    employment_type: item.employmentType ?? "",
    type_label: item.type ?? "",
    salary: item.salary ?? "",
    email: item.email ?? "",
    website: item.website ?? "",
    description: item.description ?? "",
    full_text: item.fullText ?? "",
    extra: {
      apply_url: item.applyUrl ?? "",
      tags: item.tags ?? [],
      thread_title: item.threadTitle ?? "",
      highlight: Boolean(item.highlight),
      founder_direct: Boolean(item.isFounderDirect),
    },
    posted_at: item.date ? new Date(item.date).toISOString() : null,
    score: opp.score,
    fit: opp.engagement.fit,
    last_seen_at: nowIso,
  };
}

async function sendEmail(apiKey: string, payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!(await isAuthorised(req))) return json({ error: "Unauthorized" }, 401);

  const startedAt = new Date();
  const nowIso = startedAt.toISOString();
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  // 1. Fetch every source; one failing source must not lose the others.
  const jobs: [string, Promise<RadarItem[]>][] = [
    ["hacker_news", fetchHnItems("")],
    ["remote_mobile", fetchRemoteItems("mobile")],
    ["remote_flutter", fetchRemoteItems("flutter")],
  ];
  const settled = await Promise.allSettled(jobs.map(([, p]) => p));
  const sources: Record<string, string> = {};
  const byUrl = new Map<string, RadarItem>();
  settled.forEach((r, i) => {
    const name = jobs[i][0];
    if (r.status === "fulfilled") {
      sources[name] = `${r.value.length} items`;
      for (const item of r.value) if (item.url && !byUrl.has(item.url)) byUrl.set(item.url, item);
    } else {
      sources[name] = `error: ${r.reason?.message ?? r.reason}`;
    }
  });

  // 2. Score + upsert. Only data columns are written, so status / lead_id /
  //    notified_at / first_seen_at of rows we already have are left untouched.
  const rows = [...byUrl.values()].map((item) => toRow(item, nowIso));
  let upsertError: string | null = null;
  for (const part of chunk(rows, 100)) {
    const { error } = await supabase.from("radar_items").upsert(part, { onConflict: "source_url" });
    if (error) {
      upsertError = error.message;
      break;
    }
  }
  if (upsertError) return json({ success: false, error: upsertError, sources }, 500);

  const { count: newCount } = await supabase
    .from("radar_items")
    .select("id", { count: "exact", head: true })
    .gte("first_seen_at", nowIso);

  // 3. Retention: untouched, never-actioned items that no source returns any more.
  const cutoff = new Date(Date.now() - 45 * 86400000).toISOString();
  await supabase.from("radar_items").delete().eq("status", "new").lt("last_seen_at", cutoff);

  // 4. Digest of new, non-employment posts above the score threshold.
  const digest: Record<string, string> = {};
  const minScore = Number(Deno.env.get("DIGEST_MIN_SCORE") ?? "65");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const notifyEmail = Deno.env.get("NOTIFY_EMAIL");
  const fromEmail = Deno.env.get("FROM_EMAIL");
  const webhook = Deno.env.get("NOTIFY_WEBHOOK_URL");

  if ((resendKey && notifyEmail && fromEmail) || webhook) {
    const { data: top, error } = await supabase
      .from("radar_items")
      .select("id, company, title, location, source_label, source_url, email, score, fit")
      .eq("status", "new")
      .is("notified_at", null)
      .neq("fit", "not_fit")
      .gte("score", minScore)
      .order("score", { ascending: false })
      .limit(10);

    if (error) {
      digest.status = `error: ${error.message}`;
    } else if (!top || top.length === 0) {
      digest.status = "nothing new above threshold";
    } else {
      const site = Deno.env.get("SITE_URL") ?? "https://jerry-dev-studio.web.app";
      const lines = top.map(
        (t) =>
          `[${t.score}] ${t.company} — ${t.title} (${t.fit === "fit" ? "contract fit" : "engagement unclear"})` +
          `${t.email ? " · direct email" : ""}\n${t.source_url}`,
      );
      const text =
        `${top.length} new Client Radar lead${top.length === 1 ? "" : "s"} worth a look:\n\n` +
        `${lines.join("\n\n")}\n\nOpen the radar: ${site}/admin/crm/radar`;

      let sent = false;
      try {
        if (resendKey && notifyEmail && fromEmail) {
          await sendEmail(resendKey, {
            from: fromEmail,
            to: [notifyEmail],
            subject: `Client Radar: ${top.length} new lead${top.length === 1 ? "" : "s"}`,
            text,
          });
          sent = true;
        }
        if (webhook) {
          const res = await fetch(webhook, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text.slice(0, 1900), text: text.slice(0, 1900) }),
          });
          if (res.ok) sent = true;
        }
      } catch (err) {
        digest.status = `error: ${(err as Error).message}`;
      }

      if (sent) {
        await supabase
          .from("radar_items")
          .update({ notified_at: nowIso })
          .in("id", top.map((t) => t.id));
        digest.status = `sent ${top.length}`;
      }
    }
  } else {
    digest.status = "not configured";
  }

  console.log("radar-ingest", JSON.stringify({ sources, fetched: rows.length, new: newCount, digest }));
  return json({ success: true, fetched: rows.length, new: newCount ?? 0, sources, digest });
});

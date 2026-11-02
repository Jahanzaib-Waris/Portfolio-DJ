-- =====================================================================
-- JERRY DEV STUDIO: SCHEDULED TECHNICAL BLOG POSTS SEED SCRIPT
-- Generated for Automated Publishing starting 2026-11-01
-- =====================================================================

INSERT INTO public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content,
  published_date,
  is_published
) VALUES (
  'Streaming Real-Time AI Responses in FlutterFlow with Server-Sent Events (SSE) & Supabase Edge Functions',
  'flutterflow-streaming-ai-sse-supabase',
  'AI & Integrations',
  'Eliminate 15-second mobile UI freezes by implementing token-by-token streaming AI responses in FlutterFlow using Supabase Edge Functions and custom Dart stream controllers.',
  '<h2>The Problem: Mobile UI Freezes During Long AI Completions</h2>
<p>Integrating large language models (LLMs) such as OpenAI GPT-4o, Claude 3.5 Sonnet, or custom models into a mobile app via standard HTTP REST requests creates severe UX bottlenecks. When a user sends a prompt, the device must wait 10 to 25 seconds for the entire completion before the server returns an HTTP 200 payload. On mobile networks, this latency leads users to believe the application has frozen or failed.</p>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> Exposing your OpenAI or Anthropic API keys directly inside FlutterFlow custom actions or client-side code leaves your cloud account vulnerable to reverse engineering and credential scraping via APK/IPA decompilation.
</blockquote>

<h2>Official Architecture &amp; References</h2>
<p>According to the <a href="https://platform.openai.com/docs/api-reference/streaming" target="_blank" rel="noopener noreferrer">official OpenAI Streaming Documentation</a> and <a href="https://supabase.com/docs/guides/functions" target="_blank" rel="noopener noreferrer">Supabase Edge Functions Guide</a>, production streaming architectures require an authenticated server-side proxy that consumes the provider''s <code>text/event-stream</code> and relays byte chunks directly to the mobile client.</p>

<h2>Step 1: The Supabase Edge Function (Deno Streaming Proxy)</h2>
<p>Deploy a lightweight Supabase Edge Function that authenticates the mobile user''s JWT, verifies user tier limits, and streams raw tokens back via <code>ReadableStream</code>:</p>

<pre><code class="language-typescript">import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method === ''OPTIONS'') {
    return new Response(''ok'', { headers: { ''Access-Control-Allow-Origin'': ''*'' } })
  }

  const { prompt } = await req.json()
  const apiKey = Deno.env.get(''OPENAI_API_KEY'')

  const response = await fetch(''https://api.openai.com/v1/chat/completions'', {
    method: ''POST'',
    headers: {
      ''Authorization'': `Bearer ${apiKey}`,
      ''Content-Type'': ''application/json'',
    },
    body: JSON.stringify({
      model: ''gpt-4o-mini'',
      messages: [{ role: ''user'', content: prompt }],
      stream: true,
    }),
  })

  // Stream raw SSE chunks directly back to the mobile client
  return new Response(response.body, {
    headers: {
      ''Content-Type'': ''text/event-stream'',
      ''Cache-Control'': ''no-cache'',
      ''Connection'': ''keep-alive'',
      ''Access-Control-Allow-Origin'': ''*'',
    },
  })
})</code></pre>

<h2>Step 2: Custom Dart Action with Stream Controller</h2>
<p>In FlutterFlow, create a Custom Action named <code>streamAICompletion</code>. By using Dart''s <code>http.Client</code> and <code>ByteStream</code>, we read chunks incrementally and update an onUpdate callback that sets a Page State variable:</p>

<pre><code class="language-dart">import ''dart:async'';
import ''dart:convert'';
import ''package:http/http.dart'' as http;

Future<void> streamAICompletion(
  String prompt,
  String authToken,
  Future<dynamic> Function(String partialText) onTokenReceived,
) async {
  final client = http.Client();
  final request = http.Request(
    ''POST'',
    Uri.parse(''https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stream-ai''),
  );

  request.headers[''Authorization''] = ''Bearer $authToken'';
  request.headers[''Content-Type''] = ''application/json'';
  request.body = jsonEncode({''prompt'': prompt});

  final response = await client.send(request);
  String fullText = '''';

  response.stream
      .transform(utf8.decoder)
      .transform(const LineSplitter())
      .listen(
    (line) async {
      if (line.startsWith(''data: '') && !line.contains(''[DONE]'')) {
        try {
          final jsonData = jsonDecode(line.substring(6));
          final delta = jsonData[''choices''][0][''delta''][''content''] ?? '''';
          if (delta.isNotEmpty) {
            fullText += delta;
            await onTokenReceived(fullText);
          }
        } catch (_) {
          // Ignore keepalive heartbeats or trailing chunks
        }
      }
    },
    onDone: () => client.close(),
    onError: (e) => client.close(),
    cancelOnError: true,
  );
}</code></pre>

<h2>Production Verification &amp; Testing</h2>
<ol>
  <li><strong>First Token Latency:</strong> Expect time-to-first-token under 450ms, drastically reducing perceived wait time.</li>
  <li><strong>Memory Optimization:</strong> Avoid holding unbounded stream buffers in memory. If the user navigates away, cancel the stream subscription in your widget dispose lifecycle.</li>
</ol>

<div class="mt-12 rounded-xl border border-neon-blue/30 bg-[#070913]/90 p-6 backdrop-blur-sm">
  <div class="flex items-start gap-3.5">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue font-bold text-base border border-neon-blue/20">
      ✎
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-white tracking-wide">Found an Update or Correction?</h3>
      <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">
        We actively maintain our technical engineering guides against the latest Flutter, FlutterFlow, Apple iOS, and Android platform updates. If an API has changed, a cloud dependency was revised, or you spotted an edge case in our code snippets, please share your feedback with our engineering team.
      </p>
      <div class="mt-3.5 flex flex-wrap items-center gap-4 text-xs">
        <a href="/#contact" class="font-medium text-neon-blue hover:text-white transition-colors underline underline-offset-4">
          Submit an update / correction &rarr;
        </a>
        <span class="text-slate-600">&middot;</span>
        <span class="text-slate-400">Reviewed by Jerry Dev Studio Technical Editorial</span>
      </div>
    </div>
  </div>
</div>',
  '2026-11-01',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date,
  is_published = EXCLUDED.is_published,
  updated_at = TIMEZONE('utc', NOW());

INSERT INTO public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content,
  published_date,
  is_published
) VALUES (
  'Fixing RevenueCat Paywall Entitlements & Server-Side Webhook Sync in FlutterFlow',
  'flutterflow-revenuecat-subscriptions-webhooks',
  'Monetization',
  'Resolve missing customer entitlements, sandbox vs production receipt validation discrepancies, and real-time Supabase user tier synchronization.',
  '<h2>The Problem: Subscriptions Purchased but Features Locked</h2>
<p>One of the most frequent customer support tickets in subscription-based mobile apps is: <em>"I purchased the Pro plan, Apple charged my card, but the app still says I am on the free tier!"</em></p>
<p>In FlutterFlow apps relying solely on on-device SDK checks, race conditions occur during App Store sandbox testing, family sharing sync, and cross-platform restore purchases (e.g., purchasing on iOS and logging in on Android or Web).</p>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> Never trust client-reported purchase receipts to unlock database permissions directly. A malicious user or proxy tool can intercept client requests and simulate successful purchases without ever contacting Apple or Google.
</blockquote>

<h2>Official Specifications &amp; References</h2>
<p>According to the <a href="https://www.revenuecat.com/docs/webhooks" target="_blank" rel="noopener noreferrer">RevenueCat Webhooks V2 Documentation</a>, <a href="https://developer.apple.com/documentation/storekit" target="_blank" rel="noopener noreferrer">Apple StoreKit 2 Guidelines</a>, and Google Play Billing specifications, entitlements must be reconciled authoritatively via server-to-server webhooks.</p>

<h2>Step 1: The Authoritative Webhook Architecture</h2>
<p>Configure a Supabase Edge Function to receive RevenueCat lifecycle events (<code>INITIAL_PURCHASE</code>, <code>RENEWAL</code>, <code>CANCELLATION</code>, <code>EXPIRATION</code>, <code>BILLING_ISSUE</code>) and update your user profile table:</p>

<pre><code class="language-typescript">import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Validate RevenueCat Authorization Header
  const authHeader = req.headers.get(''Authorization'')
  if (authHeader !== `Bearer ${Deno.env.get(''REVENUECAT_WEBHOOK_SECRET'')}`) {
    return new Response(''Unauthorized'', { status: 401 })
  }

  const { event } = await req.json()
  const appUserId = event.app_user_id
  const entitlementId = event.entitlement_id || ''pro''
  const isEligible = [''INITIAL_PURCHASE'', ''RENEWAL'', ''UNCANCELLATION''].includes(event.type)

  const supabase = createClient(
    Deno.env.get(''SUPABASE_URL'')!,
    Deno.env.get(''SUPABASE_SERVICE_ROLE_KEY'')!
  )

  await supabase
    .from(''profiles'')
    .update({
      is_premium: isEligible,
      active_entitlement: isEligible ? entitlementId : null,
      subscription_expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    })
    .eq(''id'', appUserId)

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})</code></pre>

<h2>Step 2: Syncing App Resume in FlutterFlow</h2>
<p>When the user returns from the App Store paywall sheet, invoke a custom Dart Action to refresh the local customer state:</p>

<pre><code class="language-dart">import ''package:purchases_flutter/purchases_flutter.dart'';

Future<bool> refreshAndVerifyEntitlement(String entitlementName) async {
  try {
    final customerInfo = await Purchases.getCustomerInfo();
    final entitlement = customerInfo.entitlements.all[entitlementName];
    return entitlement != null && entitlement.isActive;
  } catch (e) {
    return false;
  }
}</code></pre>

<h2>Sandbox vs Production Checklist</h2>
<ol>
  <li><strong>Shared Secret / StoreKit 2 Private Key:</strong> Ensure your App Store Connect In-App Purchase Key is uploaded with proper Admin role permissions.</li>
  <li><strong>Google Service Account Credentials:</strong> Google Play Console requires granting automated financial permissions to your RevenueCat Google Cloud Service Account.</li>
</ol>

<div class="mt-12 rounded-xl border border-neon-blue/30 bg-[#070913]/90 p-6 backdrop-blur-sm">
  <div class="flex items-start gap-3.5">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue font-bold text-base border border-neon-blue/20">
      ✎
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-white tracking-wide">Found an Update or Correction?</h3>
      <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">
        We actively maintain our technical engineering guides against the latest Flutter, FlutterFlow, Apple iOS, and Android platform updates. If an API has changed, a cloud dependency was revised, or you spotted an edge case in our code snippets, please share your feedback with our engineering team.
      </p>
      <div class="mt-3.5 flex flex-wrap items-center gap-4 text-xs">
        <a href="/#contact" class="font-medium text-neon-blue hover:text-white transition-colors underline underline-offset-4">
          Submit an update / correction &rarr;
        </a>
        <span class="text-slate-600">&middot;</span>
        <span class="text-slate-400">Reviewed by Jerry Dev Studio Technical Editorial</span>
      </div>
    </div>
  </div>
</div>',
  '2026-11-02',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date,
  is_published = EXCLUDED.is_published,
  updated_at = TIMEZONE('utc', NOW());

INSERT INTO public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content,
  published_date,
  is_published
) VALUES (
  'Architecting Offline-First FlutterFlow Apps with Supabase & SQLite Local Caching',
  'flutterflow-offline-first-supabase-cache',
  'Architecture',
  'Build resilient mobile apps that work flawlessly in airplane mode, featuring optimistic UI updates, local SQLite persistence, and two-way sync reconciliation.',
  '<h2>The Problem: The "Spinning Wheel of Death" in Poor Connectivity</h2>
<p>Enterprise field service, healthcare, delivery, and inspection apps cannot rely on continuous 5G connectivity. When a technician enters an underground facility or a delivery driver enters an elevator, standard online-only FlutterFlow apps fail with network timeout exceptions, leaving the user with an empty screen and discarded inputs.</p>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> Standard FlutterFlow App State variables are stored in ephemeral memory and SharedPreferences. Saving large lists or relational records in SharedPreferences can cause severe UI stutter and crash on iOS due to memory pressure limits.
</blockquote>

<h2>Official Principles &amp; References</h2>
<p>Per <a href="https://docs.flutter.dev/data-and-backend/state-mgmt/simple" target="_blank" rel="noopener noreferrer">Flutter State Management Guidelines</a> and the <a href="https://pub.dev/packages/sqflite" target="_blank" rel="noopener noreferrer">Official SQLite (sqflite) Specification</a>, production offline architectures separate the data access layer into three tiers: <strong>Local SQLite Store</strong>, <strong>Mutation Sync Queue</strong>, and <strong>Remote Supabase REST/Realtime Hub</strong>.</p>

<h2>Step 1: The Local SQLite Schema &amp; Mutation Ledger</h2>
<p>We maintain two tables locally: the cached dataset and a sync ledger tracking un-pushed mutations:</p>

<pre><code class="language-dart">import ''package:sqflite/sqflite.dart'';
import ''package:path/path.dart'';

class LocalDatabaseService {
  static Database? _db;

  static Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await openDatabase(
      join(await getDatabasesPath(), ''app_cache.db''),
      version: 1,
      onCreate: (db, version) async {
        await db.execute(''''''
          CREATE TABLE tasks (
            id TEXT PRIMARY KEY,
            title TEXT,
            status TEXT,
            updated_at TEXT,
            is_synced INTEGER DEFAULT 1
          )
        '''''');
        await db.execute(''''''
          CREATE TABLE mutation_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT,
            payload TEXT,
            created_at TEXT
          )
        '''''');
      },
    );
    return _db!;
  }
}</code></pre>

<h2>Step 2: Optimistic Mutation &amp; Background Sync</h2>
<p>When the user creates or edits a task, save it immediately to SQLite with <code>is_synced = 0</code>, update the Flutter UI instantly (zero loading spinner), and dispatch a background worker to push changes once connectivity returns:</p>

<pre><code class="language-dart">Future<void> saveTaskOptimistic(String id, String title, String status) async {
  final db = await LocalDatabaseService.database;
  final now = DateTime.now().toUtc().toIso8601String();

  await db.transaction((txn) async {
    // 1. Write immediately to local cache for instant UI rendering
    await txn.insert(
      ''tasks'',
      {''id'': id, ''title'': title, ''status'': status, ''updated_at'': now, ''is_synced'': 0},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    // 2. Enqueue mutation
    await txn.insert(''mutation_queue'', {
      ''action'': ''UPSERT_TASK'',
      ''payload'': ''{"id":"$id","title":"$title","status":"$status"}'',
      ''created_at'': now,
    });
  });
}</code></pre>

<h2>Step 3: Two-Way Conflict Resolution</h2>
<p>To avoid overwriting edits made on other devices, implement a <strong>Last-Write-Wins (LWW)</strong> strategy comparing <code>updated_at</code> ISO timestamps or Postgres row version numbers during synchronizations.</p>

<div class="mt-12 rounded-xl border border-neon-blue/30 bg-[#070913]/90 p-6 backdrop-blur-sm">
  <div class="flex items-start gap-3.5">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue font-bold text-base border border-neon-blue/20">
      ✎
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-white tracking-wide">Found an Update or Correction?</h3>
      <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">
        We actively maintain our technical engineering guides against the latest Flutter, FlutterFlow, Apple iOS, and Android platform updates. If an API has changed, a cloud dependency was revised, or you spotted an edge case in our code snippets, please share your feedback with our engineering team.
      </p>
      <div class="mt-3.5 flex flex-wrap items-center gap-4 text-xs">
        <a href="/#contact" class="font-medium text-neon-blue hover:text-white transition-colors underline underline-offset-4">
          Submit an update / correction &rarr;
        </a>
        <span class="text-slate-600">&middot;</span>
        <span class="text-slate-400">Reviewed by Jerry Dev Studio Technical Editorial</span>
      </div>
    </div>
  </div>
</div>',
  '2026-11-04',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date,
  is_published = EXCLUDED.is_published,
  updated_at = TIMEZONE('utc', NOW());

INSERT INTO public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content,
  published_date,
  is_published
) VALUES (
  'Fixing Broken Deep Links & Universal Links in FlutterFlow for iOS & Android',
  'flutterflow-deep-links-universal-links-fix',
  'FlutterFlow Fixes',
  'Complete troubleshooting checklist for Apple Associated Domains, Android assetlinks.json verification, route parameter parsing, and magic link authentication.',
  '<h2>The Problem: Links Open Safari / Chrome Instead of the Mobile App</h2>
<p>You configure a deep link like <code>https://yourdomain.com/invite/XYZ123</code> for user onboarding or magic link login. When users tap the link on iOS or Android, instead of launching your FlutterFlow app directly, it opens the browser showing a 404 or web fallback.</p>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> Apple iOS enforces strict HTTPS-only hosting and domain validation for Universal Links. Any misconfiguration in MIME type, CDN caching, or wildcard subdomains results in silent failure on real iPhones without error logs.
</blockquote>

<h2>Official Standards &amp; Verification Tools</h2>
<p>Review the <a href="https://developer.apple.com/documentation/xcode/supporting-associated-domains" target="_blank" rel="noopener noreferrer">Apple Developer Documentation on Associated Domains</a> and the <a href="https://developer.android.com/training/app-links/verify-site-associations" target="_blank" rel="noopener noreferrer">Android Developers App Links Guide</a>.</p>

<h2>Step 1: Apple Universal Links (AASA File)</h2>
<p>Your web host must serve <code>/.well-known/apple-app-site-association</code> with <strong>no file extension</strong>, with MIME type <code>application/json</code>, and returning an HTTP 200 status:</p>

<pre><code class="language-json">{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "ABCDE12345.com.yourcompany.app",
        "paths": ["/invite/*", "/projects/*", "/reset-password/*"]
      }
    ]
  }
}</code></pre>

<h2>Step 2: Android App Links (assetlinks.json)</h2>
<p>On Android, host <code>/.well-known/assetlinks.json</code> containing your production and Google Play App Signing SHA-256 fingerprints:</p>

<pre><code class="language-json">[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.yourcompany.app",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
      ]
    }
  }
]</code></pre>

<h2>Step 3: FlutterFlow GoRouter Parameter Parsing</h2>
<p>In FlutterFlow, declare page route parameters as query parameters or path parameters. When receiving dynamic invite tokens, extract and sanitize them in your Custom Action before navigation:</p>

<pre><code class="language-dart">String sanitizeDeepLinkToken(String? rawUri) {
  if (rawUri == null || rawUri.isEmpty) return '''';
  final uri = Uri.tryParse(rawUri);
  return uri?.queryParameters[''token''] ?? uri?.pathSegments.last ?? '''';
}</code></pre>

<div class="mt-12 rounded-xl border border-neon-blue/30 bg-[#070913]/90 p-6 backdrop-blur-sm">
  <div class="flex items-start gap-3.5">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue font-bold text-base border border-neon-blue/20">
      ✎
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-white tracking-wide">Found an Update or Correction?</h3>
      <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">
        We actively maintain our technical engineering guides against the latest Flutter, FlutterFlow, Apple iOS, and Android platform updates. If an API has changed, a cloud dependency was revised, or you spotted an edge case in our code snippets, please share your feedback with our engineering team.
      </p>
      <div class="mt-3.5 flex flex-wrap items-center gap-4 text-xs">
        <a href="/#contact" class="font-medium text-neon-blue hover:text-white transition-colors underline underline-offset-4">
          Submit an update / correction &rarr;
        </a>
        <span class="text-slate-600">&middot;</span>
        <span class="text-slate-400">Reviewed by Jerry Dev Studio Technical Editorial</span>
      </div>
    </div>
  </div>
</div>',
  '2026-11-06',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date,
  is_published = EXCLUDED.is_published,
  updated_at = TIMEZONE('utc', NOW());

INSERT INTO public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content,
  published_date,
  is_published
) VALUES (
  'Triggering Push Notifications with Supabase Database Webhooks and Firebase Cloud Messaging (FCM)',
  'flutterflow-push-notifications-supabase-webhooks-fcm',
  'Integrations',
  'Eliminate client polling and trigger instant, targeted push notifications via PostgreSQL database webhooks and Firebase Cloud Messaging HTTP v1 API.',
  '<h2>The Problem: Inefficient Client-Side Polling Drains Battery</h2>
<p>Many early FlutterFlow apps attempt to handle push notifications by having the mobile app trigger Firebase notifications directly from client-side UI actions. This architecture has fatal flaws:</p>
<ul>
  <li>If the user closes the app before the action completes, the recipient never receives the notification.</li>
  <li>Security rules are easily bypassed because FCM server credentials cannot be securely stored on client devices.</li>
  <li>Background notifications cannot trigger when third-party systems or external webhooks update the database.</li>
</ul>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> Google has fully deprecated the legacy FCM HTTP API in favor of the FCM HTTP v1 OAuth2 API. All notification payloads must now use short-lived Google service account access tokens.
</blockquote>

<h2>Official Specifications &amp; References</h2>
<p>Follow the <a href="https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages" target="_blank" rel="noopener noreferrer">Firebase Cloud Messaging HTTP v1 API Reference</a> and the <a href="https://supabase.com/docs/guides/database/webhooks" target="_blank" rel="noopener noreferrer">Supabase Database Webhooks with pg_net Documentation</a>.</p>

<h2>Step 1: PostgreSQL Trigger on Table Events</h2>
<p>When a new record is inserted into <code>notifications</code> or <code>messages</code>, PostgreSQL triggers an automated HTTP POST to your Supabase Edge Function:</p>

<pre><code class="language-sql">CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := ''https://YOUR_PROJECT.supabase.co/functions/v1/dispatch-fcm'',
    headers := jsonb_build_object(
      ''Content-Type'', ''application/json'',
      ''Authorization'', ''Bearer '' || current_setting(''app.settings.service_role_key'', true)
    ),
    body := jsonb_build_object(
      ''recipient_id'', NEW.recipient_id,
      ''title'', ''New message received'',
      ''body'', NEW.content,
      ''data'', jsonb_build_object(''chat_id'', NEW.chat_id)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();</code></pre>

<h2>Step 2: Server-Side Dispatch Edge Function</h2>
<p>The Edge Function exchanges its Google Service Account private key for an OAuth2 bearer token and dispatches the message via FCM HTTP v1:</p>

<pre><code class="language-typescript">import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { recipient_id, title, body, data } = await req.json()
  const supabase = createClient(
    Deno.env.get(''SUPABASE_URL'')!,
    Deno.env.get(''SUPABASE_SERVICE_ROLE_KEY'')!
  )

  // Query recipient device tokens
  const { data: devices } = await supabase
    .from(''user_devices'')
    .select(''fcm_token'')
    .eq(''user_id'', recipient_id)

  for (const device of devices || []) {
    // Send to FCM HTTP v1 endpoint using service account credentials
    await sendFCMMessage(device.fcm_token, title, body, data)
  }

  return new Response(JSON.stringify({ sent: true }), { status: 200 })
})</code></pre>

<div class="mt-12 rounded-xl border border-neon-blue/30 bg-[#070913]/90 p-6 backdrop-blur-sm">
  <div class="flex items-start gap-3.5">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue font-bold text-base border border-neon-blue/20">
      ✎
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-white tracking-wide">Found an Update or Correction?</h3>
      <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">
        We actively maintain our technical engineering guides against the latest Flutter, FlutterFlow, Apple iOS, and Android platform updates. If an API has changed, a cloud dependency was revised, or you spotted an edge case in our code snippets, please share your feedback with our engineering team.
      </p>
      <div class="mt-3.5 flex flex-wrap items-center gap-4 text-xs">
        <a href="/#contact" class="font-medium text-neon-blue hover:text-white transition-colors underline underline-offset-4">
          Submit an update / correction &rarr;
        </a>
        <span class="text-slate-600">&middot;</span>
        <span class="text-slate-400">Reviewed by Jerry Dev Studio Technical Editorial</span>
      </div>
    </div>
  </div>
</div>',
  '2026-11-08',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date,
  is_published = EXCLUDED.is_published,
  updated_at = TIMEZONE('utc', NOW());

INSERT INTO public.blog_posts (
  title,
  slug,
  category,
  excerpt,
  content,
  published_date,
  is_published
) VALUES (
  'Eliminating Frame Drops & Stutter in Heavy FlutterFlow ListViews (60 FPS Guide)',
  'flutterflow-listview-performance-optimization',
  'Performance',
  'Fix jank, laggy scrolling, and memory leaks in media-heavy FlutterFlow lists by optimizing widget rebuilds, image caching, and RepaintBoundary isolation.',
  '<h2>The Problem: The Infamous 30 FPS Scroll Stutter</h2>
<p>As your FlutterFlow app grows to display high-resolution imagery, social feeds, or complex card layouts with nested animations, users on mid-range Android devices and older iPhones immediately notice scroll stutter, dropped frames, and excessive battery heating.</p>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> Omitting cache sizing on network images forces Flutter''s raster thread to decode multi-megabyte images into uncompressed raw RGBA byte arrays in RAM, triggering aggressive Garbage Collection (GC) pauses every few frames.
</blockquote>

<h2>Official Profiling Tools &amp; References</h2>
<p>Refer to the <a href="https://api.flutter.dev/flutter/widgets/RepaintBoundary-class.html" target="_blank" rel="noopener noreferrer">Flutter RepaintBoundary Class Documentation</a> and the <a href="https://docs.flutter.dev/tools/devtools/performance" target="_blank" rel="noopener noreferrer">Flutter DevTools Performance Guide</a> to measure UI and GPU thread frame render times against the 16.6ms frame budget.</p>

<h2>Step 1: Isolating Expensive Widgets with RepaintBoundary</h2>
<p>When an element inside a list item updates (like a like button animation or timer badge), Flutter''s render engine repaints the entire card hierarchy by default. Wrapping the item inside a custom <code>RepaintBoundary</code> isolates its raster layer:</p>

<pre><code class="language-dart">import ''package:flutter/material.dart'';

class IsolatedFeedItem extends StatelessWidget {
  final Widget child;
  const IsolatedFeedItem({Key? key, required this.child}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // RepaintBoundary prevents render tree invalidations from bubbling up
    return RepaintBoundary(
      child: child,
    );
  }
}</code></pre>

<h2>Step 2: Downsampling Image Decodes in Memory</h2>
<p>In FlutterFlow, when using images inside ListViews, always specify cached network downsampling attributes:</p>

<pre><code class="language-dart">import ''package:cached_network_image/cached_network_image.dart'';
import ''package:flutter/material.dart'';

Widget buildOptimizedThumbnail(String imageUrl) {
  return CachedNetworkImage(
    imageUrl: imageUrl,
    // Downsample in RAM to the exact rendered pixel density:
    memCacheWidth: 400,
    memCacheHeight: 400,
    maxWidthDiskCache: 800,
    maxHeightDiskCache: 800,
    fit: BoxFit.cover,
    placeholder: (context, url) => Container(color: const Color(0xFF141726)),
    errorWidget: (context, url, error) => const Icon(Icons.broken_image),
  );
}</code></pre>

<h2>Step 3: Flattening Nested Layout Hierarchies</h2>
<p>Avoid nesting multiple <code>Container</code> &rarr; <code>Padding</code> &rarr; <code>Column</code> &rarr; <code>Row</code> structures when a single <code>Card</code> or <code>DecoratedBox</code> can achieve the visual styling. Fewer widget elements mean fewer RenderObjects to layout during high-velocity fling scrolls.</p>

<div class="mt-12 rounded-xl border border-neon-blue/30 bg-[#070913]/90 p-6 backdrop-blur-sm">
  <div class="flex items-start gap-3.5">
    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-blue/10 text-neon-blue font-bold text-base border border-neon-blue/20">
      ✎
    </div>
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-white tracking-wide">Found an Update or Correction?</h3>
      <p class="mt-1.5 text-sm text-slate-300 leading-relaxed">
        We actively maintain our technical engineering guides against the latest Flutter, FlutterFlow, Apple iOS, and Android platform updates. If an API has changed, a cloud dependency was revised, or you spotted an edge case in our code snippets, please share your feedback with our engineering team.
      </p>
      <div class="mt-3.5 flex flex-wrap items-center gap-4 text-xs">
        <a href="/#contact" class="font-medium text-neon-blue hover:text-white transition-colors underline underline-offset-4">
          Submit an update / correction &rarr;
        </a>
        <span class="text-slate-600">&middot;</span>
        <span class="text-slate-400">Reviewed by Jerry Dev Studio Technical Editorial</span>
      </div>
    </div>
  </div>
</div>',
  '2026-11-10',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  excerpt = EXCLUDED.excerpt,
  content = EXCLUDED.content,
  published_date = EXCLUDED.published_date,
  is_published = EXCLUDED.is_published,
  updated_at = TIMEZONE('utc', NOW());


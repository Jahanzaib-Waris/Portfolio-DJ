import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBlogPost } from '../api/client'
import RichTextContent from '../components/RichTextContent'
import StatusPanel from '../components/StatusPanel'
import { Skeleton } from '../components/Skeleton'
import useDocumentMeta from '../hooks/useDocumentMeta'

const fallbackPostDetails = {
  'fix-flutterflow-google-maps-ios': {
    title: 'Fix: Google Maps blank screen on iOS release builds in FlutterFlow',
    published_date: 'Sep 18, 2026',
    category: 'FlutterFlow Fixes',
    content: `
<h2>The Problem</h2>
<p>In FlutterFlow, your Google Maps widget may render perfectly in Run Mode and on local iOS simulators, but turns into a solid grey or blank box immediately after releasing via TestFlight or App Store Connect.</p>

<blockquote class="is-style-fb-warning">
  <strong>Warning:</strong> iOS release builds enforce strict Info.plist key validation and separate Google Maps SDK API key declarations from Android manifest keys.
</blockquote>

<h2>Why it happens</h2>
<p>When Flutter compiles for release on iOS, the Google Maps SDK fails to initialize if the <code>io.flutter.embedded_views_preview</code> key or the Google Maps API Key is omitted from your Xcode project settings or FlutterFlow project configuration.</p>

<h2>The Fix</h2>
<ol>
  <li>Navigate to your <strong>Settings &rarr; App Details</strong> in FlutterFlow.</li>
  <li>Under <strong>Permissions / Plist</strong>, add:</li>
</ol>

<pre><code>&lt;key&gt;io.flutter.embedded_views_preview&lt;/key&gt;
&lt;true/&gt;</code></pre>

<p>Ensure your Google Cloud Console has an unrestricted iOS API Key with the bundle identifier matching your app identifier exactly.</p>
    `,
  },
  'custom-dart-action-with-return-value': {
    title: 'How to create custom Dart actions that return complex data in FlutterFlow',
    published_date: 'Sep 12, 2026',
    category: 'Custom Code',
    content: `
<h2>The Problem</h2>
<p>FlutterFlow's visual action builder is great for standard navigations, but when you need to parse nested JSON responses from a custom API or calculate subscription prorations, you need custom Dart code that returns structured data.</p>

<h2>The Solution</h2>
<p>In FlutterFlow, define a <strong>Custom Action</strong> with a defined return type (e.g. <code>JSON</code> or a custom Data Type). Paste your Dart function:</p>

<pre><code>Future&lt;dynamic&gt; calculateProration(
  DateTime currentPeriodEnd,
  double newPlanPrice,
) async {
  final now = DateTime.now();
  final daysLeft = currentPeriodEnd.difference(now).inDays;
  final dailyRate = newPlanPrice / 30.0;
  return {
    'daysLeft': daysLeft,
    'dueToday': (daysLeft * dailyRate).toStringAsFixed(2),
  };
}</code></pre>

<blockquote class="is-style-fb-tip">
  <strong>Tip:</strong> Always test custom actions with mock inputs directly in the FlutterFlow editor test tab before compiling.
</blockquote>
    `,
  },
  'supabase-auth-rls-flutterflow': {
    title: 'Connecting Supabase Row Level Security with FlutterFlow authenticated users',
    published_date: 'Aug 29, 2026',
    category: 'Integrations',
    content: `
<h2>The Problem</h2>
<p>Enabling Row Level Security (RLS) on Supabase tables often results in zero rows returned inside your FlutterFlow app because requests are sent anonymously without the user's JWT bearer token.</p>

<h2>The Fix</h2>
<p>Ensure that in FlutterFlow under <strong>Integrations &rarr; Supabase</strong>, you check <strong>Enable Auth</strong> and use the Supabase Auth action when users log in. This automatically injects the auth bearer token into every PostgreSQL query executed by the client SDK.</p>
    `,
  },
  'nested-scrollview-renderflex-overflow': {
    title: 'Resolving RenderFlex overflow errors in complex nested lists',
    published_date: 'Aug 14, 2026',
    category: 'FlutterFlow Fixes',
    content: `
<h2>The Problem</h2>
<p>You see yellow-and-black striped hazard bars with a message like: <em>A RenderFlex overflowed by 24 pixels on the bottom</em> or <em>Vertical viewport was given unbounded height</em>.</p>

<h2>The Fix</h2>
<p>Wrap the inner ListView in an <strong>Expanded</strong> widget, or set the ListView's property <strong>Shrink Wrap: True</strong> and <strong>Physics: NeverScrollableScrollPhysics</strong> if nested within a parent single-child scrollview.</p>
    `,
  },
}

export default function BlogDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loadState, setLoadState] = useState('loading')

  const effectivePost = post || fallbackPostDetails[slug]

  useDocumentMeta(effectivePost ? `${effectivePost.title} — Jahanzaib Waris` : undefined, effectivePost?.excerpt)

  useEffect(() => {
    setLoadState('loading')
    getBlogPost(slug)
      .then((data) => {
        setPost(data)
        setLoadState('ready')
      })
      .catch(() => {
        if (fallbackPostDetails[slug]) {
          setLoadState('ready')
        } else {
          setLoadState('error')
        }
      })
  }, [slug])

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Link
        to="/blogs"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[#38BDF8] hover:text-white transition-colors"
      >
        &larr; Back to Blog
      </Link>

      {loadState === 'loading' && !effectivePost && (
        <StatusPanel glow={false}>
          <Skeleton className="mb-6 h-52 w-full" />
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="mb-6 h-7 w-2/3" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </StatusPanel>
      )}

      {loadState === 'error' && !effectivePost && (
        <p className="text-status-red">Blog post not found.</p>
      )}

      {effectivePost && (
        <article className="overflow-hidden">
          {effectivePost.cover_image && (
            <img
              src={effectivePost.cover_image}
              alt={effectivePost.title}
              className="mb-8 h-auto w-full object-cover rounded-[24px] border border-panel-edge"
            />
          )}
          <div className="flex items-center gap-3 text-xs mb-3">
            {effectivePost.category && (
              <span className="fb-chip bg-neon-blue/10 border-neon-blue/30 text-neon-blue">
                {effectivePost.category}
              </span>
            )}
            <span className="font-mono-ui text-[#A1A7CA]">{effectivePost.published_date}</span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {effectivePost.title}
          </h1>
          <div className="mt-10 border-t border-panel-edge pt-10">
            <RichTextContent className="markdown-body">
              {effectivePost.content}
            </RichTextContent>
          </div>
        </article>
      )}
    </div>
  )
}

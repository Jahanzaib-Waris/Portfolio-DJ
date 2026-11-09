// Prototype registry: every interactive demo on /prototypes is listed here.
//
// To add a prototype:
//   1. Create src/prototypes/<slug>/<Component>.jsx (default export; self-contained, dummy data only).
//   2. Add an entry below (the component is loaded lazily, so it costs nothing until opened).
//   3. Add the page to frontend/public/sitemap.xml.
// See docs/PROTOTYPES.md.

export const prototypes = [
  {
    slug: 'swipe-cards',
    accent: 'pink',
    colour: '#FF8FB8',
    url: 'meetly.example/discover',
    title: 'Swipe cards',
    category: 'Mobile UX',
    tagline: 'Swipe left to favourite, right to skip.',
    summary:
      'A card stack driven by touch, mouse or keyboard. Drag a card and it follows your finger, tilts, and flies off the screen; a left swipe saves it to favourites and a right swipe skips it.',
    tags: ['Gestures', 'Discovery', 'Favourites'],
    shows: [
      'Drag, tilt and fling animation that feels native',
      'Left swipe saves to favourites, right swipe skips, with undo',
      'Works with buttons and the arrow keys, so it stays accessible',
      'A favourites tray that updates instantly',
    ],
    production: [
      'Cards loaded from your database, with paging and prefetching of images',
      'Favourites and skips saved per user, so decks never repeat',
      'Matching, filters and "who liked me" on top of the same gesture',
      'Haptics and native-feel physics in the Flutter build',
    ],
    stack: 'Flutter / FlutterFlow, Supabase',
    quoteNote: 'swipe cards where a left swipe saves to favourites and a right swipe skips',
    load: () => import('./swipe-cards/SwipeCards'),
  },
  {
    slug: 'ai-chat',
    accent: 'lavender',
    colour: '#B39DFF',
    url: 'brewly.example/help',
    title: 'AI chat with rules',
    category: 'AI',
    tagline: 'An assistant that answers the way your brand does.',
    summary:
      'Same question, different voice. Switch the assistant between personas to see how its tone, format and boundaries change, including a polite refusal off-topic and a hand-off to a human.',
    tags: ['Chatbot', 'Personas', 'Guardrails'],
    shows: [
      'A specific tone and answer format per persona (for example, always three bullets)',
      'Guardrails: it stays on topic and never quotes prices',
      'Hand-off to a human when it should not answer',
      'Typing indicator and streamed replies',
    ],
    production: [
      'A real language model with your instructions, knowledge base and tone',
      'Answers grounded in your documents, with sources',
      'Conversation memory, rate limits and abuse protection',
      'Analytics on what customers ask and where the bot hands off',
    ],
    stack: 'Supabase Edge Functions, an LLM API, Flutter / web chat UI',
    quoteNote: 'an AI chat assistant that answers in a specific tone and format and hands off to a person',
    load: () => import('./ai-chat/AiChat'),
  },
  {
    slug: 'voice-chat',
    accent: 'peach',
    colour: '#FFAB7A',
    url: 'brewly.example/voice',
    title: 'Voice chat with AI',
    category: 'AI',
    tagline: 'Talk to the assistant and hear it answer.',
    summary:
      'Press the microphone, speak, and the assistant replies out loud. The demo uses your browser’s built-in speech tools and falls back to typing if your browser does not support them.',
    tags: ['Voice', 'Speech', 'Accessibility'],
    shows: [
      'Listening, thinking and speaking states with clear feedback',
      'Spoken replies with a stop button',
      'A typed fallback for browsers or users without a microphone',
      'The same assistant brain as the chat demo',
    ],
    production: [
      'Server-side speech-to-text and natural text-to-speech voices',
      'Streaming audio so replies start in under a second',
      'Barge-in (interrupt the assistant) and noise handling on mobile',
      'Transcripts, consent and data-retention controls',
    ],
    stack: 'Flutter, speech APIs, Supabase Edge Functions, an LLM API',
    quoteNote: 'voice chat with an AI assistant on mobile',
    load: () => import('./voice-chat/VoiceChat'),
  },
  {
    slug: 'nearby-map',
    accent: 'mint',
    colour: '#6FDDB8',
    url: 'meetly.example/nearby',
    title: 'Map with custom pins',
    category: 'Maps',
    tagline: 'People and projects around you, on a map.',
    summary:
      'A custom map where people and projects have their own pin styles. Filter by type and interest, set a radius, tap a pin for details, and see the same results as a list sorted by distance.',
    tags: ['Maps', 'Nearby', 'Filters'],
    shows: [
      'Different pin designs for people and projects',
      'A radius slider that dims everything out of range',
      'Pan and zoom, and tap a pin for a detail card',
      'A distance-sorted list kept in sync with the map',
    ],
    production: [
      'Real map tiles (Google, Mapbox or OpenStreetMap) and live location',
      'Nearby search in the database so thousands of pins stay fast',
      'Clustering, live updates and privacy controls (approximate location)',
      'Chat or join requests straight from a pin',
    ],
    stack: 'Flutter, Google Maps or Mapbox, Supabase with PostGIS',
    quoteNote: 'a map showing nearby people and projects with custom pins for a social platform',
    load: () => import('./map-pins/MapPins'),
  },
  {
    slug: 'survey-match',
    accent: 'lemon',
    colour: '#FFD95A',
    url: 'meetly.example/find-your-people',
    title: 'Survey-based matching',
    category: 'Personalisation',
    tagline: 'A short survey that ranks who or what suits you.',
    summary:
      'Answer six quick questions and get a ranked list with a match score and the reasons behind it. Then filter and re-sort the results. The scoring is shown openly, so you can see how it works.',
    tags: ['Survey', 'Recommendations', 'Scoring'],
    shows: [
      'A guided multi-step survey with validation and progress',
      'A weighted match score with the reasons for each result',
      'Filters and sorting on the results',
      'A transparent breakdown instead of a black box',
    ],
    production: [
      'Profiles and answers stored per user, scores computed on the server',
      'Weights tuned from real behaviour (clicks, replies, retention)',
      'Re-ranking as people update their answers',
      'Feeds, notifications and A/B tests of the algorithm',
    ],
    stack: 'Flutter / web, Supabase (SQL scoring or an Edge Function)',
    quoteNote: 'filtering and recommendations based on a survey score for a social platform',
    load: () => import('./survey-match/SurveyMatch'),
  },
]

export const getPrototype = (slug) => prototypes.find((p) => p.slug === slug)
export const prototypeCategories = ['All', ...new Set(prototypes.map((p) => p.category))]

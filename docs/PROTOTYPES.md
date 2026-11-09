# Prototypes (Feature Lab)

Interactive demos of common app features, shown at `/prototypes` and `/prototypes/<slug>`, so a prospective client can try a feature and then say "something like this". Everything runs in the browser with made-up data; nothing is sent to or stored by the site.

## What exists

| Slug | Demo | Notes |
|---|---|---|
| `swipe-cards` | Tinder-style card stack | Left swipe = save to favourites, right swipe = skip (set in `swipe-cards/swipeLogic.js`). Pointer drag, buttons and arrow keys, undo, favourites tray |
| `ai-chat` | Chat with switchable personas | Scripted (no AI model, no cost). Shows tone, answer format, guardrails and hand-off. Brain in `ai-chat/assistantBrain.js` |
| `voice-chat` | Talk to the assistant | Browser speech recognition + speech synthesis, typed fallback. Shares the brain with `ai-chat` |
| `nearby-map` | Map with custom pins | Hand-drawn SVG map (no map library, no external tiles, so no third-party requests). Filters, radius, pan/zoom, list. Maths in `map-pins/geo.js` |
| `survey-match` | Survey-scored recommendations | Six questions, weighted score with a visible breakdown. Scoring in `survey-match/scoring.js` |

## How it is built

- `src/prototypes/registry.js` lists every prototype (title, summary, what it shows, what a real build adds, stack, quote wording). The gallery, detail pages, Home teaser and sitemap entries all read from it.
- Each demo is its own lazily loaded component (3-5 KB gzipped each), so nothing is downloaded until a visitor opens it.
- Shared look and pieces live in `src/prototypes/ui.jsx` (`DemoShell`, `Avatar`, `Chip`, `ProtoIcon`) and `usePrefersReducedMotion.js`.
- Logic that can be tested is kept out of the components in pure files (`swipeLogic.js`, `assistantBrain.js`, `geo.js`, `scoring.js`).
- "Ask about this feature" opens the quote form pre-filled with the prototype's name (`onRequestQuoteWith` in `PublicLayout`).
- Page views of `/prototypes/*` appear in Analytics, so you can see which demos get used.

## Adding a prototype

1. Create `src/prototypes/<slug>/<Name>.jsx` with a default-exported, self-contained component. Wrap it in `DemoShell`, use only dummy data (fictional names, no photos), and make it work with touch, mouse and keyboard at 320px wide.
2. Put any testable logic in a separate pure `.js` file and check it with a quick Node script.
3. Add an entry to `registry.js` (and an icon path for the slug in `ui.jsx` `ICONS`).
4. Add `/prototypes/<slug>` to `frontend/public/sitemap.xml`.
5. If the demo touches new browser capabilities (camera, microphone, location, third-party requests), update `src/pages/Privacy.jsx` first.

## Rules

- Dummy data only. Never real people, real photos or real prices.
- No third-party services or trackers (the privacy notice says there are none). Use a library only when it adds no external requests.
- Be honest about what is simulated: each page says the data is made up, and the AI demos say their replies are scripted.
- Keep the voice demo disclosure ("your browser's speech tools may send audio to its provider") visible.

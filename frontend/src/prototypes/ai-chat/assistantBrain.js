// The scripted "brain" behind the AI chat and voice demos.
//
// It is deliberately not an AI model: replies are written per persona so the demo is free,
// instant and predictable. It shows what a client controls in a real build: tone, answer
// format, topic boundaries and when to hand off to a person.
// A production version replaces `reply()` with a call to a language model that is given
// these same rules as its instructions.

export const COMPANY = 'Brewly' // fictional coffee subscription used for the demo

export const PERSONAS = [
  {
    id: 'nova',
    name: 'Nova',
    role: 'Friendly support agent',
    blurb: 'Warm and conversational.',
    rules: ['Warm, short paragraphs', 'Always ends with a follow-up question', 'Never quotes prices; offers a person instead', `Stays on ${COMPANY} orders and coffee`],
  },
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Concise advisor',
    blurb: 'Straight to the point.',
    rules: ['At most three bullet points', 'No small talk', 'Never quotes prices; hands off', `Stays on ${COMPANY} orders and coffee`],
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Playful guide',
    blurb: 'Explains with analogies.',
    rules: ['Uses one simple analogy', 'Light humour, never sarcasm', 'Never quotes prices; hands off', `Stays on ${COMPANY} orders and coffee`],
  },
]

export const SUGGESTIONS = [
  'Where is my order?',
  'How much does it cost?',
  'I want to pause my plan',
  'Recommend a coffee',
  "What's the weather like?",
  'Can I talk to a person?',
]

const has = (text, words) => words.some((w) => new RegExp(`\\b${w}`, 'i').test(text))

// Checked in this order; the first match wins.
const INTENTS = [
  { id: 'human', test: (t) => has(t, ['human', 'person', 'agent', 'someone', 'representative', 'talk to', 'speak to']) },
  { id: 'pricing', test: (t) => has(t, ['price', 'prices', 'pricing', 'cost', 'costs', 'how much', 'expensive', 'cheap', 'discount', 'fee']) },
  { id: 'refund', test: (t) => has(t, ['refund', 'money back', 'cancel', 'complaint', 'damaged', 'broken', 'wrong item']) },
  { id: 'pause', test: (t) => has(t, ['pause', 'skip a', 'hold my', 'holiday', 'vacation', 'stop my']) },
  { id: 'delivery', test: (t) => has(t, ['order', 'delivery', 'deliver', 'ship', 'shipping', 'arrive', 'track', 'where is', 'parcel', 'package']) },
  { id: 'recommend', test: (t) => has(t, ['recommend', 'suggest', 'roast', 'beans', 'coffee', 'flavour', 'flavor', 'taste', 'best', 'which']) },
  { id: 'greeting', test: (t) => has(t, ['hi', 'hello', 'hey', 'good morning', 'good evening', 'howdy']) },
  { id: 'thanks', test: (t) => has(t, ['thanks', 'thank you', 'cheers', 'great', 'perfect']) },
  { id: 'offtopic', test: (t) => has(t, ['weather', 'politic', 'election', 'stock', 'bitcoin', 'crypto', 'joke', 'movie', 'football', 'homework', 'code', 'write me', 'poem', 'news', 'president']) },
]

const HANDOFF = new Set(['human', 'pricing', 'refund'])

const R = {
  greeting: {
    nova: `Hi there! Welcome to ${COMPANY}. I can help with deliveries, pausing your plan, or finding a coffee you'll love. What would you like to do today?`,
    atlas: 'Hello. I can help with:\n• Delivery timing\n• Pausing or changing your plan\n• Coffee recommendations',
    sage: `Hello! Think of me as the barista at the counter: ask me about deliveries, pausing, or what to brew next.`,
  },
  thanks: {
    nova: "You're very welcome! Is there anything else I can help you with?",
    atlas: 'Glad to help.',
    sage: "Anytime. Consider it a free refill on advice.",
  },
  delivery: {
    nova: 'Orders leave our roastery on Mondays and usually arrive within 2 to 3 working days. You can see your exact delivery day in the Orders tab of the app. Would you like to change your delivery day?',
    atlas: '• Ships on Mondays\n• Arrives in 2 to 3 working days\n• Exact date: Orders tab in the app',
    sage: 'A delivery is like a good espresso shot: roasted fresh on Monday, in your hands within 2 to 3 working days. The exact day is in the Orders tab of the app.',
  },
  pause: {
    nova: 'Of course, you can pause any time with no fee. Open Plan, tap Pause, and choose a restart date. Would you like me to walk you through it?',
    atlas: '• Open Plan\n• Tap Pause\n• Choose a restart date (no fee)',
    sage: 'Pausing is like pressing hold on the grinder: Plan, then Pause, then pick a date. Your preferences stay saved while you are away.',
  },
  recommend: {
    nova: "Happy to help! If you like something smooth and chocolatey, try our Medium Roast. If you enjoy bright, fruity flavours, the Light Roast is lovely. Which sounds closer to you?",
    atlas: '• Smooth and chocolatey: Medium roast\n• Bright and fruity: Light roast\n• Bold and smoky: Dark roast',
    sage: 'Choosing a roast is like choosing music: light is acoustic and bright, medium is easy pop, dark is rock and roll. Which mood are you in?',
  },
  pricing: {
    nova: "I can't share prices myself, because plans change and I'd rather you get the right number. I can connect you with a teammate who can. Shall I do that?",
    atlas: "I don't quote prices.\n• A teammate can give current figures\n• Use the button below to reach one",
    sage: "Prices are the one thing I keep off the menu, because I don't want to guess. A human teammate can give you the exact figure, and the button below connects you.",
  },
  refund: {
    nova: "I'm sorry about that. A teammate needs to look at refunds and cancellations so it's done properly. Shall I connect you with someone now?",
    atlas: 'Refunds and cancellations need a person.\n• Use the button below to reach one',
    sage: "That's a job for a human barista rather than me, since refunds need a real look at your order. The button below will connect you.",
  },
  human: {
    nova: "Of course. Tap the button below and a teammate will pick this up. Is there anything I should tell them first?",
    atlas: 'Connecting you.\n• Use the button below',
    sage: "Absolutely, I'll hand you to a person. The button below does it.",
  },
  offtopic: {
    nova: `That's outside what I can help with here, but I'm happy to help with your ${COMPANY} orders or coffee questions. What can I do for you?`,
    atlas: `Out of scope. I only cover ${COMPANY} orders, plans and coffee.`,
    sage: `That one is beyond my counter! I'm only here for ${COMPANY} coffee, deliveries and plans.`,
  },
  fallback: {
    nova: "I'm not sure I understood that. Do you mean a delivery, pausing your plan, or a coffee suggestion?",
    atlas: 'Unclear. Pick one:\n• Delivery\n• Pause plan\n• Coffee suggestion',
    sage: "I didn't quite catch that. Are you after a delivery, a pause, or a coffee tip?",
  },
}

/** Works out which intent a message matches ('fallback' when none do). */
export function detectIntent(message) {
  const text = (message || '').trim()
  if (!text) return 'fallback'
  const found = INTENTS.find((intent) => intent.test(text))
  return found ? found.id : 'fallback'
}

/**
 * The assistant's reply to a message in a persona's style.
 * Returns { text, intent, handoff, refused }.
 */
export function reply(personaId, message) {
  const persona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0]
  const intent = detectIntent(message)
  return {
    text: R[intent][persona.id],
    intent,
    handoff: HANDOFF.has(intent),
    refused: intent === 'offtopic',
  }
}

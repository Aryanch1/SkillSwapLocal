import { API_BASE } from './config';
import {
  CATEGORIES,
  type AiSource,
  type Category,
  type Intro,
  type IntroRequestInput,
  type IntroResponse,
  type Listing,
  type Match,
  type MatchRequestInput,
  type MatchResponse,
  type Neighbor,
  type SuggestRequestInput,
  type SuggestResponse,
} from './types';

/* ------------------------------------------------------------------ */
/* Seeded demo data — 6 neighbors, 8 offers, 6 requests. Clearly      */
/* labelled demo in the UI, clearable from Settings. No money ever    */
/* changes hands on SkillSwapLocal: every swap is a trade of time     */
/* and skill between neighbors.                                        */
/* ------------------------------------------------------------------ */

export const NEIGHBORS: Neighbor[] = [
  {
    id: 'n-maya',
    name: 'Maya R.',
    initials: 'MR',
    distanceMi: 0.4,
    swaps: 12,
    rating: 4.9,
    skills: ['Fix a leaky tap', 'Hang shelves', 'Patch drywall'],
    color: '#1F5FA8',
  },
  {
    id: 'n-dev',
    name: 'Dev P.',
    initials: 'DP',
    distanceMi: 0.6,
    swaps: 9,
    rating: 4.8,
    skills: ['Fix a flat bike tire', 'Tune up a bicycle'],
    color: '#3E9B6A',
  },
  {
    id: 'n-sofia',
    name: 'Sofia L.',
    initials: 'SL',
    distanceMi: 0.8,
    swaps: 15,
    rating: 5.0,
    skills: ['Beginner guitar lessons', 'Piano basics for kids'],
    color: '#7E5A9E',
  },
  {
    id: 'n-tom',
    name: 'Tom H.',
    initials: 'TH',
    distanceMi: 1.1,
    swaps: 7,
    rating: 4.7,
    skills: ['Prune roses', 'Build a raised garden bed'],
    color: '#D99415',
  },
  {
    id: 'n-priya',
    name: 'Priya K.',
    initials: 'PK',
    distanceMi: 0.5,
    swaps: 11,
    rating: 4.9,
    skills: ['Spanish conversation practice', 'Hindi basics'],
    color: '#E4572E',
  },
  {
    id: 'n-jordan',
    name: 'Jordan M.',
    initials: 'JM',
    distanceMi: 1.3,
    swaps: 6,
    rating: 4.8,
    skills: ['Dog walking', 'Pet sitting for a weekend'],
    color: '#123F73',
  },
];

export function neighborById(id: string): Neighbor | undefined {
  return NEIGHBORS.find((n) => n.id === id);
}

const DAY = 86400000;
const now = Date.now();

const SEED: Omit<Listing, 'id' | 'createdAt'>[] = [
  {
    kind: 'offer',
    title: 'Fix a leaky tap',
    category: 'Home repair',
    description:
      'I can fix a dripping tap, swap a washer, or tighten up a loose faucet. I bring my own tools and I have done this for a dozen neighbors already.',
    neighborId: 'n-maya',
    distanceMi: 0.4,
    when: 'Weekends',
    where: 'Your place',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Fix a flat bike tire',
    category: 'Home repair',
    description:
      'Flat tire, squeaky brakes, or a chain that keeps slipping — I will sort it out on your porch in about half an hour.',
    neighborId: 'n-dev',
    distanceMi: 0.6,
    when: 'Weekday evenings',
    where: 'Maple St',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Beginner guitar lessons',
    category: 'Lessons',
    description:
      'Four friendly lessons to get you strumming your first three chords. Guitar provided if you do not have one yet. All ages welcome.',
    neighborId: 'n-sofia',
    distanceMi: 0.8,
    when: 'Sat mornings',
    where: 'My place',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Prune roses and tidy the garden',
    category: 'Garden & outdoor',
    description:
      'Spring pruning, weeding, and a general tidy-up for small gardens. I bring gloves, shears, and a green thumb.',
    neighborId: 'n-tom',
    distanceMi: 1.1,
    when: 'Sunday afternoons',
    where: 'Your garden',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Spanish conversation practice',
    category: 'Language',
    description:
      'Thirty minutes of relaxed Spanish chat over coffee — no textbooks, no tests, just talking. Great if you are brushing up for a trip.',
    neighborId: 'n-priya',
    distanceMi: 0.5,
    when: 'Tue & Thu evenings',
    where: 'Corner cafe',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Dog walking while you are away',
    category: 'Pets',
    description:
      'Happy to walk your dog on weekday mornings — one hour, your usual route, with a photo update after every walk.',
    neighborId: 'n-jordan',
    distanceMi: 1.3,
    when: 'Weekday mornings',
    where: 'Your street',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Hang shelves and pictures',
    category: 'Home repair',
    description:
      'Straight, level, and solid — I will hang shelves, mirrors, and pictures, and patch the old holes when we move things around.',
    neighborId: 'n-maya',
    distanceMi: 0.4,
    when: 'Weekends',
    where: 'Your place',
    status: 'open',
  },
  {
    kind: 'offer',
    title: 'Piano basics for kids',
    category: 'Lessons',
    description:
      'Gentle first piano lessons for children aged 6 to 10. Thirty minutes, once a week, with songs they actually like.',
    neighborId: 'n-sofia',
    distanceMi: 0.8,
    when: 'Wed afternoons',
    where: 'My place',
    status: 'open',
  },
  {
    kind: 'request',
    title: 'Need help fixing a wobbly bookshelf',
    category: 'Home repair',
    description:
      'My bookshelf wobbles every time someone walks past. Looking for someone handy who can brace it to the wall this weekend.',
    neighborId: 'n-dev',
    distanceMi: 0.6,
    when: 'This weekend',
    where: 'My place',
    status: 'open',
  },
  {
    kind: 'request',
    title: 'Looking for Spanish practice partner',
    category: 'Language',
    description:
      'I am learning Spanish and I freeze up when I try to speak. Hoping to meet once a week for a relaxed chat — I can help with English in return.',
    neighborId: 'n-tom',
    distanceMi: 1.1,
    when: 'Evenings',
    where: 'Corner cafe',
    status: 'open',
  },
  {
    kind: 'request',
    title: 'Help moving a couch up two flights',
    category: 'Moving & errands',
    description:
      'Just bought a second-hand couch and I need a second pair of hands to carry it up the stairs. About twenty minutes, Saturday morning.',
    neighborId: 'n-jordan',
    distanceMi: 1.3,
    when: 'Saturday morning',
    where: 'My building',
    urgent: true,
    status: 'open',
  },
  {
    kind: 'request',
    title: 'Teach me to bake sourdough',
    category: 'Cooking',
    description:
      'I have a starter that I am scared of killing. Looking for a patient neighbor to show me the ropes — I will bring the flour.',
    neighborId: 'n-priya',
    distanceMi: 0.5,
    when: 'Sunday mornings',
    where: 'My kitchen',
    status: 'open',
  },
  {
    kind: 'request',
    title: 'Dog walked while I am at work',
    category: 'Pets',
    description:
      'My beagle needs a midday walk on weekdays. One hour, same route every day, and she is very friendly.',
    neighborId: 'n-maya',
    distanceMi: 0.4,
    when: 'Weekday middays',
    where: 'Your street',
    status: 'open',
  },
  {
    kind: 'request',
    title: 'Help me set up my new phone',
    category: 'Tech help',
    description:
      'New phone, old contacts stuck on the old one. Looking for someone patient to help me move everything over and set up email.',
    neighborId: 'n-sofia',
    distanceMi: 0.8,
    when: 'Any evening',
    where: 'My place',
    status: 'open',
  },
];

export function seedListings(): Listing[] {
  return SEED.map((s, i) => ({
    ...s,
    id: `demo-${i}`,
    createdAt: now - (i + 1) * 3600000,
    isDemo: true,
  }));
}

export const TOTAL_SWAPS_NEARBY = NEIGHBORS.reduce((n, nb) => n + nb.swaps, 0);

/* ------------------------------------------------------------------ */
/* Demo matcher — honest on-device fallback. Scores an offer against   */
/* a request from exactly the facts given: same category (+50),        */
/* distance (+20 scaled), neighbor rating (+15 scaled), neighbor       */
/* swap experience (+10 scaled), and timing overlap (+5). Nothing is  */
/* invented; the reasons shown are the facts that earned the points.   */
/* ------------------------------------------------------------------ */

function timingOverlaps(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase();
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'weekend', 'weekday', 'morning', 'evening', 'afternoon'];
  const aDays = days.filter((d) => norm(a).includes(d));
  const bDays = days.filter((d) => norm(b).includes(d));
  if (aDays.includes('weekend') && bDays.includes('saturday')) return true;
  if (aDays.includes('weekend') && bDays.includes('sunday')) return true;
  if (bDays.includes('weekend') && aDays.includes('saturday')) return true;
  if (bDays.includes('weekend') && aDays.includes('sunday')) return true;
  if (aDays.includes('weekday') && bDays.some((d) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d))) return true;
  if (bDays.includes('weekday') && aDays.some((d) => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(d))) return true;
  return aDays.some((d) => bDays.includes(d));
}

export function scoreOffer(request: Listing, offer: Listing): Match {
  const reasons: string[] = [];
  let score = 0;
  if (offer.category === request.category) {
    score += 50;
    reasons.push(`Same skill: ${request.category}`);
  } else {
    reasons.push('Different skill, nearby neighbor');
  }
  const distPoints = Math.max(0, Math.round(20 - offer.distanceMi * 8));
  score += distPoints;
  reasons.push(`${offer.distanceMi.toFixed(1)} mi away`);
  const neighbor = neighborById(offer.neighborId);
  if (neighbor) {
    score += Math.round(((neighbor.rating - 4.5) / 0.5) * 15);
    reasons.push(`Rated ${neighbor.rating.toFixed(1)} · ${neighbor.swaps} swaps done`);
    score += Math.min(10, Math.round(neighbor.swaps / 2));
  }
  if (timingOverlaps(request.when, offer.when)) {
    score += 5;
    reasons.push('Timing lines up');
  }
  return { listingId: offer.id, score: Math.max(40, Math.min(97, score)), reasons };
}

export function demoMatch(request: Listing, offers: Listing[]): Match[] {
  return offers
    .filter((o) => o.kind === 'offer' && o.status === 'open')
    .map((o) => scoreOffer(request, o))
    .sort((a, b) => b.score - a.score);
}

export async function matchRequest(input: MatchRequestInput): Promise<{ matches: Match[]; source: AiSource }> {
  const url = API_BASE ? `${API_BASE}/api/match` : '/api/match';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request: input.request, offers: input.offers }),
    });
    if (!res.ok) return { matches: demoMatch(input.request, input.offers), source: 'demo' };
    const data = (await res.json()) as MatchResponse;
    if (!data.matches || data.matches.length === 0) {
      return { matches: demoMatch(input.request, input.offers), source: 'demo' };
    }
    return { matches: data.matches, source: data.source ?? 'live' };
  } catch {
    return { matches: demoMatch(input.request, input.offers), source: 'demo' };
  }
}

/* ------------------------------------------------------------------ */
/* Demo intro writer — friendly first hello to a neighbor, built      */
/* only from the listing and neighbor facts given. Tones: friendly,   */
/* short, grateful.                                                    */
/* ------------------------------------------------------------------ */

export function demoIntro(listing: Listing, neighborName: string, tone: string): Intro {
  const firstName = neighborName.split(' ')[0];
  const opener =
    tone === 'short'
      ? `Hi ${firstName}!`
      : tone === 'grateful'
        ? `Hi ${firstName}, I hope you are having a good day!`
        : `Hi ${firstName}! I am your neighbor, just down the street.`;
  const body =
    listing.kind === 'offer'
      ? `I saw your offer "${listing.title}" on SkillSwapLocal and it caught my eye. ${listing.description.split('.')[0]}.`
      : `I saw your request "${listing.title}" on SkillSwapLocal and I think I can help.`;
  const closer =
    tone === 'short'
      ? `Would ${listing.when.toLowerCase()} work for a quick chat?`
      : tone === 'grateful'
        ? `I would really appreciate your help, and I am happy to return the favor any time. Would ${listing.when.toLowerCase()} suit you for a quick chat?`
        : `Would ${listing.when.toLowerCase()} suit you for a quick hello? Happy to meet at ${listing.where.toLowerCase()} or wherever suits you best.`;
  return {
    message: `${opener} ${body} ${closer}\n\nThanks so much — looking forward to meeting a neighbor!`,
    source: 'demo',
  };
}

export async function writeIntro(input: IntroRequestInput): Promise<Intro> {
  const url = API_BASE ? `${API_BASE}/api/intro` : '/api/intro';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing: input.listing, neighbor: input.neighborName, tone: input.tone }),
    });
    if (!res.ok) return demoIntro(input.listing, input.neighborName, input.tone);
    const data = (await res.json()) as IntroResponse;
    if (!data.message) return demoIntro(input.listing, input.neighborName, input.tone);
    return { message: data.message, source: data.source ?? 'live' };
  } catch {
    return demoIntro(input.listing, input.neighborName, input.tone);
  }
}

/* ------------------------------------------------------------------ */
/* Category suggestion — keyword scan of the free text the user typed. */
/* ------------------------------------------------------------------ */

const CATEGORY_KEYWORDS: { match: RegExp; category: Category; title: string }[] = [
  { match: /tap|leak|plumb|shelf|hang|drill|fix|repair|wobbly|bookshelf|door|faucet/i, category: 'Home repair', title: 'Help with a home repair' },
  { match: /garden|plant|prune|rose|weed|lawn|tree|flower/i, category: 'Garden & outdoor', title: 'Garden help' },
  { match: /guitar|piano|lesson|teach|learn.*(music|instrument)|violin/i, category: 'Lessons', title: 'Music lessons' },
  { match: /spanish|french|english|language|speak|conversation/i, category: 'Language', title: 'Language practice' },
  { match: /dog|cat|pet|beagle|puppy|kitten|walk.*dog/i, category: 'Pets', title: 'Pet help' },
  { match: /move|moving|couch|furniture|carry|lift|boxes/i, category: 'Moving & errands', title: 'Help moving something' },
  { match: /phone|computer|laptop|wifi|email|app|set up|tech/i, category: 'Tech help', title: 'Tech help' },
  { match: /bake|cook|recipe|sourdough|dinner|kitchen/i, category: 'Cooking', title: 'Cooking help' },
];

export function demoSuggest(description: string): { category: Category; title: string } {
  const hit = CATEGORY_KEYWORDS.find((k) => k.match.test(description));
  if (hit) return { category: hit.category, title: hit.title };
  const words = description.trim().split(/\s+/).filter(Boolean).slice(0, 6).join(' ');
  return { category: 'Other', title: words ? `Help with: ${words}` : 'Neighbor help' };
}

export async function suggestFromText(input: SuggestRequestInput): Promise<{ category: Category; title: string; source: AiSource }> {
  const url = API_BASE ? `${API_BASE}/api/suggest` : '/api/suggest';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: input.description }),
    });
    if (!res.ok) return { ...demoSuggest(input.description), source: 'demo' };
    const data = (await res.json()) as SuggestResponse;
    if (!data.category || !CATEGORIES.some((c) => c.name === data.category)) {
      return { ...demoSuggest(input.description), source: 'demo' };
    }
    return { category: data.category, title: data.title ?? demoSuggest(input.description).title, source: data.source ?? 'live' };
  } catch {
    return { ...demoSuggest(input.description), source: 'demo' };
  }
}

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

export function prettyDistance(mi: number): string {
  return `${mi.toFixed(1)} mi`;
}

export function timeAgo(createdAt: number): string {
  const hours = Math.max(1, Math.round((Date.now() - createdAt) / 3600000));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export { DAY };

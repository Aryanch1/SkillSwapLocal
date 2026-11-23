/** SkillSwapLocal shared types. */

export type Category =
  | 'Home repair'
  | 'Garden & outdoor'
  | 'Lessons'
  | 'Language'
  | 'Pets'
  | 'Moving & errands'
  | 'Tech help'
  | 'Cooking'
  | 'Other';

export const CATEGORIES: { name: Category; glyph: string; color: string }[] = [
  { name: 'Home repair', glyph: '🔧', color: '#1F5FA8' },
  { name: 'Garden & outdoor', glyph: '🌱', color: '#3E9B6A' },
  { name: 'Lessons', glyph: '🎸', color: '#7E5A9E' },
  { name: 'Language', glyph: '💬', color: '#D99415' },
  { name: 'Pets', glyph: '🐾', color: '#E4572E' },
  { name: 'Moving & errands', glyph: '📦', color: '#526174' },
  { name: 'Tech help', glyph: '💻', color: '#123F73' },
  { name: 'Cooking', glyph: '🍳', color: '#C96A2B' },
  { name: 'Other', glyph: '🤝', color: '#8A96A6' },
];

export function categoryGlyph(category: string): string {
  return CATEGORIES.find((c) => c.name === category)?.glyph ?? '🤝';
}

export function categoryColor(category: string): string {
  return CATEGORIES.find((c) => c.name === category)?.color ?? '#8A96A6';
}

export interface Neighbor {
  id: string;
  name: string;
  /** First name + last initial, as shown on the board. */
  initials: string;
  /** Miles from the user. */
  distanceMi: number;
  /** Swaps completed nearby. */
  swaps: number;
  /** Average rating, 1–5. */
  rating: number;
  skills: string[];
  color: string;
}

export type ListingKind = 'offer' | 'request';

export type ListingStatus = 'open' | 'matched' | 'done';

export interface Listing {
  id: string;
  kind: ListingKind;
  title: string;
  category: Category;
  description: string;
  neighborId: string;
  /** Miles from the user. */
  distanceMi: number;
  /** Free-text timing, e.g. "Weekends" or "Tue & Thu evenings". */
  when: string;
  /** Free-text place, e.g. "Maple St" or "My place". */
  where: string;
  urgent?: boolean;
  status: ListingStatus;
  /** Epoch milliseconds the listing was posted. */
  createdAt: number;
  /** Listing the user posted themselves. */
  mine?: boolean;
  /** Seeded demo content — clearable from Settings. */
  isDemo?: boolean;
}

export interface Match {
  listingId: string;
  /** 0–100. */
  score: number;
  /** Short human reasons, e.g. "Same skill · 0.4 mi away". */
  reasons: string[];
}

export type AiSource = 'live' | 'demo';

export interface Intro {
  message: string;
  source: AiSource;
}

export interface HistoryEntry {
  id: string;
  listingId: string;
  /** Short label, e.g. "Intro to Maya R. · Fix a leaky tap". */
  title: string;
  /** 'intro' | 'match' | 'view' */
  kind: string;
  /** Epoch milliseconds. */
  at: number;
}

export interface MatchRequestInput {
  request: Listing;
  offers: Listing[];
}

export interface MatchResponse {
  matches?: Match[];
  source?: AiSource;
  error?: { message?: string };
}

export interface IntroRequestInput {
  listing: Listing;
  neighborName: string;
  tone: string;
}

export interface IntroResponse {
  message?: string;
  source?: AiSource;
  error?: { message?: string };
}

export interface SuggestRequestInput {
  description: string;
}

export interface SuggestResponse {
  category?: Category;
  title?: string;
  source?: AiSource;
  error?: { message?: string };
}

/**
 * SkillSwapLocal runtime config.
 *
 * The AI matcher / intro writer / category suggester is a Java Spring
 * Boot service (backend/): POST /api/match, /api/intro, /api/suggest.
 * On native, EXPO_PUBLIC_API_URL is the deployed backend origin; on
 * web the app calls the same-origin /api path. When no endpoint
 * answers, the app falls back to its on-device demo matcher
 * (lib/swap.ts) and says so honestly — listings are always saved and
 * visible either way.
 *
 * No Gemini key ever lives in this file or in app code; the key is
 * server-side only in the Java backend (GEMINI_API_KEY env var).
 */

/** Deployed backend origin for native, or '' to use same-origin /api on web. */
export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

/**
 * Set to true once the Firebase project for SkillSwapLocal exists and
 * the values in lib/firebase.ts / lib/firebase.native.ts are the
 * real web config. No project exists yet (2026-11-23) —
 * TODO-SKILLSWAP placeholders in both files; wiring is a
 * publish step.
 */
export const firebaseConfigured = false;

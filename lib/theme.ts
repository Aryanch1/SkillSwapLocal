import { useWindowDimensions } from 'react-native';

/**
 * SkillSwapLocal design tokens — one consistent system for the whole app.
 *
 * Identity: "the neighborhood swap board". Neighbor blue (#1F5FA8) is
 * the one disciplined theme color, with a sunny amber (#F6B73C) accent
 * for the primary action and leaf green (#3E9B6A) for match pills, on a
 * warm paper ground (#FAF6EE). Outfit (700/800) is the display face —
 * deliberately different from Lora (the previous journal app), Sora
 * (FridgeToMeal/MediGuide), Fraunces (SplitEase), Bricolage Grotesque
 * (PlantDoctor), Archivo (CivicHelper), Space Grotesk (BudgetBuddy),
 * DM Serif Display (ElderEase) and Bebas Neue (BloodBond). The home is
 * a typographic hero ("Trade a skill. Gain a neighbor.") over a live
 * data strip, an arch-top neighbor rail, and match cards with big
 * match-% numbers. Navigation is a flat white bottom tab bar
 * (Board / My Swaps / Profile) with a raised circular amber "+" in the
 * middle for New Listing. No segmented tabs, no floating glass pill
 * tab bar, no photo hero, no ledger, no dashboard grid, no orb hero,
 * no ring, no poster type, no day-timeline.
 */

export const palette = {
  // Brand — one disciplined neighbor blue.
  primary: '#1F5FA8',
  primaryDeep: '#123F73',
  primaryLight: '#3D7CC4',
  primarySoft: '#DFEBF8',
  primaryPale: '#EEF4FB',
  // Sunny amber — the action accent (raised "+" and key CTAs).
  amber: '#F6B73C',
  amberDeep: '#D99415',
  amberSoft: '#FDF1D3',
  // Leaf green — match pills and "matched" states.
  leaf: '#3E9B6A',
  leafSoft: '#E3F2E9',
  // Coral — urgent requests only.
  coral: '#E4572E',
  coralSoft: '#FCE9E2',
  // Ground — warm paper.
  ground: '#FAF6EE',
  // Neutrals (warm tinted so the whole UI feels one family).
  ink: '#1E2A38',
  body: '#526174',
  muted: '#8A96A6',
  line: 'rgba(30, 42, 56, 0.10)',
  surface: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.62)',
  glassStrong: 'rgba(255, 255, 255, 0.85)',
  sheet: 'rgba(255, 255, 255, 0.90)',
  // Aurora background stops — paper, sky tint, amber tint.
  aurora: ['#FAF6EE', '#E4EEF8', '#FDF1D3'] as const,
  // Status.
  warning: '#A66A1F',
  warningSoft: '#FBF3DC',
  error: '#B3261E',
  errorSoft: '#FCE8E6',
  success: '#3E9B6A',
  successSoft: '#E3F2E9',
} as const;

/** Backwards-compatible alias used by shared UI components. */
export const neighborColors = [
  '#1F5FA8',
  '#F6B73C',
  '#3E9B6A',
  '#E4572E',
  '#3D7CC4',
  '#D99415',
  '#526174',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  card: 28,
  sheet: 36,
  pill: 999,
  input: 24,
} as const;

/**
 * Display typeface — Outfit (bundled via @expo-google-fonts/outfit,
 * loaded in app/_layout.tsx). Used for headlines, screen titles and
 * big numbers; body text stays on the system font.
 */
export const font = {
  display: 'Outfit_800ExtraBold',
  bold: 'Outfit_700Bold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.3 },
  displayWide: { fontFamily: font.display, fontSize: 52, lineHeight: 54, letterSpacing: -0.3 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 1.1 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#1E2A38',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#1F5FA8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  amberGlow: {
    shadowColor: '#D99415',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#1E2A38',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type Breakpoint = 'compact' | 'medium' | 'wide' | 'desktop';

export interface Responsive {
  breakpoint: Breakpoint;
  width: number;
  /** Max width for the centered content column. */
  contentMaxWidth: number;
  /** Horizontal page padding. */
  pad: number;
  /** Columns for card grids. */
  columns: number;
  /** Two-pane list + detail layout (foldable unfolded / tablet / desktop). */
  twoPane: boolean;
  display: typeof type.display | typeof type.displayWide;
}

export function useResponsive(): Responsive {
  const { width } = useWindowDimensions();
  if (width < 600) {
    return {
      breakpoint: 'compact',
      width,
      contentMaxWidth: width,
      pad: 20,
      columns: 1,
      twoPane: false,
      display: type.display,
    };
  }
  if (width < 840) {
    return {
      breakpoint: 'medium',
      width,
      contentMaxWidth: 640,
      pad: 28,
      columns: 1,
      twoPane: false,
      display: type.displayWide,
    };
  }
  if (width < 1280) {
    return {
      breakpoint: 'wide',
      width,
      contentMaxWidth: 1024,
      pad: 32,
      columns: 2,
      twoPane: true,
      display: type.displayWide,
    };
  }
  return {
    breakpoint: 'desktop',
    width,
    contentMaxWidth: 1120,
    pad: 40,
    columns: 3,
    twoPane: true,
    display: type.displayWide,
  };
}

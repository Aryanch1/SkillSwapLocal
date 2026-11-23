import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { SpringPress, tap } from './ui';
import { palette, shadows } from '../lib/theme';

/**
 * Flat white bottom tab bar: Board / My Swaps / Profile, with a raised
 * circular amber "+" in the middle for New Listing. This is the one
 * navigation chrome for SkillSwapLocal — deliberately not the floating
 * glass pill tab bar of the earlier apps, and not segmented tabs.
 */
export type TabKey = 'board' | 'swaps' | 'profile';

const TABS: { key: TabKey; label: string; glyph: string; route: string }[] = [
  { key: 'board', label: 'Board', glyph: '🏘️', route: '/' },
  { key: 'swaps', label: 'My Swaps', glyph: '⇄', route: '/swaps' },
  { key: 'profile', label: 'Profile', glyph: '👤', route: '/settings' },
];

export function BottomTabs({ current }: { current: TabKey }) {
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <SpringPress
        onPress={() => {
          if (current !== 'board') router.replace('/');
        }}
        style={styles.tab}
      >
        <TabItem tab={TABS[0]} active={current === 'board'} />
      </SpringPress>

      <SpringPress
        onPress={() => {
          if (Platform.OS !== 'web') tap();
          router.push('/new');
        }}
        style={styles.plusWrap}
      >
        <View style={styles.plus}>
          <Text style={styles.plusGlyph}>+</Text>
        </View>
      </SpringPress>

      <SpringPress
        onPress={() => {
          if (current !== 'swaps') router.replace('/swaps');
        }}
        style={styles.tab}
      >
        <TabItem tab={TABS[1]} active={current === 'swaps'} />
      </SpringPress>

      <SpringPress
        onPress={() => {
          if (current !== 'profile') router.replace('/settings');
        }}
        style={styles.tab}
      >
        <TabItem tab={TABS[2]} active={current === 'profile'} />
      </SpringPress>
    </View>
  );
}

function TabItem({ tab, active }: { tab: (typeof TABS)[number]; active: boolean }) {
  return (
    <View style={styles.tabInner}>
      <Text style={[styles.tabGlyph, active && styles.tabGlyphActive]}>{tab.glyph}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopColor: palette.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 14,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tab: { alignItems: 'center', flex: 1, minHeight: 48 },
  tabInner: { alignItems: 'center', gap: 2 },
  tabGlyph: { fontSize: 20, opacity: 0.55 },
  tabGlyphActive: { opacity: 1 },
  tabLabel: { color: palette.muted, fontSize: 11, fontWeight: '700' },
  tabLabelActive: { color: palette.primary },
  plusWrap: { alignItems: 'center', flex: 1, marginTop: -28 },
  plus: {
    alignItems: 'center',
    backgroundColor: palette.amber,
    borderColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 4,
    height: 64,
    justifyContent: 'center',
    width: 64,
    ...shadows.amberGlow,
  },
  plusGlyph: { color: palette.ink, fontSize: 34, fontWeight: '800', lineHeight: 36 },
});

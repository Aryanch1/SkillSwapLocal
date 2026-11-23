import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { categoryColor, categoryGlyph, type Listing, type Match } from '../lib/types';
import { neighborById, prettyDistance, timeAgo } from '../lib/swap';
import { GlassCard, SpringPress } from './ui';
import { palette, radii, spacing, type } from '../lib/theme';

/**
 * One board card. Offers show the neighbor and the skill; requests
 * show the best AI match as a big match-% number with the top reason
 * line. The whole card is one spring press target.
 */
export function ListingCard({
  listing,
  match,
  mineName,
  onPress,
  index = 0,
}: {
  listing: Listing;
  match?: Match | null;
  mineName?: string | null;
  onPress: () => void;
  index?: number;
}) {
  const neighbor = neighborById(listing.neighborId);
  const name = listing.mine ? (mineName ?? 'You') : (neighbor?.name ?? 'A neighbor');
  const isRequest = listing.kind === 'request';
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 60).springify()}>
      <SpringPress onPress={onPress}>
        <GlassCard style={styles.card}>
          <View style={styles.topRow}>
            <View style={[styles.glyphChip, { backgroundColor: categoryColor(listing.category) }]}>
              <Text style={styles.glyph}>{categoryGlyph(listing.category)}</Text>
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title} numberOfLines={2}>
                {listing.title}
              </Text>
              <Text style={styles.meta}>
                {isRequest ? 'Wanted' : 'Offered'} · {listing.category} · {prettyDistance(listing.distanceMi)}
              </Text>
            </View>
            {match ? (
              <View style={styles.matchBlock}>
                <Text style={styles.matchNumber}>{match.score}%</Text>
                <Text style={styles.matchLabel}>MATCH</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.desc} numberOfLines={2}>
            {listing.description}
          </Text>

          {match && match.reasons[0] ? (
            <Text style={styles.why} numberOfLines={1}>
              ✓ {match.reasons[0]}
              {match.reasons[1] ? ` · ${match.reasons[1]}` : ''}
            </Text>
          ) : null}

          <View style={styles.bottomRow}>
            <View style={styles.neighborChip}>
              <View style={[styles.dot, { backgroundColor: neighbor?.color ?? palette.primary }]}>
                <Text style={styles.dotText}>{name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.neighborName} numberOfLines={1}>
                {name}
                {neighbor ? ` · ★ ${neighbor.rating.toFixed(1)}` : ''}
              </Text>
            </View>
            <Text style={styles.when}>
              {listing.when} · {timeAgo(listing.createdAt)}
            </Text>
          </View>

          {listing.urgent ? (
            <View style={styles.urgentPill}>
              <Text style={styles.urgentText}>NEEDED SOON</Text>
            </View>
          ) : null}
          {listing.status !== 'open' ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>
                {listing.status === 'matched' ? 'MATCHED' : 'DONE'}
              </Text>
            </View>
          ) : null}
        </GlassCard>
      </SpringPress>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10, marginBottom: spacing.md, padding: spacing.md },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  glyphChip: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  glyph: { fontSize: 24 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { ...type.subtitle, color: palette.ink, fontSize: 18, lineHeight: 23 },
  meta: { ...type.caption, color: palette.muted, marginTop: 3 },
  matchBlock: { alignItems: 'center', minWidth: 56 },
  matchNumber: { color: palette.leaf, fontFamily: 'Outfit_800ExtraBold', fontSize: 28, lineHeight: 30 },
  matchLabel: { color: palette.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  desc: { ...type.body, color: palette.body },
  why: { ...type.bodyStrong, color: palette.leaf, fontSize: 13 },
  bottomRow: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  neighborChip: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: 8, minWidth: 0 },
  dot: { alignItems: 'center', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  dotText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  neighborName: { ...type.bodyStrong, color: palette.ink, flex: 1, fontSize: 13 },
  when: { ...type.caption, color: palette.muted },
  urgentPill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.coralSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  urgentText: { color: palette.coral, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: palette.leafSoft,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { color: palette.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});

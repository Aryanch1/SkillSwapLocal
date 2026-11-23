import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../../components/AuroraBackground';
import {
  AccentButton,
  Chip,
  DemoBadge,
  EmptyState,
  GhostButton,
  GlassCard,
  IconButton,
  LiveBadge,
  PrimaryButton,
  SectionHeader,
} from '../../components/ui';
import { neighborById, prettyDistance, writeIntro } from '../../lib/swap';
import { useApp } from '../../lib/store';
import { categoryColor, categoryGlyph, type Match } from '../../lib/types';
import { palette, radii, spacing, type, useResponsive } from '../../lib/theme';

/**
 * Listing detail — the neighbor, the skill, when and where, the AI
 * match (for requests) or the best ask (for offers), and the
 * "Write my hello" intro writer. Safety note on every detail screen:
 * meet in a public place for the first swap. No money ever changes
 * hands.
 */
export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    listingById,
    offers,
    requests,
    user,
    bestMatchesFor,
    recordHistory,
    updateListingStatus,
  } = useApp();
  const r = useResponsive();
  const listing = listingById(id ?? '');
  const [tone, setTone] = useState<'friendly' | 'short' | 'grateful'>('friendly');
  const [intro, setIntro] = useState<{ message: string; source: 'live' | 'demo' } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const neighbor = listing ? neighborById(listing.neighborId) : undefined;
  const name = listing?.mine ? (user?.name ?? 'You') : (neighbor?.name ?? 'A neighbor');

  const bestMatch: Match | null = (() => {
    if (!listing) return null;
    if (listing.kind === 'request') return bestMatchesFor(listing)[0] ?? null;
    // For an offer, show how well it fits the closest open request.
    const req = requests.find((q) => q.category === listing.category);
    if (!req) return null;
    return bestMatchesFor(req).find((m) => m.listingId === listing.id) ?? null;
  })();

  const bestMatchListing = bestMatch
    ? (listing?.kind === 'request'
        ? offers.find((o) => o.id === bestMatch.listingId)
        : requests.find((q) => q.category === listing?.category))
    : undefined;

  if (!listing) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <EmptyState
          glyph="🔍"
          title="Listing not found"
          body="It may have been removed, or the link is out of date."
          actionLabel="Back to the board"
          onAction={() => router.replace('/')}
        />
      </View>
    );
  }

  const writeHello = async () => {
    setBusy(true);
    setNotice(null);
    const result = await writeIntro({ listing, neighborName: name, tone });
    setIntro(result);
    setBusy(false);
    recordHistory({
      listingId: listing.id,
      title: `Intro to ${name} · ${listing.title}`,
      kind: 'intro',
    });
  };

  const markMatched = () => {
    updateListingStatus(listing.id, 'matched');
    setNotice('Marked as matched — find it under My Swaps.');
  };

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>{listing.kind === 'offer' ? 'Offer' : 'Request'}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View entering={FadeInDown.springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.topRow}>
              <View style={[styles.glyphChip, { backgroundColor: categoryColor(listing.category) }]}>
                <Text style={styles.glyph}>{categoryGlyph(listing.category)}</Text>
              </View>
              <View style={styles.titleBlock}>
                <Text style={styles.title}>{listing.title}</Text>
                <Text style={styles.meta}>
                  {listing.category} · {prettyDistance(listing.distanceMi)} · {listing.when}
                </Text>
              </View>
              {bestMatch ? (
                <View style={styles.matchBlock}>
                  <Text style={styles.matchNumber}>{bestMatch.score}%</Text>
                  <Text style={styles.matchLabel}>MATCH</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.body}>{listing.description}</Text>

            {bestMatch && bestMatchListing ? (
              <View style={styles.whyBox}>
                <Text style={styles.whyTitle}>Why this matches</Text>
                {bestMatch.reasons.map((reason) => (
                  <Text key={reason} style={styles.whyLine}>
                    ✓ {reason}
                  </Text>
                ))}
                <Text style={styles.whyLink} onPress={() => router.push(`/listing/${bestMatchListing.id}`)}>
                  {bestMatchListing.kind === 'offer' ? 'Best offer: ' : 'Closest ask: '}
                  {bestMatchListing.title} →
                </Text>
              </View>
            ) : null}

            <View style={styles.neighborRow}>
              <View style={[styles.dot, { backgroundColor: neighbor?.color ?? palette.primary }]}>
                <Text style={styles.dotText}>{name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.neighborText}>
                <Text style={styles.neighborName}>{name}</Text>
                <Text style={styles.neighborMeta}>
                  {neighbor
                    ? `${neighbor.swaps} swaps done · ★ ${neighbor.rating.toFixed(1)} · ${prettyDistance(neighbor.distanceMi)} away`
                    : 'Your listing'}
                </Text>
                <Text style={styles.neighborMeta}>Usually at: {listing.where}</Text>
              </View>
            </View>

            <Text style={styles.safety}>
              Stay safe: meet in a public place for the first swap, and tell someone where you are
              going. No money changes hands on SkillSwapLocal — ever.
            </Text>
          </GlassCard>
        </Animated.View>

        <SectionHeader kicker="Say hello" title="Write my hello" />
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.card}>
            <Text style={styles.body}>
              Not sure how to start? Pick a tone and the app drafts a friendly first message to{' '}
              {name} — it only uses what this listing says, nothing invented.
            </Text>
            <View style={styles.toneRow}>
              <Chip label="Friendly" selected={tone === 'friendly'} onPress={() => setTone('friendly')} />
              <Chip label="Short" selected={tone === 'short'} onPress={() => setTone('short')} />
              <Chip label="Grateful" selected={tone === 'grateful'} onPress={() => setTone('grateful')} />
            </View>
            <PrimaryButton label="Write my hello" onPress={() => void writeHello()} loading={busy} />
            {intro ? (
              <View style={styles.introBox}>
                <View style={styles.introHead}>
                  <Text style={styles.introTitle}>Your hello</Text>
                  {intro.source === 'live' ? <LiveBadge /> : <DemoBadge />}
                </View>
                <Text style={styles.introText}>{intro.message}</Text>
                <Text style={styles.introHint}>
                  {intro.source === 'live'
                    ? 'Written by the live service.'
                    : 'Demo draft, written on your device. Edit it in your own words before sending.'}
                </Text>
              </View>
            ) : null}
          </GlassCard>
        </Animated.View>

        <View style={styles.actions}>
          <AccentButton label="Mark as matched" onPress={markMatched} />
          <GhostButton label="Back to the board" onPress={() => router.replace('/')} />
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {listing.isDemo ? (
          <Text style={styles.demoNote}>Demo listing — a sample so you can see how matching works.</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  headerTitle: { ...type.title, color: palette.ink, flex: 1 },
  headerSpacer: { width: 44 },
  card: { gap: 14, marginBottom: spacing.xl, padding: spacing.lg },
  topRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  glyphChip: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  glyph: { fontSize: 28 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { ...type.title, color: palette.ink },
  meta: { ...type.caption, color: palette.muted, marginTop: 4 },
  matchBlock: { alignItems: 'center', minWidth: 56 },
  matchNumber: { color: palette.leaf, fontFamily: 'Outfit_800ExtraBold', fontSize: 30, lineHeight: 32 },
  matchLabel: { color: palette.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  body: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25 },
  whyBox: { backgroundColor: palette.leafSoft, borderRadius: radii.md, gap: 4, padding: spacing.md },
  whyTitle: { ...type.bodyStrong, color: palette.leaf },
  whyLine: { ...type.body, color: palette.ink },
  whyLink: { ...type.bodyStrong, color: palette.primary, marginTop: 6 },
  neighborRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  dot: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  dotText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  neighborText: { flex: 1, minWidth: 0 },
  neighborName: { ...type.subtitle, color: palette.ink },
  neighborMeta: { ...type.caption, color: palette.muted, marginTop: 2 },
  safety: { ...type.bodyStrong, color: palette.coral, fontSize: 13, lineHeight: 19 },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  introBox: { backgroundColor: palette.primaryPale, borderRadius: radii.md, gap: 8, padding: spacing.md },
  introHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  introTitle: { ...type.subtitle, color: palette.ink },
  introText: { ...type.body, color: palette.ink, fontSize: 16, lineHeight: 25 },
  introHint: { ...type.caption, color: palette.muted },
  actions: { gap: 12 },
  notice: { ...type.bodyStrong, color: palette.success, marginTop: spacing.md, textAlign: 'center' },
  demoNote: { ...type.caption, color: palette.muted, marginTop: spacing.md, textAlign: 'center' },
});

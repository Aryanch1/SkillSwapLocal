import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import { BottomTabs } from '../components/BottomTabs';
import { ListingCard } from '../components/ListingCard';
import { PullToRefresh, SwapRefreshButton } from '../components/SwapRefresh';
import {
  Chip,
  DemoBadge,
  EmptyState,
  GlassCard,
  SpringPress,
} from '../components/ui';
import { NEIGHBORS, TOTAL_SWAPS_NEARBY, demoMatch, neighborById } from '../lib/swap';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';
import { CATEGORIES, categoryColor, type Listing, type Match } from '../lib/types';

type BoardTab = 'matches' | 'offers' | 'requests';

/**
 * Home — the neighborhood swap board. A typographic hero ("Trade a
 * skill. Gain a neighbor.") over a live data strip (neighbors nearby,
 * swaps done, open requests), an arch-top neighbor rail, then match
 * cards with big match-% numbers and "why this matches" lines. Board
 * tabs switch between Top matches / Offers / Requests. On ≥840dp the
 * screen splits: board left, selected listing on the right. No photo
 * hero, no segmented tabs, no floating pill tab bar.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { sortedListings, offers, requests, user, bestMatchesFor } = useApp();
  const r = useResponsive();
  const [boardTab, setBoardTab] = useState<BoardTab>('matches');
  const [category, setCategory] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const hasDemo = sortedListings.some((l) => l.isDemo);
  const openRequests = requests.filter((l) => l.status === 'open');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The board is local; refresh re-reads state and replays the swap loop.
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  // Top matches: each open request paired with its best offer, best first.
  const topMatches = useMemo(() => {
    const pairs: { request: Listing; match: Match; offer: Listing }[] = [];
    for (const req of openRequests) {
      const matches = bestMatchesFor(req);
      const best = matches[0];
      if (!best) continue;
      const offer = offers.find((o) => o.id === best.listingId);
      if (offer) pairs.push({ request: req, match: best, offer });
    }
    return pairs.sort((a, b) => b.match.score - a.match.score).slice(0, 5);
  }, [openRequests, offers, bestMatchesFor]);

  const filteredOffers = useMemo(
    () => (category === 'All' ? offers : offers.filter((l) => l.category === category)),
    [offers, category],
  );
  const filteredRequests = useMemo(
    () => (category === 'All' ? requests : requests.filter((l) => l.category === category)),
    [requests, category],
  );

  const selected =
    sortedListings.find((l) => l.id === selectedId) ?? topMatches[0]?.offer ?? sortedListings[0] ?? null;
  const selectedMatch = selected
    ? demoMatch(
        requests.find((req) => req.category === selected.category) ?? requests[0],
        [selected],
      )[0] ?? null
    : null;

  const openListing = (id: string) => {
    setSelectedId(id);
    if (!r.twoPane) router.push(`/listing/${id}`);
  };

  const hero = (
    <View>
      <Animated.View entering={FadeInDown.springify()}>
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>SKILLSWAPLOCAL · GLASSBORO</Text>
            <Text style={[styles.heroTitle, r.display]}>Trade a skill.{'\n'}Gain a neighbor.</Text>
            <Text style={styles.heroBody}>
              Offer something you are good at, ask for a hand you need, and let the board match
              you with someone a short walk away. No money changes hands — just neighbors helping
              neighbors.
            </Text>
          </View>
          {Platform.OS === 'web' ? (
            <SpringPress onPress={onRefresh} haptic>
              <View style={styles.refreshWrap}>
                <SwapRefreshButton refreshing={refreshing} />
              </View>
            </SpringPress>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(70).springify()}>
        <GlassCard style={styles.strip}>
          <View style={styles.stripItem}>
            <Text style={styles.stripNumber}>{NEIGHBORS.length}</Text>
            <Text style={styles.stripLabel}>neighbors nearby</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.stripItem}>
            <Text style={styles.stripNumber}>{TOTAL_SWAPS_NEARBY}</Text>
            <Text style={styles.stripLabel}>swaps done</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.stripItem}>
            <Text style={styles.stripNumber}>{openRequests.length}</Text>
            <Text style={styles.stripLabel}>open requests</Text>
          </View>
          <View style={styles.stripBadge}>
            {/* The board itself ranks with the on-device demo matcher; the
                detail screen says LIVE AI when the Java service answers. */}
            <DemoBadge />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).springify()}>
        <Text style={styles.sectionTitle}>Neighbors near you</Text>
        <View style={styles.rail}>
          {NEIGHBORS.map((n) => (
            <Pressable key={n.id} onPress={() => setCategory('All')} style={styles.railItem}>
              <View style={[styles.arch, { backgroundColor: n.color }]}>
                <Text style={styles.archInitials}>{n.initials}</Text>
              </View>
              <Text style={styles.railName} numberOfLines={1}>
                {n.name}
              </Text>
              <Text style={styles.railMeta}>
                {n.distanceMi.toFixed(1)} mi · {n.swaps} swaps
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );

  const board = (
    <View>
      <View style={styles.tabRow}>
        <Chip label="Top matches" selected={boardTab === 'matches'} onPress={() => setBoardTab('matches')} />
        <Chip label="Offers" selected={boardTab === 'offers'} onPress={() => setBoardTab('offers')} />
        <Chip label="Requests" selected={boardTab === 'requests'} onPress={() => setBoardTab('requests')} />
      </View>

      <View style={styles.chipRow}>
        <Chip label="All" selected={category === 'All'} onPress={() => setCategory('All')} />
        {CATEGORIES.slice(0, 6).map((c) => (
          <Chip
            key={c.name}
            label={c.name}
            selected={category === c.name}
            onPress={() => setCategory(c.name)}
          />
        ))}
      </View>

      {boardTab === 'matches' ? (
        topMatches.length === 0 ? (
          <EmptyState
            glyph="⇄"
            title="No matches yet"
            body="Post an offer or a request and the board will start matching neighbors for you."
            actionLabel="Post a listing"
            onAction={() => router.push('/new')}
          />
        ) : (
          topMatches.map(({ request, match, offer }, i) => (
            <View key={request.id}>
              <Text style={styles.matchFor}>
                For “{request.title}” — {neighborById(request.neighborId)?.name ?? 'a neighbor'} asks
              </Text>
              <ListingCard
                listing={offer}
                match={match}
                mineName={user?.name}
                onPress={() => openListing(offer.id)}
                index={i}
              />
            </View>
          ))
        )
      ) : null}

      {boardTab === 'offers' ? (
        filteredOffers.length === 0 ? (
          <EmptyState
            glyph="🔧"
            title="No offers in this skill yet"
            body="Be the first neighbor to offer it — post a listing and the board will find the ask."
            actionLabel="Post an offer"
            onAction={() => router.push('/new')}
          />
        ) : (
          filteredOffers.map((l, i) => (
            <ListingCard key={l.id} listing={l} mineName={user?.name} onPress={() => openListing(l.id)} index={i} />
          ))
        )
      ) : null}

      {boardTab === 'requests' ? (
        filteredRequests.length === 0 ? (
          <EmptyState
            glyph="🙋"
            title="No requests in this skill yet"
            body="Nobody nearby is asking for this right now — check back after the next refresh."
          />
        ) : (
          filteredRequests.map((req, i) => {
            const best = bestMatchesFor(req)[0];
            const offer = best ? offers.find((o) => o.id === best.listingId) : undefined;
            return (
              <View key={req.id}>
                <ListingCard
                  listing={req}
                  match={undefined}
                  mineName={user?.name}
                  onPress={() => openListing(req.id)}
                  index={i}
                />
                {offer && best ? (
                  <View style={styles.inlineMatch}>
                    <Text style={styles.inlineMatchText}>
                      Best match: {offer.title} · {best.score}% — {best.reasons[0]}
                    </Text>
                    <SpringPress onPress={() => openListing(offer.id)}>
                      <Text style={styles.inlineMatchLink}>See the match →</Text>
                    </SpringPress>
                  </View>
                ) : null}
              </View>
            );
          })
        )
      ) : null}

      {hasDemo ? (
        <Text style={styles.demoNote}>
          Demo board — these neighbors and listings are samples so you can see how matching works.
          Clear them any time in Settings.
        </Text>
      ) : null}
    </View>
  );

  // Two-pane (≥840dp): board left, selected listing right.
  if (r.twoPane) {
    return (
      <View style={styles.root}>
        <AuroraBackground />
        <View style={[styles.twoPane, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}>
          <View style={styles.paneLeft}>
            <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
              <View style={[styles.scrollPad, { paddingHorizontal: r.pad }]}>
                {hero}
                {board}
              </View>
            </PullToRefresh>
          </View>
          <View style={styles.paneRight}>
            {selected ? (
              <GlassCard style={styles.detailCard}>
                <View style={[styles.detailGlyph, { backgroundColor: categoryColor(selected.category) }]}>
                  <Text style={styles.detailGlyphText}>{CATEGORIES.find((c) => c.name === selected.category)?.glyph ?? '🤝'}</Text>
                </View>
                <Text style={styles.detailTitle}>{selected.title}</Text>
                <Text style={styles.detailMeta}>
                  {selected.kind === 'offer' ? 'Offered' : 'Wanted'} · {selected.category} ·{' '}
                  {selected.distanceMi.toFixed(1)} mi away · {selected.when}
                </Text>
                <Text style={styles.detailBody}>{selected.description}</Text>
                {selectedMatch ? (
                  <Text style={styles.detailMatch}>
                    {selectedMatch.score}% match — {selectedMatch.reasons.join(' · ')}
                  </Text>
                ) : null}
                <Text style={styles.safety}>Meet in a public place for the first swap.</Text>
                <SpringPress onPress={() => router.push(`/listing/${selected.id}`)} haptic>
                  <View style={styles.detailCta}>
                    <Text style={styles.detailCtaText}>Open the listing →</Text>
                  </View>
                </SpringPress>
              </GlassCard>
            ) : (
              <EmptyState glyph="⇄" title="Pick a listing" body="Tap any card on the board to see it here." />
            )}
          </View>
        </View>
        <BottomTabs current="board" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <PullToRefresh refreshing={refreshing} onRefresh={onRefresh}>
        <View style={[styles.scrollPad, { paddingHorizontal: r.pad }]}>
          {hero}
          {board}
        </View>
      </PullToRefresh>
      <BottomTabs current="board" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollPad: { paddingBottom: 24, paddingTop: 20, width: '100%' },
  heroRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  heroText: { flex: 1 },
  kicker: { ...type.label, color: palette.primary, marginBottom: 8 },
  heroTitle: { color: palette.ink, marginBottom: 10 },
  heroBody: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.lg },
  refreshWrap: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  strip: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  stripItem: { alignItems: 'center', flex: 1 },
  stripNumber: { color: palette.primary, fontFamily: 'Outfit_800ExtraBold', fontSize: 30, lineHeight: 34 },
  stripLabel: { ...type.caption, color: palette.muted },
  stripDivider: { backgroundColor: palette.line, height: 36, width: 1 },
  stripBadge: { marginLeft: 8 },
  sectionTitle: { ...type.title, color: palette.ink, marginBottom: spacing.md },
  rail: { flexDirection: 'row', gap: 14, marginBottom: spacing.xl, overflow: 'scroll' },
  railItem: { alignItems: 'center', width: 84 },
  arch: {
    alignItems: 'center',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    height: 96,
    justifyContent: 'flex-end',
    paddingBottom: 14,
    width: 84,
  },
  archInitials: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  railName: { ...type.bodyStrong, color: palette.ink, fontSize: 13, marginTop: 6 },
  railMeta: { ...type.caption, color: palette.muted, fontSize: 10, textAlign: 'center' },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  matchFor: { ...type.bodyStrong, color: palette.body, fontSize: 13, marginBottom: 6, marginTop: 4 },
  inlineMatch: {
    backgroundColor: palette.leafSoft,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    marginTop: -6,
    padding: spacing.md,
  },
  inlineMatchText: { ...type.body, color: palette.ink },
  inlineMatchLink: { ...type.bodyStrong, color: palette.leaf, marginTop: 6 },
  demoNote: { ...type.caption, color: palette.muted, marginTop: spacing.md, textAlign: 'center' },
  twoPane: { flex: 1, flexDirection: 'row', width: '100%' },
  paneLeft: { flex: 1.15, minWidth: 0 },
  paneRight: { flex: 1, minWidth: 0, padding: 20 },
  detailCard: { gap: 12, padding: spacing.lg },
  detailGlyph: {
    alignItems: 'center',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  detailGlyphText: { fontSize: 30 },
  detailTitle: { ...type.title, color: palette.ink },
  detailMeta: { ...type.caption, color: palette.muted },
  detailBody: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25 },
  detailMatch: { ...type.bodyStrong, color: palette.leaf },
  safety: { ...type.bodyStrong, color: palette.coral, fontSize: 13 },
  detailCta: {
    alignItems: 'center',
    backgroundColor: palette.amber,
    borderRadius: radii.pill,
    minHeight: 52,
    justifyContent: 'center',
  },
  detailCtaText: { color: palette.ink, fontSize: 16, fontWeight: '800' },
});

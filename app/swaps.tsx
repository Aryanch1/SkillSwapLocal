import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import { BottomTabs } from '../components/BottomTabs';
import { ListingCard } from '../components/ListingCard';
import {
  EmptyState,
  GhostButton,
  GlassCard,
  SectionHeader,
} from '../components/ui';
import { useApp } from '../lib/store';
import { palette, spacing, type, useResponsive } from '../lib/theme';

/**
 * My Swaps — my own listings, the best matches for my open requests,
 * and my history (intros and matches) for one-tap re-use. Selections
 * never persist across visits; history does, until cleared.
 */
export default function MySwapsScreen() {
  const router = useRouter();
  const { myListings, offers, history, bestMatchesFor, applyHistory, updateListingStatus } =
    useApp();
  const r = useResponsive();

  const myRequests = useMemo(
    () => myListings.filter((l) => l.kind === 'request' && l.status === 'open'),
    [myListings],
  );

  const myMatches = useMemo(() => {
    const pairs: { requestId: string; requestTitle: string; offerTitle: string; score: number; reasons: string[] }[] =
      [];
    for (const req of myRequests) {
      const best = bestMatchesFor(req)[0];
      if (!best) continue;
      const offer = offers.find((o) => o.id === best.listingId);
      if (offer) {
        pairs.push({
          requestId: req.id,
          requestTitle: req.title,
          offerTitle: offer.title,
          score: best.score,
          reasons: best.reasons,
        });
      }
    }
    return pairs;
  }, [myRequests, offers, bestMatchesFor]);

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <SectionHeader kicker="My swaps" title="Your board" />
        </Animated.View>

        <SectionHeader kicker="Mine" title="My listings" />
        {myListings.length === 0 ? (
          <EmptyState
            glyph="🤝"
            title="Nothing posted yet"
            body="Offer a skill or ask for a hand — your listings live here, with their matches."
            actionLabel="Post a listing"
            onAction={() => router.push('/new')}
          />
        ) : (
          myListings.map((l, i) => (
            <View key={l.id}>
              <ListingCard listing={l} onPress={() => router.push(`/listing/${l.id}`)} index={i} />
              {l.status === 'open' ? (
                <View style={styles.rowActions}>
                  <GhostButton label="Mark done" onPress={() => updateListingStatus(l.id, 'done')} />
                </View>
              ) : (
                <Text style={styles.doneNote}>
                  {l.status === 'matched' ? 'Matched — nice one.' : 'Done — thanks for helping a neighbor.'}
                </Text>
              )}
            </View>
          ))
        )}

        <SectionHeader kicker="Matches" title="Matches for my requests" />
        {myMatches.length === 0 ? (
          <GlassCard style={styles.card}>
            <Text style={styles.body}>
              {myRequests.length === 0
                ? 'Post a request and the board will match it with nearby offers here.'
                : 'No offers match your requests yet — new offers appear on the board as neighbors post them.'}
            </Text>
          </GlassCard>
        ) : (
          myMatches.map((m) => (
            <GlassCard key={m.requestId} style={styles.card}>
              <View style={styles.matchRow}>
                <Text style={styles.matchScore}>{m.score}%</Text>
                <View style={styles.matchText}>
                  <Text style={styles.matchTitle} numberOfLines={2}>
                    {m.offerTitle}
                  </Text>
                  <Text style={styles.matchSub} numberOfLines={2}>
                    For “{m.requestTitle}” — {m.reasons.join(' · ')}
                  </Text>
                </View>
              </View>
              <GhostButton label="Open the match" onPress={() => router.push(`/listing/${m.requestId}`)} />
            </GlassCard>
          ))
        )}

        <SectionHeader kicker="History" title="Intros & matches" />
        <GlassCard style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.body}>
              Intros you write and matches you open show up here for one-tap re-use.
            </Text>
          ) : (
            history.map((entry) => {
              const listing = applyHistory(entry);
              return (
                <View key={entry.id}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyMain}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      <Text style={styles.historySub} numberOfLines={1}>
                        {entry.kind === 'intro' ? 'Intro written' : 'Match opened'} ·{' '}
                        {new Date(entry.at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    {listing ? (
                      <GhostButton label="Open" onPress={() => router.push(`/listing/${listing.id}`)} />
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </GlassCard>

        <Text style={styles.note}>
          Swaps are trades of time and skill between neighbors. No money changes hands — if anyone
          asks for payment, report them and walk away.
        </Text>
      </ScrollView>
      <BottomTabs current="swaps" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 48, width: '100%' },
  card: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  body: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25 },
  rowActions: { marginBottom: spacing.md, marginTop: -6 },
  doneNote: { ...type.bodyStrong, color: palette.leaf, marginBottom: spacing.md, marginTop: -6 },
  matchRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  matchScore: { color: palette.leaf, fontFamily: 'Outfit_800ExtraBold', fontSize: 30, lineHeight: 32 },
  matchText: { flex: 1, minWidth: 0 },
  matchTitle: { ...type.subtitle, color: palette.ink },
  matchSub: { ...type.body, color: palette.body, marginTop: 2 },
  historyRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  historyMain: { flex: 1, minWidth: 0 },
  historyTitle: { ...type.bodyStrong, color: palette.ink },
  historySub: { ...type.caption, color: palette.muted, marginTop: 2 },
  historyMessage: { ...type.body, color: palette.ink, marginTop: 8 },
  note: { ...type.caption, color: palette.muted, marginTop: spacing.md, textAlign: 'center' },
});

import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuroraBackground } from '../components/AuroraBackground';
import { GhostButton, GlassCard, IconButton, SectionHeader } from '../components/ui';
import { palette, spacing, type, useResponsive } from '../lib/theme';

/** Help & about — how the swap board works, privacy, and the safety note. */
export default function HelpScreen() {
  const router = useRouter();
  const r = useResponsive();
  return (
    <View style={styles.root}>
      <AuroraBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { maxWidth: r.contentMaxWidth, alignSelf: 'center' }]}
      >
        <View style={styles.header}>
          <IconButton label="←" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Help & about</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SectionHeader kicker="Help" title="How SkillSwapLocal works" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            1. On the Board, browse offers from neighbors nearby, or the
            requests people are asking for. Every request shows its best
            match as a big match-% number, with the reasons it fits.
          </Text>
          <Text style={styles.body}>
            2. Tap any listing to see the neighbor, when and where, and the
            “why this matches” lines. Tap “Write my hello” and the app
            drafts a friendly first message in a tone you pick.
          </Text>
          <Text style={styles.body}>
            3. Tap the amber + to post your own listing — an offer (“I can
            help with…”) or a request (“I need help with…”). Type it in
            your own words and the app suggests the skill and a title.
          </Text>
          <Text style={styles.body}>
            4. My Swaps holds your listings, the matches for your requests,
            and your history of intros and matches for one-tap re-use.
            Mark a listing done when the swap is finished.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Privacy" title="Your words stay yours" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            Listings live on your device, and in your account when you sign
            in. Nothing is shared with anyone else. Guest mode lasts for
            this visit only — sign in to keep your board across devices.
          </Text>
          <Text style={styles.body}>
            Matches and messages marked LIVE AI come from the hosted Java
            service; ones marked DEMO are made on your device by a simple
            rule-based matcher that only uses the facts on the listing.
          </Text>
        </GlassCard>

        <SectionHeader kicker="Stay safe" title="Meet in a public place" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            SkillSwapLocal is a community board, not a marketplace. No money
            ever changes hands — a swap is a trade of time and skill. Meet
            in a public place for the first swap, tell someone where you
            are going, and walk away from anyone who asks for payment.
          </Text>
        </GlassCard>

        <SectionHeader kicker="About" title="SkillSwapLocal" />
        <GlassCard style={styles.card}>
          <Text style={styles.body}>
            A neighborhood skill-swap board by Aryanmouli Cherupalli — trade
            a skill, gain a neighbor. Built with React Native + Expo +
            TypeScript, a Java Spring Boot service, Gemini AI and Firebase.
          </Text>
        </GlassCard>

        <GhostButton label="Back to the board" onPress={() => router.replace('/')} />
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
  card: { gap: 12, marginBottom: spacing.xl, padding: spacing.lg },
  body: { ...type.body, color: palette.body, fontSize: 16, lineHeight: 25 },
});

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AuroraBackground } from '../components/AuroraBackground';
import {
  Chip,
  DemoBadge,
  GhostButton,
  GlassCard,
  IconButton,
  LiveBadge,
  PrimaryButton,
  SectionHeader,
} from '../components/ui';
import { suggestFromText } from '../lib/swap';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';
import { CATEGORIES, type Category, type ListingKind } from '../lib/types';

/**
 * New listing — offer or request. Type what you need or can do in
 * plain words, tap "Suggest from my words" and the app picks the
 * category and a title for you (live service when it answers, honest
 * on-device suggestion otherwise). Then pick when and where, and post.
 */
export default function NewListingScreen() {
  const router = useRouter();
  const { addListing, user } = useApp();
  const r = useResponsive();
  const [kind, setKind] = useState<ListingKind>('offer');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Home repair');
  const [when, setWhen] = useState('');
  const [where, setWhere] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestSource, setSuggestSource] = useState<'live' | 'demo' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const suggest = async () => {
    if (description.trim().length < 8) {
      setError('Write a sentence or two first, then ask for a suggestion.');
      return;
    }
    setSuggesting(true);
    setError(null);
    const result = await suggestFromText({ description });
    setCategory(result.category);
    if (!title.trim()) setTitle(result.title);
    setSuggestSource(result.source);
    setSuggesting(false);
    setNotice(
      result.source === 'live'
        ? 'Category suggested by the live service.'
        : 'Category suggested on your device (demo).',
    );
  };

  const submit = () => {
    if (!title.trim()) return setError('Give your listing a short title.');
    if (description.trim().length < 10) {
      return setError('Add a little more detail so neighbors know what to expect.');
    }
    setBusy(true);
    const listing = addListing({
      kind,
      title,
      category,
      description,
      when,
      where,
      urgent: kind === 'request' ? urgent : false,
    });
    setBusy(false);
    router.replace(`/listing/${listing.id}`);
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
          <Text style={styles.headerTitle}>New listing</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Animated.View entering={FadeInDown.springify()}>
          <GlassCard style={styles.card}>
            <SectionHeader
              kicker="New listing"
              title={kind === 'offer' ? 'Offer a skill' : 'Ask for a hand'}
            />
            <View style={styles.kindRow}>
              <Chip label="🙌 I can help" selected={kind === 'offer'} onPress={() => setKind('offer')} />
              <Chip label="🙋 I need help" selected={kind === 'request'} onPress={() => setKind('request')} />
            </View>

            <Text style={styles.label}>WHAT IS IT, IN YOUR OWN WORDS?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={
                kind === 'offer'
                  ? 'e.g. I can fix a dripping tap, I bring my own tools…'
                  : 'e.g. My bookshelf wobbles and I need a hand bracing it…'
              }
              placeholderTextColor={palette.muted}
              multiline
            />
            <GhostButton
              label={suggesting ? 'Thinking…' : '✨ Suggest from my words'}
              onPress={() => void suggest()}
              disabled={suggesting}
            />
            {suggestSource ? (
              <View style={styles.sourceRow}>
                {suggestSource === 'live' ? <LiveBadge /> : <DemoBadge />}
                <Text style={styles.sourceText}>
                  {suggestSource === 'live'
                    ? 'Suggested by the live service.'
                    : 'Suggested on your device (demo).'}
                </Text>
              </View>
            ) : null}

            <Text style={styles.label}>TITLE</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder={kind === 'offer' ? 'e.g. Fix a leaky tap' : 'e.g. Help moving a couch'}
              placeholderTextColor={palette.muted}
            />

            <Text style={styles.label}>SKILL</Text>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.name}
                  label={`${c.glyph} ${c.name}`}
                  selected={category === c.name}
                  onPress={() => setCategory(c.name)}
                />
              ))}
            </View>

            <Text style={styles.label}>WHEN</Text>
            <TextInput
              style={styles.input}
              value={when}
              onChangeText={setWhen}
              placeholder="e.g. Weekends, Tue evenings"
              placeholderTextColor={palette.muted}
            />

            <Text style={styles.label}>WHERE</Text>
            <TextInput
              style={styles.input}
              value={where}
              onChangeText={setWhere}
              placeholder="e.g. My place, Maple St, the corner cafe"
              placeholderTextColor={palette.muted}
            />

            {kind === 'request' ? (
              <Chip
                label={urgent ? '⚠️ Needed soon — on' : '⚠️ Needed soon'}
                selected={urgent}
                onPress={() => setUrgent(!urgent)}
              />
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            <PrimaryButton
              label={kind === 'offer' ? 'Post my offer' : 'Post my request'}
              onPress={submit}
              loading={busy}
            />
            <Text style={styles.hint}>
              Posted as {user?.name ?? 'a neighbor'} · No money changes hands · Meet in a public
              place for the first swap.
            </Text>
          </GlassCard>
        </Animated.View>

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
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { ...type.label, color: palette.primary, marginTop: 4 },
  input: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.input,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  textArea: { minHeight: 110, paddingVertical: 14, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  sourceText: { ...type.caption, color: palette.muted },
  error: { ...type.bodyStrong, color: palette.error, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, textAlign: 'center' },
  hint: { ...type.caption, color: palette.muted, textAlign: 'center' },
});

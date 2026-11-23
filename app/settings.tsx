import Constants from 'expo-constants';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuroraBackground } from '../components/AuroraBackground';
import { GhostButton, GlassCard, IconButton, PrimaryButton, SectionHeader } from '../components/ui';
import { firebaseConfigured } from '../lib/config';
import { useApp } from '../lib/store';
import { palette, radii, spacing, type, useResponsive } from '../lib/theme';

/** Settings & profile — name, photo, sign-in method, history, data controls. */
export default function SettingsScreen() {
  const router = useRouter();
  const {
    user,
    guest,
    listings,
    history,
    applyHistory,
    updateDisplayName,
    setAvatarData,
    sendPasswordReset,
    signOut,
    clearHistory,
    clearDemoData,
  } = useApp();
  const r = useResponsive();
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);

  // The version label reads the single version source (app.json) —
  // never a hand-typed string.
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const hasDemo = listings.some((l) => l.isDemo);

  const pickPhoto = async () => {
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;
      // Client-side resize before storing — no Firebase Storage needed.
      const resized = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 256 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );
      if (resized.base64) {
        await setAvatarData(`data:image/jpeg;base64,${resized.base64}`);
        setNotice('Profile picture updated.');
      }
    } catch {
      setError('Could not update the picture. Try again.');
    }
  };

  const saveName = async () => {
    if (!name.trim()) return setError('Please type a name first.');
    setBusy(true);
    setError(null);
    try {
      await updateDisplayName(name);
      setNotice('Name updated.');
    } catch {
      setError('Could not save the name. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendPasswordReset();
      setNotice('Password reset email sent — check your inbox.');
    } catch {
      setError('Could not send the reset email. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const openHistory = (entryId: string) => {
    const entry = history.find((h) => h.id === entryId);
    if (!entry) return;
    const listing = applyHistory(entry);
    if (listing) {
      setOpenEntryId(openEntryId === listing.id ? null : listing.id);
    } else {
      setError('That listing is no longer saved.');
    }
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SectionHeader kicker="Settings" title="Profile & account" />
        {user ? (
          <GlassCard style={styles.card}>
            <View style={styles.profileRow}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.profileText}>
                <Text style={styles.profileName}>{user.name ?? 'Your profile'}</Text>
                <Text style={styles.profileEmail}>{user.email ?? ''}</Text>
                <Text style={styles.profileProvider}>
                  Signed in with {user.provider === 'google.com' ? 'Google' : 'email & password'}
                </Text>
              </View>
            </View>
            <GhostButton label="Change picture" onPress={() => void pickPhoto()} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Display name"
              placeholderTextColor={palette.muted}
              autoCapitalize="words"
            />
            <PrimaryButton label="Save name" onPress={() => void saveName()} loading={busy} />
            {user.provider === 'password' ? (
              <GhostButton label="Send password-reset email" onPress={() => void resetPassword()} />
            ) : null}
            <GhostButton
              label="Sign out"
              onPress={() =>
                void signOut().then(() => router.replace('/welcome'))
              }
            />
          </GlassCard>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={styles.guestTitle}>
              {guest ? 'You are browsing as a guest' : 'You are signed out'}
            </Text>
            <Text style={styles.guestBody}>
              Sign in to keep your listings and history in sync across
              devices. Guest mode lasts for this visit only.
            </Text>
            <PrimaryButton label="Go to sign-in" onPress={() => router.push('/welcome')} />
          </GlassCard>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <SectionHeader kicker="History" title="Intros & matches" />
        <GlassCard style={styles.card}>
          {history.length === 0 ? (
            <Text style={styles.dataBody}>No history yet — intros you write and matches you open show up here for one-tap re-use.</Text>
          ) : (
            history.map((entry) => {
              const listing = applyHistory(entry);
              const open = listing && openEntryId === listing.id;
              return (
                <View key={entry.id}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyMain}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {entry.title}
                      </Text>
                      <Text style={styles.historySender} numberOfLines={1}>
                        {entry.kind === 'intro' ? 'Intro written' : 'Match opened'}
                      </Text>
                    </View>
                    <GhostButton
                      label={open ? 'Hide' : 'View'}
                      onPress={() => openHistory(entry.id)}
                    />
                  </View>
                  {open && listing ? (
                    <Text style={styles.historyMessage}>{listing.description}</Text>
                  ) : null}
                </View>
              );
            })
          )}
          {history.length > 0 ? (
            <GhostButton label="Clear history" onPress={clearHistory} />
          ) : null}
        </GlassCard>

        <SectionHeader kicker="Status" title="Services" />
        <GlassCard style={styles.card}>
          <Text style={styles.statusRow}>
            Match AI: live service when the Java backend is deployed — on-device demo matcher until then.
          </Text>
          <Text style={styles.statusRow}>
            Accounts & sync: {firebaseConfigured ? 'Firebase connected' : 'Not set up yet — guest mode'}
          </Text>
          <Text style={styles.statusRow}>
            Listings: {listings.length} saved
          </Text>
          <Text style={styles.statusRow}>SkillSwapLocal version {version}</Text>
        </GlassCard>

        <SectionHeader kicker="Your data" title="Storage" />
        <GlassCard style={styles.card}>
          <Text style={styles.dataBody}>
            Listings and history live on this device, and in your
            account when signed in. Nothing is shared with anyone else.
          </Text>
          {hasDemo ? (
            <GhostButton
              label="Clear demo data"
              onPress={() => {
                clearDemoData();
                setNotice('Demo data cleared.');
              }}
            />
          ) : null}
        </GlassCard>

        <GhostButton label="Help & about" onPress={() => router.push('/help')} />
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
  card: { gap: 12, marginBottom: spacing.xl, padding: spacing.md },
  profileRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  avatar: { borderRadius: 40, height: 80, width: 80 },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarFallbackText: { color: palette.primary, fontSize: 32, fontWeight: '800' },
  profileText: { flex: 1 },
  profileName: { ...type.subtitle, color: palette.ink },
  profileEmail: { ...type.body, color: palette.body },
  profileProvider: { ...type.caption, color: palette.muted, marginTop: 2 },
  input: {
    backgroundColor: palette.primaryPale,
    borderRadius: radii.input,
    color: palette.ink,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: 18,
  },
  guestTitle: { ...type.subtitle, color: palette.ink },
  guestBody: { ...type.body, color: palette.body },
  error: { ...type.bodyStrong, color: palette.error, marginBottom: spacing.md, textAlign: 'center' },
  notice: { ...type.bodyStrong, color: palette.success, marginBottom: spacing.md, textAlign: 'center' },
  statusRow: { ...type.body, color: palette.body },
  dataBody: { ...type.body, color: palette.body },
  historyRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  historyMain: { flex: 1, minWidth: 0 },
  historyTitle: { ...type.bodyStrong, color: palette.ink },
  historySender: { ...type.caption, color: palette.muted, marginTop: 2 },
  historyMessage: { ...type.body, color: palette.ink, marginTop: 8 },
});

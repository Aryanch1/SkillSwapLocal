import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '../lib/theme';

/**
 * Aurora background: a soft warm-paper gradient with two slowly
 * drifting tinted blobs (sky blue and sunny amber). Pure decoration —
 * pointer-events disabled.
 */
export function AuroraBackground() {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 9000 }), -1, true);
  }, [drift]);
  const blobA = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * 24 },
      { translateY: drift.value * -18 },
    ],
  }));
  const blobB = useAnimatedStyle(() => ({
    transform: [
      { translateX: drift.value * -20 },
      { translateY: drift.value * 26 },
    ],
  }));
  return (
    <View style={styles.root} pointerEvents="none">
      <LinearGradient
        colors={[...palette.aurora]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.blobA, blobA]} />
      <Animated.View style={[styles.blobB, blobB]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // The drifting blobs sit partly off-screen (negative offsets) on
  // purpose — clip them here so they can never widen the page or cause
  // a horizontal scrollbar at any width.
  root: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  blobA: {
    backgroundColor: 'rgba(94, 58, 122, 0.12)',
    borderRadius: 200,
    height: 340,
    position: 'absolute',
    right: -80,
    top: -60,
    width: 340,
  },
  blobB: {
    backgroundColor: 'rgba(242, 160, 123, 0.16)',
    borderRadius: 220,
    height: 380,
    left: -120,
    position: 'absolute',
    top: '38%',
    width: 380,
  },
});

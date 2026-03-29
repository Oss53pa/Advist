import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '@/hooks/useOffline';
import { colors, spacing, typography } from '@/theme';

export const OfflineBanner: React.FC = () => {
  const { isOffline, pendingActionsCount } = useOffline();

  if (!isOffline && pendingActionsCount === 0) {
    return null;
  }

  return (
    <View style={[styles.container, isOffline ? styles.offline : styles.syncing]}>
      <Ionicons
        name={isOffline ? 'cloud-offline' : 'sync'}
        size={16}
        color={colors.surface}
      />
      <Text style={styles.text}>
        {isOffline
          ? 'Mode hors ligne'
          : `Synchronisation en cours (${pendingActionsCount} actions)`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  offline: {
    backgroundColor: colors.warning,
  },
  syncing: {
    backgroundColor: colors.info,
  },
  text: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '600',
  },
});

export default OfflineBanner;

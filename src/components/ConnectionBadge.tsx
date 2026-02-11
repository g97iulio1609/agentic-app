/**
 * Connection status badge component.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ACPConnectionState } from '../acp/models/types';
import { Colors, FontSize, Spacing } from '../utils/theme';

interface Props {
  state: ACPConnectionState;
  isInitialized: boolean;
}

export function ConnectionBadge({ state, isInitialized }: Props) {
  const { color, label } = getStatusInfo(state, isInitialized);

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

function getStatusInfo(state: ACPConnectionState, isInitialized: boolean) {
  switch (state) {
    case ACPConnectionState.Connected:
      return {
        color: isInitialized ? Colors.healthyGreen : Colors.orange,
        label: isInitialized ? 'Initialized' : 'Connected',
      };
    case ACPConnectionState.Connecting:
      return { color: Colors.yellow, label: 'Connecting…' };
    case ACPConnectionState.Failed:
      return { color: Colors.destructive, label: 'Failed' };
    case ACPConnectionState.Disconnected:
    default:
      return { color: Colors.systemGray, label: 'Disconnected' };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: '500',
  },
});

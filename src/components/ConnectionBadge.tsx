/**
 * Connection status badge — small dot indicator for header/sidebar use.
 */

import React from 'react';
import { YStack } from 'tamagui';
import { ACPConnectionState } from '../acp/models/types';
import { useDesignSystem } from '../utils/designSystem';
import type { ThemeColors } from '../utils/theme';

interface Props {
  state: ACPConnectionState;
  isInitialized: boolean;
}

export const ConnectionBadge = React.memo(function ConnectionBadge({ state, isInitialized }: Props) {
  const { colors } = useDesignSystem();
  const color = getDotColor(state, isInitialized, colors);

  return (
    <YStack justifyContent="center" alignItems="center">
      <YStack width={6} height={6} borderRadius={3} backgroundColor={color} />
    </YStack>
  );
});

function getDotColor(state: ACPConnectionState, isInitialized: boolean, colors: ThemeColors): string {
  switch (state) {
    case ACPConnectionState.Connected:
      return isInitialized ? colors.healthyGreen : colors.orange;
    case ACPConnectionState.Connecting:
      return colors.yellow;
    case ACPConnectionState.Failed:
      return colors.destructive;
    case ACPConnectionState.Disconnected:
    default:
      return colors.systemGray3;
  }
}

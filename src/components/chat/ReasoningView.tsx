/**
 * ReasoningView — Collapsible reasoning/thinking display.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import type { ThemeColors } from '../../utils/theme';
import { FontSize, Spacing, Radius } from '../../utils/theme';

interface Props {
  reasoning: string;
  colors: ThemeColors;
  isStreaming: boolean;
}

export const ReasoningView = React.memo(function ReasoningView({ reasoning, colors, isStreaming }: Props) {
  const [expanded, setExpanded] = useState(isStreaming);
  const lines = reasoning.split('\n').length;
  const preview = reasoning.length > 120 ? reasoning.substring(0, 120) + '…' : reasoning;

  return (
    <TouchableOpacity
      style={[styles.container, { borderColor: colors.separator, backgroundColor: colors.codeBackground }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={[styles.icon, { color: colors.primary }]}>🧠</Text>
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {isStreaming ? 'Thinking…' : `Thought for ${lines} lines`}
        </Text>
        {isStreaming && <ActivityIndicator size="small" color={colors.primary} />}
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>
          {expanded ? '▾' : '▸'}
        </Text>
      </View>
      {expanded ? (
        <Text style={[styles.content, { color: colors.textTertiary }]} selectable>
          {reasoning}
        </Text>
      ) : !isStreaming ? (
        <Text style={[styles.preview, { color: colors.textTertiary }]} numberOfLines={2}>
          {preview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
    flex: 1,
  },
  chevron: {
    fontSize: 14,
    fontWeight: '600',
    paddingLeft: 4,
  },
  content: {
    fontSize: FontSize.footnote,
    lineHeight: 20,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  preview: {
    fontSize: FontSize.caption,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

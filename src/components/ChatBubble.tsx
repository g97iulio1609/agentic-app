/**
 * Chat message bubble component.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { ChatMessage, MessageSegment } from '../acp/models/types';
import { Colors, FontSize, Spacing } from '../utils/theme';

interface Props {
  message: ChatMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
        isSystem && styles.systemContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          isSystem && styles.systemBubble,
        ]}
      >
        {message.segments && message.segments.length > 0 ? (
          message.segments.map((segment, index) => (
            <SegmentView key={index} segment={segment} />
          ))
        ) : (
          <Text
            style={[
              styles.messageText,
              isUser && styles.userText,
              isSystem && styles.systemText,
            ]}
            selectable
          >
            {message.content}
          </Text>
        )}
        {message.isStreaming && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={styles.streamingIndicator}
          />
        )}
      </View>
    </View>
  );
}

function SegmentView({ segment }: { segment: MessageSegment }) {
  const [expanded, setExpanded] = useState(false);

  switch (segment.type) {
    case 'text':
      return (
        <Text style={styles.messageText} selectable>
          {segment.content}
        </Text>
      );

    case 'toolCall':
      return (
        <TouchableOpacity
          style={styles.toolCallContainer}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <View style={styles.toolCallHeader}>
            <Text style={styles.toolCallIcon}>⚙️</Text>
            <Text style={styles.toolCallName}>{segment.toolName}</Text>
            {!segment.isComplete && (
              <ActivityIndicator size="small" color={Colors.orange} />
            )}
            {segment.isComplete && (
              <Text style={styles.toolCallCheck}>✓</Text>
            )}
          </View>
          {expanded && (
            <View style={styles.toolCallDetails}>
              <Text style={styles.toolCallLabel}>Input:</Text>
              <Text style={styles.toolCallCode} selectable>
                {segment.input}
              </Text>
              {segment.result && (
                <>
                  <Text style={styles.toolCallLabel}>Result:</Text>
                  <Text style={styles.toolCallCode} selectable>
                    {segment.result.substring(0, 500)}
                    {segment.result.length > 500 ? '…' : ''}
                  </Text>
                </>
              )}
            </View>
          )}
        </TouchableOpacity>
      );

    case 'thought':
      return (
        <TouchableOpacity
          style={styles.thoughtContainer}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.thoughtHeader}>
            💭 {expanded ? 'Thinking' : 'Thinking…'}
          </Text>
          {expanded && (
            <Text style={styles.thoughtContent} selectable>
              {segment.content}
            </Text>
          )}
        </TouchableOpacity>
      );

    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  systemContainer: {
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  userBubble: {
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    backgroundColor: Colors.systemGray6,
  },
  systemBubble: {
    backgroundColor: 'transparent',
  },
  messageText: {
    fontSize: FontSize.body,
    color: Colors.text,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  systemText: {
    color: Colors.systemGray,
    fontSize: FontSize.footnote,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  streamingIndicator: {
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  // Tool call styles
  toolCallContainer: {
    backgroundColor: Colors.systemGray5,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  toolCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toolCallIcon: {
    fontSize: 14,
  },
  toolCallName: {
    fontSize: FontSize.footnote,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  toolCallCheck: {
    color: Colors.healthyGreen,
    fontWeight: 'bold',
  },
  toolCallDetails: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  toolCallLabel: {
    fontSize: FontSize.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toolCallCode: {
    fontSize: FontSize.caption,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    backgroundColor: Colors.systemGray6,
    borderRadius: 4,
    padding: Spacing.xs,
  },
  // Thought styles
  thoughtContainer: {
    backgroundColor: `${Colors.yellow}20`,
    borderRadius: 8,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  thoughtHeader: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  thoughtContent: {
    fontSize: FontSize.footnote,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});

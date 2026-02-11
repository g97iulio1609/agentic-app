/**
 * Session detail screen – chat transcript + message composer.
 * Mirrors SessionDetailView from the Swift app.
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { ChatBubble } from '../components/ChatBubble';
import { MessageComposer } from '../components/MessageComposer';
import { ChatMessage, ACPConnectionState } from '../acp/models/types';
import { Colors, FontSize, Spacing } from '../utils/theme';

export function SessionDetailScreen() {
  const {
    chatMessages,
    promptText,
    isStreaming,
    connectionState,
    isInitialized,
    stopReason,
    selectedSessionId,
    sendPrompt,
    cancelPrompt,
    setPromptText,
  } = useAppStore();

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const isConnected =
    connectionState === ACPConnectionState.Connected && isInitialized;

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages.length, chatMessages[chatMessages.length - 1]?.content]);

  const handleSend = useCallback(() => {
    const text = promptText.trim();
    if (!text) return;
    sendPrompt(text);
  }, [promptText, sendPrompt]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    [],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {isConnected ? 'Start a conversation' : 'Not connected'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isConnected
            ? 'Type a message below to begin'
            : 'Connect to an agent to start chatting'}
        </Text>
      </View>
    ),
    [isConnected],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          chatMessages.length === 0
            ? styles.emptyList
            : styles.messageList
        }
        onContentSizeChange={() => {
          if (chatMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {stopReason && !isStreaming && (
        <View style={styles.stopReasonContainer}>
          <Text style={styles.stopReasonText}>
            {stopReason === 'end_turn'
              ? 'Agent finished'
              : `Stopped: ${stopReason}`}
          </Text>
        </View>
      )}

      <MessageComposer
        value={promptText}
        onChangeText={setPromptText}
        onSend={handleSend}
        onCancel={cancelPrompt}
        isStreaming={isStreaming}
        isDisabled={!isConnected}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.systemGray6,
  },
  messageList: {
    paddingVertical: Spacing.sm,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.title3,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: FontSize.body,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  stopReasonContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  stopReasonText: {
    fontSize: FontSize.caption,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});

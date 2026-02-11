/**
 * Message composer component (text input + send button).
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancel?: () => void;
  isStreaming: boolean;
  isDisabled: boolean;
  placeholder?: string;
}

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  onCancel,
  isStreaming,
  isDisabled,
  placeholder = 'Message the agent…',
}: Props) {
  const canSend = value.trim().length > 0 && !isStreaming && !isDisabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.systemGray2}
          multiline
          maxLength={10000}
          editable={!isDisabled}
          onSubmitEditing={() => {
            if (canSend) onSend();
          }}
          blurOnSubmit={false}
        />
        {isStreaming ? (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <View style={styles.stopIcon} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={!canSend}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.systemGray6,
    borderRadius: 20,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.text,
    maxHeight: 110,
    paddingTop: Platform.OS === 'ios' ? 0 : Spacing.xs,
    paddingBottom: 0,
  },
  sendButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    marginBottom: 1,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.systemGray4,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  cancelButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.destructive,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    marginBottom: 1,
  },
  stopIcon: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

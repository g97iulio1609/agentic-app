/**
 * Add/Edit Server screen — iOS Settings-style grouped fields.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../stores/appStore';
import { ServerType } from '../acp/models/types';
import { useTheme, FontSize, Spacing, Radius } from '../utils/theme';
import type { RootStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AddServer'>;

export function AddServerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddServer'>>();
  const editingServer = route.params?.editingServer;
  const { addServer, updateServer } = useAppStore();

  const [name, setName] = useState(editingServer?.name ?? '');
  const [scheme, setScheme] = useState(editingServer?.scheme ?? 'ws');
  const [host, setHost] = useState(editingServer?.host ?? '');
  const [token, setToken] = useState(editingServer?.token ?? '');
  const [workingDirectory, setWorkingDirectory] = useState(
    editingServer?.workingDirectory ?? '',
  );
  const [serverType, setServerType] = useState<ServerType>(
    editingServer?.serverType ?? ServerType.ACP,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cfAccessClientId, setCfAccessClientId] = useState(
    editingServer?.cfAccessClientId ?? '',
  );
  const [cfAccessClientSecret, setCfAccessClientSecret] = useState(
    editingServer?.cfAccessClientSecret ?? '',
  );

  const isEditing = !!editingServer;

  const handleSave = useCallback(async () => {
    const hostValue = host.trim();
    if (!hostValue) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Missing Field', 'Please enter a host address (e.g. localhost:8765)');
      return;
    }

    const serverData = {
      name: name.trim() || hostValue,
      scheme,
      host: hostValue,
      token: token.trim(),
      cfAccessClientId: cfAccessClientId.trim(),
      cfAccessClientSecret: cfAccessClientSecret.trim(),
      workingDirectory: workingDirectory.trim(),
      serverType,
    };

    try {
      if (isEditing && editingServer) {
        await updateServer({ ...serverData, id: editingServer.id });
      } else {
        await addServer(serverData);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', `Failed to save server: ${(error as Error).message}`);
    }
  }, [
    name,
    scheme,
    host,
    token,
    cfAccessClientId,
    cfAccessClientSecret,
    workingDirectory,
    serverType,
    isEditing,
    editingServer,
    addServer,
    updateServer,
    navigation,
  ]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.systemGray6 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, Spacing.lg) + Spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Protocol section */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.cardLabel, { color: colors.textTertiary }]}>Protocol</Text>
          <View style={[styles.segmentedControl, { backgroundColor: colors.systemGray5 }]}>
            <TouchableOpacity
              style={[
                styles.segment,
                serverType === ServerType.ACP && [styles.segmentSelected, { backgroundColor: colors.cardBackground }],
              ]}
              onPress={() => setServerType(ServerType.ACP)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.textTertiary },
                  serverType === ServerType.ACP && { color: colors.text, fontWeight: '600' },
                ]}
              >
                ACP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                serverType === ServerType.Codex && [styles.segmentSelected, { backgroundColor: colors.cardBackground }],
              ]}
              onPress={() => setServerType(ServerType.Codex)}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: colors.textTertiary },
                  serverType === ServerType.Codex && { color: colors.text, fontWeight: '600' },
                ]}
              >
                Codex
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection section */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Name</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="My Agent"
              placeholderTextColor={colors.systemGray2}
              autoCapitalize="none"
            />
          </View>
          <View style={[styles.fieldSeparator, { backgroundColor: colors.separator }]} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Scheme</Text>
            <View style={[styles.segmentedControlSmall, { backgroundColor: colors.systemGray5 }]}>
              {(['ws', 'wss'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.segmentSmall,
                    scheme === s && [styles.segmentSelected, { backgroundColor: colors.cardBackground }],
                  ]}
                  onPress={() => setScheme(s)}
                >
                  <Text
                    style={[
                      styles.segmentTextSmall,
                      { color: colors.textTertiary },
                      scheme === s && { color: colors.text, fontWeight: '600' },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[styles.fieldSeparator, { backgroundColor: colors.separator }]} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Host</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={host}
              onChangeText={setHost}
              placeholder="localhost:8765"
              placeholderTextColor={colors.systemGray2}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
        </View>

        {/* Optional section */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Token</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={token}
              onChangeText={setToken}
              placeholder="Bearer token"
              placeholderTextColor={colors.systemGray2}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </View>
          <View style={[styles.fieldSeparator, { backgroundColor: colors.separator }]} />
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Directory</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={workingDirectory}
              onChangeText={setWorkingDirectory}
              placeholder="/path/to/workspace"
              placeholderTextColor={colors.systemGray2}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Advanced: Cloudflare Access */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => setShowAdvanced(!showAdvanced)}
          activeOpacity={0.7}
        >
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Cloudflare Access</Text>
            <Text style={[styles.chevronText, { color: colors.textTertiary }]}>
              {showAdvanced ? '▾' : '▸'}
            </Text>
          </View>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Client ID</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={cfAccessClientId}
                onChangeText={setCfAccessClientId}
                placeholder="Client ID"
                placeholderTextColor={colors.systemGray2}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={[styles.fieldSeparator, { backgroundColor: colors.separator }]} />
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Secret</Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={cfAccessClientSecret}
                onChangeText={setCfAccessClientSecret}
                placeholder="Client Secret"
                placeholderTextColor={colors.systemGray2}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {isEditing ? 'Update Server' : 'Add Server'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  cardLabel: {
    fontSize: FontSize.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  fieldLabel: {
    fontSize: FontSize.body,
    fontWeight: '400',
    width: 90,
  },
  fieldInput: {
    flex: 1,
    fontSize: FontSize.body,
    textAlign: 'right',
    paddingVertical: 0,
  },
  fieldSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 0,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: Radius.sm,
    padding: 2,
    marginBottom: Spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
  },
  segmentedControlSmall: {
    flexDirection: 'row',
    borderRadius: 6,
    padding: 2,
  },
  segmentSmall: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 5,
  },
  segmentTextSmall: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
  },
  chevronText: {
    fontSize: 14,
  },
  saveButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});

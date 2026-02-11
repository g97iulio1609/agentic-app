/**
 * Add/Edit Server screen.
 * Mirrors AddServerView from the Swift app.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../stores/appStore';
import { ACPServerConfiguration, ServerType } from '../acp/models/types';
import { Colors, FontSize, Spacing } from '../utils/theme';
import type { RootStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AddServer'>;

export function AddServerScreen() {
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
    if (!host.trim()) {
      Alert.alert('Error', 'Host is required');
      return;
    }

    const serverData = {
      name: name.trim() || host.trim(),
      scheme,
      host: host.trim(),
      token: token.trim(),
      cfAccessClientId: cfAccessClientId.trim(),
      cfAccessClientSecret: cfAccessClientSecret.trim(),
      workingDirectory: workingDirectory.trim(),
      serverType,
    };

    if (isEditing && editingServer) {
      await updateServer({ ...serverData, id: editingServer.id });
    } else {
      await addServer(serverData);
    }

    navigation.goBack();
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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Server Type Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Protocol</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segment,
                serverType === ServerType.ACP && styles.segmentSelected,
              ]}
              onPress={() => setServerType(ServerType.ACP)}
            >
              <Text
                style={[
                  styles.segmentText,
                  serverType === ServerType.ACP && styles.segmentTextSelected,
                ]}
              >
                ACP
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                serverType === ServerType.Codex && styles.segmentSelected,
              ]}
              onPress={() => setServerType(ServerType.Codex)}
            >
              <Text
                style={[
                  styles.segmentText,
                  serverType === ServerType.Codex && styles.segmentTextSelected,
                ]}
              >
                Codex
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="My Agent"
            placeholderTextColor={Colors.systemGray2}
            autoCapitalize="none"
          />
        </View>

        {/* Scheme */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Scheme</Text>
          <View style={styles.segmentedControl}>
            {['ws', 'wss'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.segment, scheme === s && styles.segmentSelected]}
                onPress={() => setScheme(s)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    scheme === s && styles.segmentTextSelected,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Host */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Host</Text>
          <TextInput
            style={styles.input}
            value={host}
            onChangeText={setHost}
            placeholder="localhost:8765"
            placeholderTextColor={Colors.systemGray2}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        {/* Token */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bearer Token (optional)</Text>
          <TextInput
            style={styles.input}
            value={token}
            onChangeText={setToken}
            placeholder="Enter token"
            placeholderTextColor={Colors.systemGray2}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />
        </View>

        {/* Working Directory */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Working Directory (optional)</Text>
          <TextInput
            style={styles.input}
            value={workingDirectory}
            onChangeText={setWorkingDirectory}
            placeholder="/path/to/workspace"
            placeholderTextColor={Colors.systemGray2}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Advanced: Cloudflare Access */}
        <TouchableOpacity
          style={styles.advancedToggle}
          onPress={() => setShowAdvanced(!showAdvanced)}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? '▼' : '▶'} Cloudflare Access
          </Text>
        </TouchableOpacity>

        {showAdvanced && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CF-Access-Client-Id</Text>
              <TextInput
                style={styles.input}
                value={cfAccessClientId}
                onChangeText={setCfAccessClientId}
                placeholder="Client ID"
                placeholderTextColor={Colors.systemGray2}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>CF-Access-Client-Secret</Text>
              <TextInput
                style={styles.input}
                value={cfAccessClientSecret}
                onChangeText={setCfAccessClientSecret}
                placeholder="Client Secret"
                placeholderTextColor={Colors.systemGray2}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>
          </>
        )}

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
    backgroundColor: Colors.systemGray6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.footnote,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.separator,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.systemGray5,
    borderRadius: 8,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentSelected: {
    backgroundColor: Colors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: FontSize.footnote,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  segmentTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  advancedToggle: {
    paddingVertical: Spacing.sm,
  },
  advancedToggleText: {
    fontSize: FontSize.footnote,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});

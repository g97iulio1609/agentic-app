/**
 * HomeScreen – Server list + session sidebar.
 * Mirrors ContentView from the Swift app.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../stores/appStore';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { ACPConnectionState, SessionSummary } from '../acp/models/types';
import { Colors, FontSize, Spacing } from '../utils/theme';
import type { RootStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const {
    servers,
    selectedServerId,
    connectionState,
    isInitialized,
    agentInfo,
    sessions,
    selectedSessionId,
    connectionError,
    loadServers,
    selectServer,
    connect,
    disconnect,
    createSession,
    selectSession,
    deleteSession,
    loadSessions,
  } = useAppStore();

  useEffect(() => {
    loadServers();
  }, []);

  const selectedServer = servers.find(s => s.id === selectedServerId);
  const isConnected = connectionState === ACPConnectionState.Connected;

  const handleServerPress = useCallback(
    (id: string) => {
      if (selectedServerId === id) return;
      selectServer(id);
    },
    [selectedServerId, selectServer],
  );

  const handleConnect = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  const handleNewSession = useCallback(() => {
    createSession();
  }, [createSession]);

  const handleSessionPress = useCallback(
    (session: SessionSummary) => {
      selectSession(session.id);
      navigation.navigate('Session');
    },
    [selectSession, navigation],
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      Alert.alert('Delete Session', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSession(sessionId),
        },
      ]);
    },
    [deleteSession],
  );

  const renderServerItem = useCallback(
    ({ item }: { item: typeof servers[0] }) => {
      const isSelected = item.id === selectedServerId;
      return (
        <TouchableOpacity
          style={[styles.serverItem, isSelected && styles.serverItemSelected]}
          onPress={() => handleServerPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.serverInfo}>
            <Text style={styles.serverName} numberOfLines={1}>
              {item.name || item.host}
            </Text>
            <Text style={styles.serverHost} numberOfLines={1}>
              {item.scheme}://{item.host}
            </Text>
          </View>
          {isSelected && (
            <ConnectionBadge
              state={connectionState}
              isInitialized={isInitialized}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedServerId, connectionState, isInitialized, handleServerPress],
  );

  const renderSessionItem = useCallback(
    ({ item }: { item: SessionSummary }) => {
      const isSelected = item.id === selectedSessionId;
      return (
        <TouchableOpacity
          style={[styles.sessionItem, isSelected && styles.sessionItemSelected]}
          onPress={() => handleSessionPress(item)}
          onLongPress={() => handleDeleteSession(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.sessionTitle} numberOfLines={1}>
            {item.title || 'New Session'}
          </Text>
          {item.updatedAt && (
            <Text style={styles.sessionDate}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
      );
    },
    [selectedSessionId, handleSessionPress, handleDeleteSession],
  );

  return (
    <View style={styles.container}>
      {/* Server List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Servers</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddServer')}
            style={styles.addButton}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {servers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No servers configured</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddServer')}
            >
              <Text style={styles.emptyButtonText}>Add Server</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={servers}
            keyExtractor={item => item.id}
            renderItem={renderServerItem}
            style={styles.serverList}
          />
        )}
      </View>

      {/* Selected Server Actions */}
      {selectedServer && (
        <View style={styles.serverActions}>
          {connectionError && (
            <Text style={styles.errorText} numberOfLines={2}>
              {connectionError}
            </Text>
          )}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isConnected ? styles.disconnectButton : styles.connectButton,
              ]}
              onPress={handleConnect}
            >
              <Text style={styles.actionButtonText}>
                {isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>

            {isInitialized && (
              <TouchableOpacity
                style={[styles.actionButton, styles.newSessionButton]}
                onPress={handleNewSession}
              >
                <Text style={styles.actionButtonText}>New Session</Text>
              </TouchableOpacity>
            )}
          </View>

          {agentInfo && (
            <Text style={styles.agentInfoText}>
              {agentInfo.name} {agentInfo.version}
            </Text>
          )}
        </View>
      )}

      {/* Session List */}
      {selectedServer && sessions.length > 0 && (
        <View style={[styles.section, { flex: 1 }]}>
          <Text style={styles.sectionTitle}>Sessions</Text>
          <FlatList
            data={sessions}
            keyExtractor={item => item.id}
            renderItem={renderSessionItem}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={loadSessions}
              />
            }
            style={styles.sessionList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.systemGray6,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.headline,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: -2,
  },
  serverList: {
    maxHeight: 200,
  },
  serverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardBackground,
    marginHorizontal: Spacing.lg,
    marginVertical: 2,
    borderRadius: 10,
  },
  serverItemSelected: {
    backgroundColor: `${Colors.primary}15`,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  serverInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  serverName: {
    fontSize: FontSize.body,
    fontWeight: '500',
    color: Colors.text,
  },
  serverHost: {
    fontSize: FontSize.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  serverActions: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: Colors.primary,
  },
  disconnectButton: {
    backgroundColor: Colors.destructive,
  },
  newSessionButton: {
    backgroundColor: Colors.healthyGreen,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.body,
    fontWeight: '600',
  },
  agentInfoText: {
    fontSize: FontSize.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: FontSize.caption,
    color: Colors.destructive,
    textAlign: 'center',
  },
  sessionList: {
    flex: 1,
  },
  sessionItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cardBackground,
    marginHorizontal: Spacing.lg,
    marginVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionItemSelected: {
    backgroundColor: `${Colors.primary}15`,
  },
  sessionTitle: {
    fontSize: FontSize.body,
    color: Colors.text,
    flex: 1,
  },
  sessionDate: {
    fontSize: FontSize.caption,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.textTertiary,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.body,
    fontWeight: '600',
  },
});

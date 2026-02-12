/**
 * HomeScreen – Server list + session sidebar.
 * Mirrors ContentView from the Swift app.
 */

import React, { useEffect, useCallback } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../stores/appStore';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { ACPConnectionState, SessionSummary } from '../acp/models/types';
import { useDesignSystem } from '../utils/designSystem';
import { FontSize, Spacing, Radius } from '../utils/theme';
import type { RootStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useDesignSystem();
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
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              marginHorizontal: Spacing.lg,
              marginVertical: 2,
              backgroundColor: colors.cardBackground,
              borderRadius: Radius.md,
              ...Platform.select({ android: { elevation: 1 } }),
            },
            isSelected && { backgroundColor: `${colors.primary}15`, borderWidth: 1, borderColor: colors.primary },
          ]}
          onPress={() => handleServerPress(item.id)}
          activeOpacity={0.7}
          accessibilityLabel={`Server: ${item.name || item.host}`}
        >
          <YStack flex={1} marginRight={Spacing.sm}>
            <Text color={colors.text} fontSize={FontSize.body} fontWeight="500" numberOfLines={1}>
              {item.name || item.host}
            </Text>
            <Text color={colors.textTertiary} fontSize={FontSize.caption} marginTop={2} numberOfLines={1}>
              {item.scheme}://{item.host}
            </Text>
          </YStack>
          {isSelected && (
            <ConnectionBadge
              state={connectionState}
              isInitialized={isInitialized}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedServerId, connectionState, isInitialized, handleServerPress, colors],
  );

  const renderSessionItem = useCallback(
    ({ item }: { item: SessionSummary }) => {
      const isSelected = item.id === selectedSessionId;
      return (
        <TouchableOpacity
          style={[
            {
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              marginHorizontal: Spacing.lg,
              marginVertical: 2,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: colors.cardBackground,
              borderRadius: Radius.md,
              ...Platform.select({ android: { elevation: 1 } }),
            },
            isSelected && { backgroundColor: `${colors.primary}15` },
          ]}
          onPress={() => handleSessionPress(item)}
          onLongPress={() => handleDeleteSession(item.id)}
          activeOpacity={0.7}
          accessibilityLabel={`Session: ${item.title || 'New Session'}`}
        >
          <Text color={colors.text} fontSize={FontSize.body} flex={1} numberOfLines={1}>
            {item.title || 'New Session'}
          </Text>
          {item.updatedAt && (
            <Text color={colors.textTertiary} fontSize={FontSize.caption} marginLeft={Spacing.sm}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
      );
    },
    [selectedSessionId, handleSessionPress, handleDeleteSession, colors],
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Server List */}
      <YStack marginBottom={Spacing.sm}>
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingHorizontal={Spacing.lg}
          paddingVertical={Spacing.sm}
        >
          <Text color="$color" fontSize={FontSize.headline} fontWeight="600">Servers</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddServer')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessibilityLabel="Add server"
          >
            <Text color={colors.surface} fontSize={20} fontWeight="600" marginTop={-2}>+</Text>
          </TouchableOpacity>
        </XStack>

        {servers.length === 0 ? (
          <YStack alignItems="center" paddingVertical={Spacing.xxl} gap={Spacing.md}>
            <Text color="$textTertiary" fontSize={FontSize.body}>
              Get started by adding your first server
            </Text>
            <TouchableOpacity
              style={{
                paddingHorizontal: Spacing.xl,
                paddingVertical: Spacing.sm,
                backgroundColor: colors.primary,
                borderRadius: Radius.md,
              }}
              onPress={() => navigation.navigate('AddServer')}
              accessibilityLabel="Add server"
            >
              <Text color={colors.surface} fontSize={FontSize.body} fontWeight="600">Add Server</Text>
            </TouchableOpacity>
          </YStack>
        ) : (
          <FlatList
            data={servers}
            keyExtractor={item => item.id}
            renderItem={renderServerItem}
            style={{ maxHeight: 200 }}
          />
        )}
      </YStack>

      {/* Selected Server Actions */}
      {selectedServer && (
        <YStack paddingHorizontal={Spacing.lg} paddingVertical={Spacing.sm} gap={Spacing.sm}>
          {connectionError && (
            <>
              <Text
                color={colors.destructive}
                fontSize={FontSize.caption}
                textAlign="center"
                numberOfLines={2}
              >
                {connectionError}
              </Text>
              <TouchableOpacity
                style={{
                  alignSelf: 'center',
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.destructive,
                  borderRadius: Radius.md,
                }}
                onPress={() => connect()}
                accessibilityLabel="Retry connection"
              >
                <Text color={colors.destructive} fontSize={FontSize.caption} fontWeight="600">Retry</Text>
              </TouchableOpacity>
            </>
          )}
          <XStack gap={Spacing.sm}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: Spacing.sm,
                alignItems: 'center',
                borderRadius: Radius.md,
                backgroundColor: isConnected ? colors.destructive : colors.primary,
              }}
              onPress={handleConnect}
              accessibilityLabel={isConnected ? 'Disconnect from server' : 'Connect to server'}
            >
              <Text color={colors.surface} fontSize={FontSize.body} fontWeight="600">
                {isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>

            {isInitialized && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: Spacing.sm,
                  alignItems: 'center',
                  backgroundColor: colors.healthyGreen,
                  borderRadius: Radius.md,
                }}
                onPress={handleNewSession}
                accessibilityLabel="Create new session"
              >
                <Text color={colors.surface} fontSize={FontSize.body} fontWeight="600">New Session</Text>
              </TouchableOpacity>
            )}
          </XStack>

          {agentInfo && (
            <Text color="$textTertiary" fontSize={FontSize.caption} textAlign="center">
              {agentInfo.name} {agentInfo.version}
            </Text>
          )}
        </YStack>
      )}

      {/* Session List */}
      {selectedServer && sessions.length > 0 && (
        <YStack flex={1} marginBottom={Spacing.sm}>
          <Text
            color="$color"
            fontSize={FontSize.headline}
            fontWeight="600"
            paddingHorizontal={Spacing.lg}
            paddingVertical={Spacing.sm}
          >
            Sessions
          </Text>
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
            style={{ flex: 1 }}
          />
        </YStack>
      )}
    </YStack>
  );
}

/**
 * Persistent storage using AsyncStorage.
 * Replaces Core Data from the Swift version.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACPServerConfiguration, SessionSummary, ChatMessage, ServerType } from '../acp/models/types';
import type { MCPServerConfig } from '../mcp/types';

const SERVERS_KEY = '@agentic/servers';
const MCP_SERVERS_KEY = '@agentic/mcp-servers';
const sessionsKey = (serverId: string) => `@agentic/sessions/${serverId}`;
const messagesKey = (serverId: string, sessionId: string) =>
  `@agentic/messages/${serverId}/${sessionId}`;

export const SessionStorage = {
  // --- Server Operations ---

  async fetchServers(): Promise<ACPServerConfiguration[]> {
    try {
      const raw = await AsyncStorage.getItem(SERVERS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as ACPServerConfiguration[];
    } catch {
      return [];
    }
  },

  async saveServer(server: ACPServerConfiguration): Promise<void> {
    const servers = await this.fetchServers();
    const idx = servers.findIndex(s => s.id === server.id);
    if (idx !== -1) {
      servers[idx] = server;
    } else {
      servers.push(server);
    }
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  },

  async deleteServer(id: string): Promise<void> {
    const servers = await this.fetchServers();
    const filtered = servers.filter(s => s.id !== id);
    await AsyncStorage.setItem(SERVERS_KEY, JSON.stringify(filtered));
    // Also delete all sessions and messages for this server
    const sessions = await this.fetchSessions(id);
    for (const session of sessions) {
      await AsyncStorage.removeItem(messagesKey(id, session.id));
    }
    await AsyncStorage.removeItem(sessionsKey(id));
  },

  // --- Session Operations ---

  async fetchSessions(serverId: string): Promise<SessionSummary[]> {
    try {
      const raw = await AsyncStorage.getItem(sessionsKey(serverId));
      if (!raw) return [];
      return JSON.parse(raw) as SessionSummary[];
    } catch {
      return [];
    }
  },

  async saveSession(session: SessionSummary, serverId: string): Promise<void> {
    const sessions = await this.fetchSessions(serverId);
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx !== -1) {
      // Merge: don't overwrite fields with undefined
      sessions[idx] = {
        ...sessions[idx],
        ...Object.fromEntries(
          Object.entries(session).filter(([, v]) => v !== undefined)
        ),
      };
    } else {
      sessions.unshift(session);
    }
    await AsyncStorage.setItem(sessionsKey(serverId), JSON.stringify(sessions));
  },

  async deleteSession(sessionId: string, serverId: string): Promise<void> {
    const sessions = await this.fetchSessions(serverId);
    const filtered = sessions.filter(s => s.id !== sessionId);
    await AsyncStorage.setItem(sessionsKey(serverId), JSON.stringify(filtered));
    await AsyncStorage.removeItem(messagesKey(serverId, sessionId));
  },

  // --- Message Operations ---

  async saveMessages(
    messages: ChatMessage[],
    serverId: string,
    sessionId: string,
  ): Promise<void> {
    await AsyncStorage.setItem(
      messagesKey(serverId, sessionId),
      JSON.stringify(messages),
    );
  },

  async fetchMessages(serverId: string, sessionId: string): Promise<ChatMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(messagesKey(serverId, sessionId));
      if (!raw) return [];
      return JSON.parse(raw) as ChatMessage[];
    } catch {
      return [];
    }
  },

  async deleteMessages(serverId: string, sessionId: string): Promise<void> {
    await AsyncStorage.removeItem(messagesKey(serverId, sessionId));
  },

  // --- MCP Server Operations ---

  async fetchMCPServers(): Promise<MCPServerConfig[]> {
    try {
      const raw = await AsyncStorage.getItem(MCP_SERVERS_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as MCPServerConfig[];
    } catch {
      return [];
    }
  },

  async saveMCPServer(server: MCPServerConfig): Promise<void> {
    const servers = await this.fetchMCPServers();
    const idx = servers.findIndex(s => s.id === server.id);
    if (idx !== -1) {
      servers[idx] = server;
    } else {
      servers.push(server);
    }
    await AsyncStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(servers));
  },

  async deleteMCPServer(id: string): Promise<void> {
    const servers = await this.fetchMCPServers();
    const filtered = servers.filter(s => s.id !== id);
    await AsyncStorage.setItem(MCP_SERVERS_KEY, JSON.stringify(filtered));
  },
};

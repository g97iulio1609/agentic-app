/**
 * MCP Manager — manages multiple MCP server connections and aggregates tools.
 */

import { MCPClient } from './MCPClient';
import type {
  MCPServerConfig,
  MCPToolInfo,
  MCPResourceInfo,
  MCPServerStatus,
} from './types';
import { MCPConnectionState } from './types';

class MCPManagerSingleton {
  private clients: Map<string, MCPClient> = new Map();
  private configs: Map<string, MCPServerConfig> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Register a state change listener.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Add and optionally connect an MCP server.
   */
  async addServer(config: MCPServerConfig, autoConnect = true): Promise<void> {
    this.configs.set(config.id, config);
    if (autoConnect && config.enabled) {
      await this.connectServer(config.id);
    }
    this.notify();
  }

  /**
   * Remove an MCP server and disconnect if connected.
   */
  async removeServer(id: string): Promise<void> {
    await this.disconnectServer(id);
    this.configs.delete(id);
    this.notify();
  }

  /**
   * Connect to a specific MCP server.
   */
  async connectServer(id: string): Promise<void> {
    const config = this.configs.get(id);
    if (!config) throw new Error(`MCP server ${id} not found`);

    // Disconnect existing client if any
    const existing = this.clients.get(id);
    if (existing) {
      await existing.disconnect();
    }

    const client = new MCPClient(config);
    this.clients.set(id, client);
    this.notify();

    try {
      await client.connect();
    } finally {
      this.notify();
    }
  }

  /**
   * Disconnect from a specific MCP server.
   */
  async disconnectServer(id: string): Promise<void> {
    const client = this.clients.get(id);
    if (client) {
      await client.disconnect();
      this.clients.delete(id);
      this.notify();
    }
  }

  /**
   * Get all tools from all connected MCP servers.
   */
  getAllTools(): MCPToolInfo[] {
    const tools: MCPToolInfo[] = [];
    for (const client of this.clients.values()) {
      if (client.state === MCPConnectionState.Connected) {
        tools.push(...client.tools);
      }
    }
    return tools;
  }

  /**
   * Get all resources from all connected MCP servers.
   */
  getAllResources(): MCPResourceInfo[] {
    const resources: MCPResourceInfo[] = [];
    for (const client of this.clients.values()) {
      if (client.state === MCPConnectionState.Connected) {
        resources.push(...client.resources);
      }
    }
    return resources;
  }

  /**
   * Get status of all configured servers.
   */
  getServerStatuses(): MCPServerStatus[] {
    const statuses: MCPServerStatus[] = [];
    for (const [id, config] of this.configs) {
      const client = this.clients.get(id);
      statuses.push({
        serverId: id,
        state: client?.state ?? MCPConnectionState.Disconnected,
        error: client?.error ?? undefined,
        toolCount: client?.tools.length ?? 0,
        resourceCount: client?.resources.length ?? 0,
      });
    }
    return statuses;
  }

  /**
   * Get a specific client for direct tool calls.
   */
  getClient(serverId: string): MCPClient | undefined {
    return this.clients.get(serverId);
  }

  /**
   * Call a tool by name — finds the right MCP server automatically.
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    for (const client of this.clients.values()) {
      if (client.state !== MCPConnectionState.Connected) continue;
      const hasTool = client.tools.some((t) => t.name === toolName);
      if (hasTool) {
        return client.callTool(toolName, args);
      }
    }
    throw new Error(`Tool "${toolName}" not found on any connected MCP server`);
  }

  /**
   * Disconnect all servers.
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((id) =>
      this.disconnectServer(id),
    );
    await Promise.allSettled(promises);
  }
}

// Singleton export
export const MCPManager = new MCPManagerSingleton();

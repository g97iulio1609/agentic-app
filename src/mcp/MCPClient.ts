/**
 * MCP Client wrapper — connects to a single MCP server, lists tools/resources,
 * and invokes tools on behalf of the AI SDK.
 */

import { Client } from '@modelcontextprotocol/sdk/client';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type {
  MCPServerConfig,
  MCPAuthConfig,
  MCPAuthType,
  MCPToolInfo,
  MCPResourceInfo,
  MCPConnectionState,
} from './types';
import { MCPConnectionState as ConnState } from './types';

export class MCPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport | null = null;
  private config: MCPServerConfig;
  private _state: MCPConnectionState = ConnState.Disconnected;
  private _tools: MCPToolInfo[] = [];
  private _resources: MCPResourceInfo[] = [];
  private _error: string | null = null;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.client = new Client(
      { name: 'Agentic', version: '1.0.0' },
      { capabilities: {} },
    );
  }

  get state(): MCPConnectionState {
    return this._state;
  }

  get tools(): MCPToolInfo[] {
    return this._tools;
  }

  get resources(): MCPResourceInfo[] {
    return this._resources;
  }

  get error(): string | null {
    return this._error;
  }

  async connect(): Promise<void> {
    this._state = ConnState.Connecting;
    this._error = null;

    try {
      const headers = buildAuthHeaders(this.config.auth);

      this.transport = new StreamableHTTPClientTransport(
        new URL(this.config.url),
        {
          requestInit: {
            headers: new Headers(headers),
          },
        },
      );

      await this.client.connect(this.transport);
      this._state = ConnState.Connected;

      // Discover tools and resources
      await this.discoverCapabilities();
    } catch (err) {
      this._state = ConnState.Error;
      this._error = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.close();
      }
    } catch {
      // ignore close errors
    }
    this._state = ConnState.Disconnected;
    this._tools = [];
    this._resources = [];
    this._error = null;
  }

  private async discoverCapabilities(): Promise<void> {
    // Discover tools
    try {
      const { tools } = await this.client.listTools();
      this._tools = tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema as Record<string, unknown>,
        serverId: this.config.id,
        serverName: this.config.name,
      }));
    } catch {
      // Server may not support tools
      this._tools = [];
    }

    // Discover resources
    try {
      const { resources } = await this.client.listResources();
      this._resources = resources.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
        serverId: this.config.id,
      }));
    } catch {
      // Server may not support resources
      this._resources = [];
    }
  }

  /**
   * Call a tool on this MCP server.
   */
  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const result = await this.client.callTool({ name, arguments: args });

    // Extract text content from the result
    const textParts: string[] = [];
    if (result.content && Array.isArray(result.content)) {
      for (const part of result.content) {
        if (typeof part === 'object' && part !== null && 'type' in part) {
          if (part.type === 'text' && 'text' in part) {
            textParts.push(part.text as string);
          }
        }
      }
    }

    return textParts.join('\n') || JSON.stringify(result.content);
  }

  /**
   * Read a resource from this MCP server.
   */
  async readResource(uri: string): Promise<string> {
    const { contents } = await this.client.readResource({ uri });
    const parts: string[] = [];
    for (const content of contents) {
      if ('text' in content) {
        parts.push(content.text);
      }
    }
    return parts.join('\n');
  }
}

// ── Helper ──

function buildAuthHeaders(auth: MCPAuthConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  switch (auth.type) {
    case 'bearer' as MCPAuthType:
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      break;

    case 'api_key' as MCPAuthType:
      if (auth.apiKey) {
        const headerName = auth.headerName || 'X-API-Key';
        headers[headerName] = auth.apiKey;
      }
      break;

    default:
      break;
  }

  return headers;
}

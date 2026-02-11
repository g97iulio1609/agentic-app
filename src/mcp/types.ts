/**
 * MCP (Model Context Protocol) types for external server connections.
 */

export enum MCPAuthType {
  None = 'none',
  Bearer = 'bearer',
  ApiKey = 'api_key',
  // OAuth = 'oauth', // Future
}

export interface MCPAuthConfig {
  type: MCPAuthType;
  /** Bearer token (for Bearer auth) */
  token?: string;
  /** Header name for API key auth (default: 'X-API-Key') */
  headerName?: string;
  /** API key value */
  apiKey?: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  /** Full URL to the MCP endpoint (e.g., https://server.example.com/mcp) */
  url: string;
  auth: MCPAuthConfig;
  /** Whether to auto-connect on app start */
  autoConnect: boolean;
  /** Whether the server is currently enabled */
  enabled: boolean;
}

export interface MCPToolInfo {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  /** Which MCP server provides this tool */
  serverId: string;
  serverName: string;
}

export interface MCPResourceInfo {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  serverId: string;
}

export enum MCPConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

export interface MCPServerStatus {
  serverId: string;
  state: MCPConnectionState;
  error?: string;
  toolCount: number;
  resourceCount: number;
}

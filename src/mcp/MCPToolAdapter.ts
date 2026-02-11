/**
 * Converts MCP tools into AI SDK tool definitions, bridging MCP servers
 * with the AI SDK's `streamText({ tools })` parameter.
 */

import { tool, jsonSchema } from 'ai';
import type { ToolSet } from 'ai';
import type { MCPToolInfo } from './types';
import { MCPManager } from './MCPManager';

/**
 * Build an AI SDK tools object from all connected MCP server tools.
 * Each tool's `execute` calls back into the MCP server.
 */
export function buildMCPTools(): ToolSet {
  const mcpTools = MCPManager.getAllTools();
  const tools: ToolSet = {};

  for (const mcpTool of mcpTools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description ?? mcpTool.name,
      inputSchema: jsonSchema(mcpTool.inputSchema as Parameters<typeof jsonSchema>[0]),
      execute: async (args: Record<string, unknown>) => {
        try {
          const result = await MCPManager.callTool(mcpTool.name, args);
          return result;
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    }) as ToolSet[string];
  }

  return tools;
}

/**
 * Get a summary of available MCP tools for display.
 */
export function getMCPToolsSummary(): { serverName: string; toolName: string; description: string }[] {
  return MCPManager.getAllTools().map((t) => ({
    serverName: t.serverName,
    toolName: t.name,
    description: t.description ?? '',
  }));
}

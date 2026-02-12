/**
 * Deep Agents — React Native adapters and re-exports.
 */

// RN-specific adapters
export { AsyncStorageMemoryAdapter } from './AsyncStorageMemoryAdapter';
export { VirtualFilesystemRN } from './VirtualFilesystemRN';

// Re-export core from @onegenui/deep-agents
export {
  DeepAgent,
  DeepAgentBuilder,
  EventBus,
  ApprovalManager,
  ApproximateTokenCounter,
  InMemoryAdapter,
  TokenTracker,
  ContextManager,
  RollingSummarizer,
  createFilesystemTools,
  createPlanningTools,
  createSubagentTools,
} from '@onegenui/deep-agents';

export type {
  DeepAgentConfig,
  AgentEvent,
  AgentEventType,
  AgentEventHandler,
  MemoryPort,
  FilesystemPort,
  TokenCounterPort,
  McpPort,
  Message as DeepAgentMessage,
} from '@onegenui/deep-agents';

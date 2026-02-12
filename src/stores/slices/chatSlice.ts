import { StateCreator } from 'zustand';
import type { AppState, AppActions } from '../appStore';
import { v4 as uuidv4 } from 'uuid';
import {
  ChatMessage,
  ServerType,
} from '../../acp/models/types';
import { JSONValue } from '../../acp/models';
import { SessionStorage } from '../../storage/SessionStorage';
import { streamChat } from '../../ai/AIService';
import { getApiKey } from '../../storage/SecureStorage';
import { updateMessageById, detectArtifacts } from '../helpers';
import {
  _service, _aiAbortController,
  setAiAbortController,
} from '../storePrivate';

export type ChatSlice = Pick<AppState, 'streamingMessageId' | 'stopReason' | 'isStreaming' | 'promptText'>
  & Pick<AppActions, 'sendPrompt' | 'cancelPrompt' | 'setPromptText'>;

export const createChatSlice: StateCreator<AppState & AppActions, [], [], ChatSlice> = (set, get) => ({
  // State
  streamingMessageId: null,
  stopReason: null,
  isStreaming: false,
  promptText: '',

  // Actions

  sendPrompt: async (text, attachments) => {
    const state = get();
    const server = state.servers.find(s => s.id === state.selectedServerId);
    if (!server) return;

    // Auto-create session if none selected
    let sessionId = state.selectedSessionId;
    if (!sessionId) {
      await get().createSession();
      sessionId = get().selectedSessionId;
      if (!sessionId) return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: text,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
      timestamp: new Date().toISOString(),
    };

    set(s => ({
      chatMessages: [...s.chatMessages, userMessage],
      promptText: '',
      isStreaming: true,
      stopReason: null,
    }));

    // Persist user message & update session title
    const allMessages = [...state.chatMessages, userMessage];
    if (state.selectedServerId && sessionId) {
      SessionStorage.saveMessages(allMessages, state.selectedServerId, sessionId);
      if (state.chatMessages.length === 0) {
        const title = text.substring(0, 50);
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
          SessionStorage.saveSession(
            { ...session, title, updatedAt: new Date().toISOString() },
            state.selectedServerId,
          );
          set(s => ({
            sessions: s.sessions.map(sess =>
              sess.id === sessionId ? { ...sess, title } : sess
            ),
          }));
        }
      }
    }

    // ── AI Provider path ──
    if (server.serverType === ServerType.AIProvider && server.aiProviderConfig) {
      const config = server.aiProviderConfig;
      try {
        const apiKey = await getApiKey(`${server.id}_${config.providerType}`);
        if (!apiKey) {
          throw new Error('API key not found. Please configure your API key in server settings.');
        }

        const assistantId = uuidv4();
        set(s => ({
          chatMessages: [...s.chatMessages, {
            id: assistantId,
            role: 'assistant' as const,
            content: '',
            isStreaming: true,
            timestamp: new Date().toISOString(),
          }],
          streamingMessageId: assistantId,
        }));

        const contextMessages = get().chatMessages.filter(m => m.id !== assistantId);

        setAiAbortController(streamChat(
          contextMessages,
          config,
          apiKey,
          // onChunk
          (chunk) => {
            set(s => ({
              chatMessages: updateMessageById(s.chatMessages, assistantId, m => ({
                ...m, content: m.content + chunk,
              })),
            }));
          },
          // onComplete
          (stopReason) => {
            setAiAbortController(null);

            const finalMessage = get().chatMessages.find(m => m.id === assistantId);
            const artifacts = finalMessage ? detectArtifacts(finalMessage.content) : [];

            set(s => ({
              chatMessages: updateMessageById(s.chatMessages, assistantId, m => ({
                ...m, isStreaming: false, ...(artifacts.length > 0 ? { artifacts } : {}),
              })),
              isStreaming: false,
              streamingMessageId: null,
              stopReason,
            }));
            const finalState = get();
            if (finalState.selectedServerId && finalState.selectedSessionId) {
              SessionStorage.saveMessages(
                finalState.chatMessages,
                finalState.selectedServerId,
                finalState.selectedSessionId,
              );
            }
          },
          // onError
          (error) => {
            setAiAbortController(null);
            const errorMessage: ChatMessage = {
              id: uuidv4(),
              role: 'system',
              content: `⚠️ Error: ${error.message}`,
              timestamp: new Date().toISOString(),
            };
            set(s => ({
              chatMessages: [
                ...s.chatMessages.filter(m => m.id !== assistantId),
                errorMessage,
              ],
              isStreaming: false,
              streamingMessageId: null,
            }));
          },
          // onReasoning
          (reasoningChunk) => {
            set(s => ({
              chatMessages: updateMessageById(s.chatMessages, assistantId, m => ({
                ...m, reasoning: (m.reasoning ?? '') + reasoningChunk,
              })),
            }));
          },
          // onToolCall
          (toolName, args) => {
            const segment: import('../../acp/models/types').MessageSegment = {
              type: 'toolCall',
              toolName,
              input: args,
              isComplete: false,
            };
            set(s => ({
              chatMessages: updateMessageById(s.chatMessages, assistantId, m => ({
                ...m, segments: [...(m.segments ?? []), segment],
              })),
            }));
          },
          // onToolResult
          (toolName, result) => {
            set(s => ({
              chatMessages: updateMessageById(s.chatMessages, assistantId, m => {
                const segments = (m.segments ?? []).map(seg =>
                  seg.type === 'toolCall' && seg.toolName === toolName && !seg.isComplete
                    ? { ...seg, result, isComplete: true }
                    : seg
                );
                return { ...m, segments };
              }),
            }));
          },
          // onAgentEvent
          (event) => {
            const label = agentEventLabel(event.type, event.data);
            if (!label) return;
            const segment: import('../../acp/models/types').MessageSegment = {
              type: 'agentEvent',
              eventType: event.type,
              label,
              detail: typeof event.data === 'object' ? JSON.stringify(event.data) : undefined,
            };
            set(s => ({
              chatMessages: updateMessageById(s.chatMessages, assistantId, m => ({
                ...m, segments: [...(m.segments ?? []), segment],
              })),
            }));
          },
        ));
        return;
      } catch (error) {
        const errorMsg = (error as Error).message;
        get().appendLog(`✗ AI prompt failed: ${errorMsg}`);
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'system',
          content: `⚠️ Error: ${errorMsg}`,
          timestamp: new Date().toISOString(),
        };
        set(s => ({
          chatMessages: [...s.chatMessages, errorMessage],
          isStreaming: false,
        }));
        return;
      }
    }

    // ── ACP path ──
    if (!_service) return;

    try {
      get().appendLog(`→ session/prompt: ${text.substring(0, 80)}`);
      const response = await _service.sendPrompt({
        sessionId: sessionId,
        text,
      });
      const result = response.result as Record<string, JSONValue> | undefined;
      const stopReason = result?.stopReason as string | undefined;
      const currentState = get();
      if (currentState.streamingMessageId) {
        const idx = currentState.chatMessages.findIndex(m => m.id === currentState.streamingMessageId);
        if (idx !== -1) {
          const updatedMessages = [...currentState.chatMessages];
          updatedMessages[idx] = { ...updatedMessages[idx], isStreaming: false };
          set({ chatMessages: updatedMessages, isStreaming: false, streamingMessageId: null, stopReason: stopReason ?? 'end_turn' });
        } else {
          set({ isStreaming: false, streamingMessageId: null, stopReason: stopReason ?? 'end_turn' });
        }
      } else {
        set({ isStreaming: false, stopReason: stopReason ?? 'end_turn' });
      }
    } catch (error) {
      const errorMsg = (error as Error).message;
      get().appendLog(`✗ Prompt failed: ${errorMsg}`);
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'system',
        content: `⚠️ Error: ${errorMsg}`,
        timestamp: new Date().toISOString(),
      };
      set(s => ({
        chatMessages: [...s.chatMessages, errorMessage],
        isStreaming: false,
      }));
    }
  },

  cancelPrompt: async () => {
    const state = get();

    if (_aiAbortController) {
      _aiAbortController.abort();
      setAiAbortController(null);
      set({ isStreaming: false });
      return;
    }

    if (!_service || !state.selectedSessionId) return;
    try {
      await _service.cancelSession({ sessionId: state.selectedSessionId });
      set({ isStreaming: false });
      get().appendLog('→ session/cancel');
    } catch {
      // ignore
    }
  },

  setPromptText: (text) => {
    set({ promptText: text });
  },
});

// Maps agent event types to user-visible labels
function agentEventLabel(type: string, data: unknown): string | null {
  switch (type) {
    case 'planning:update':
      return '📋 Planning updated';
    case 'subagent:spawn':
      return `🔀 Sub-agent started`;
    case 'subagent:complete':
      return `✅ Sub-agent completed`;
    case 'step:start': {
      const d = data as { stepIndex?: number } | undefined;
      return `⚡ Step ${(d?.stepIndex ?? 0) + 1}`;
    }
    case 'context:summarize':
      return '📝 Context summarized';
    case 'checkpoint:save':
      return '💾 Checkpoint saved';
    default:
      return null;
  }
}

/**
 * Parses ACP session update notifications into ChatMessage segments.
 * Mirrors the Swift SessionUpdateHandler / SessionUpdateParsing logic.
 */

import { JSONValue } from './models';
import { ChatMessage, MessageSegment } from './models/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parse an ACP session/update notification into actions that update chat state.
 */
export function parseSessionUpdate(
  params: JSONValue | undefined
): SessionUpdateAction[] {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return [];
  const obj = params as Record<string, JSONValue>;

  const actions: SessionUpdateAction[] = [];

  // Handle different update types
  const kind = obj.kind as string | undefined;

  if (kind === 'text' || obj.text !== undefined) {
    const text = (obj.text as string) ?? '';
    actions.push({ type: 'appendText', text });
  }

  if (kind === 'toolCall' || obj.toolCall !== undefined) {
    const tc = (obj.toolCall ?? obj) as Record<string, JSONValue>;
    actions.push({
      type: 'toolCall',
      toolName: (tc.name as string) ?? (tc.toolName as string) ?? 'unknown',
      input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input ?? tc.arguments ?? ''),
    });
  }

  if (kind === 'toolResult' || obj.toolResult !== undefined) {
    const tr = (obj.toolResult ?? obj) as Record<string, JSONValue>;
    actions.push({
      type: 'toolResult',
      result: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result ?? tr.output ?? ''),
    });
  }

  if (kind === 'thought' || obj.thought !== undefined) {
    const thought = (obj.thought as string) ?? '';
    actions.push({ type: 'thought', content: thought });
  }

  if (kind === 'stop' || obj.stopReason !== undefined) {
    const reason = (obj.stopReason as string) ?? (obj.reason as string) ?? 'end_turn';
    actions.push({ type: 'stop', reason });
  }

  // If nothing matched, try to extract from generic message params
  if (actions.length === 0 && obj.message !== undefined) {
    const msg = obj.message as Record<string, JSONValue>;
    if (msg.content) {
      actions.push({ type: 'appendText', text: msg.content as string });
    }
  }

  return actions;
}

export type SessionUpdateAction =
  | { type: 'appendText'; text: string }
  | { type: 'toolCall'; toolName: string; input: string }
  | { type: 'toolResult'; result: string }
  | { type: 'thought'; content: string }
  | { type: 'stop'; reason: string };

/**
 * Apply session update actions to a chat messages array.
 * Returns a new array (immutable update).
 */
export function applySessionUpdate(
  messages: ChatMessage[],
  actions: SessionUpdateAction[],
  streamingMessageId: string | null,
): { messages: ChatMessage[]; streamingMessageId: string | null; stopReason?: string } {
  let result = [...messages];
  let currentStreamId = streamingMessageId;
  let stopReason: string | undefined;

  for (const action of actions) {
    switch (action.type) {
      case 'appendText': {
        if (currentStreamId) {
          const idx = result.findIndex(m => m.id === currentStreamId);
          if (idx !== -1) {
            const existing = result[idx];
            result[idx] = {
              ...existing,
              content: existing.content + action.text,
              segments: appendTextToSegments(existing.segments, action.text),
            };
            break;
          }
        }
        // Create new assistant message
        const newId = uuidv4();
        currentStreamId = newId;
        result.push({
          id: newId,
          role: 'assistant',
          content: action.text,
          segments: [{ type: 'text', content: action.text }],
          isStreaming: true,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'toolCall': {
        // Ensure we have a streaming message
        if (!currentStreamId) {
          const newId = uuidv4();
          currentStreamId = newId;
          result.push({
            id: newId,
            role: 'assistant',
            content: '',
            segments: [],
            isStreaming: true,
            timestamp: new Date().toISOString(),
          });
        }
        const idx = result.findIndex(m => m.id === currentStreamId);
        if (idx !== -1) {
          const existing = result[idx];
          const newSegments = [
            ...(existing.segments ?? []),
            { type: 'toolCall' as const, toolName: action.toolName, input: action.input, isComplete: false },
          ];
          result[idx] = { ...existing, segments: newSegments };
        }
        break;
      }

      case 'toolResult': {
        if (currentStreamId) {
          const idx = result.findIndex(m => m.id === currentStreamId);
          if (idx !== -1) {
            const existing = result[idx];
            const segments = [...(existing.segments ?? [])];
            // Find last incomplete tool call and add result
            for (let i = segments.length - 1; i >= 0; i--) {
              const seg = segments[i];
              if (seg.type === 'toolCall' && !seg.isComplete) {
                segments[i] = { ...seg, result: action.result, isComplete: true };
                break;
              }
            }
            result[idx] = { ...existing, segments };
          }
        }
        break;
      }

      case 'thought': {
        if (!currentStreamId) {
          const newId = uuidv4();
          currentStreamId = newId;
          result.push({
            id: newId,
            role: 'assistant',
            content: '',
            segments: [],
            isStreaming: true,
            timestamp: new Date().toISOString(),
          });
        }
        const idx = result.findIndex(m => m.id === currentStreamId);
        if (idx !== -1) {
          const existing = result[idx];
          result[idx] = {
            ...existing,
            segments: [...(existing.segments ?? []), { type: 'thought', content: action.content }],
          };
        }
        break;
      }

      case 'stop': {
        stopReason = action.reason;
        if (currentStreamId) {
          const idx = result.findIndex(m => m.id === currentStreamId);
          if (idx !== -1) {
            result[idx] = { ...result[idx], isStreaming: false };
          }
        }
        currentStreamId = null;
        break;
      }
    }
  }

  return { messages: result, streamingMessageId: currentStreamId, stopReason };
}

function appendTextToSegments(
  segments: MessageSegment[] | undefined,
  text: string,
): MessageSegment[] {
  const segs = [...(segments ?? [])];
  if (segs.length > 0) {
    const last = segs[segs.length - 1];
    if (last.type === 'text') {
      segs[segs.length - 1] = { type: 'text', content: last.content + text };
      return segs;
    }
  }
  segs.push({ type: 'text', content: text });
  return segs;
}

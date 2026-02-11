/**
 * Core AI service — creates provider models and streams chat completions.
 */

import { streamText, type ModelMessage, type LanguageModel, type JSONValue } from 'ai';
import { createOpenAI as createOpenAIProvider } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// React Native needs expo/fetch for streaming support
let expoFetch: typeof globalThis.fetch | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  expoFetch = require('expo/fetch').fetch;
} catch {
  // fallback to global fetch (web)
}

import { AIProviderType, type AIProviderConfig } from './types';
import { getProviderInfo } from './providers';
import type { ChatMessage } from '../acp/models/types';

// ── model factory ────────────────────────────────────────────────────────────

/**
 * Build an AI SDK `LanguageModel` from the given config + API key.
 */
export function createModel(
  config: AIProviderConfig,
  apiKey: string,
): LanguageModel {
  const { providerType, modelId, baseUrl } = config;
  const fetchOpt = expoFetch ? { fetch: expoFetch } : {};

  switch (providerType) {
    case AIProviderType.OpenAI: {
      const provider = createOpenAIProvider({ apiKey, ...fetchOpt });
      return provider(modelId);
    }

    case AIProviderType.Anthropic: {
      const provider = createAnthropic({ apiKey, ...fetchOpt });
      return provider(modelId);
    }

    case AIProviderType.Google: {
      const provider = createGoogleGenerativeAI({ apiKey, ...fetchOpt });
      return provider(modelId);
    }

    case AIProviderType.xAI: {
      const provider = createXai({ apiKey, ...fetchOpt });
      return provider(modelId);
    }

    case AIProviderType.OpenRouter: {
      const provider = createOpenRouter({ apiKey, ...fetchOpt });
      return provider.chat(modelId);
    }

    // All OpenAI-compatible providers
    case AIProviderType.Kimi:
    case AIProviderType.MiniMax:
    case AIProviderType.GLM:
    case AIProviderType.DeepSeek:
    case AIProviderType.Groq:
    case AIProviderType.Together:
    case AIProviderType.Mistral:
    case AIProviderType.Perplexity:
    case AIProviderType.Custom: {
      const effectiveBaseUrl =
        baseUrl ?? getProviderInfo(providerType).defaultBaseUrl;
      if (!effectiveBaseUrl) {
        throw new Error(
          `Base URL is required for provider "${providerType}".`,
        );
      }
      const provider = createOpenAICompatible({
        baseURL: effectiveBaseUrl,
        apiKey,
        name: providerType,
        ...fetchOpt,
      });
      return provider(modelId);
    }

    default: {
      const _exhaustive: never = providerType;
      throw new Error(`Unhandled provider type: ${_exhaustive}`);
    }
  }
}

// ── message conversion ───────────────────────────────────────────────────────

function toCoreMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system')
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
}

// ── streaming chat ───────────────────────────────────────────────────────────

/**
 * Stream a chat completion. Returns an `AbortController` the caller can use to
 * cancel the request. Captures both text and reasoning stream parts.
 */
export function streamChat(
  messages: ChatMessage[],
  config: AIProviderConfig,
  apiKey: string,
  onChunk: (text: string) => void,
  onComplete: (stopReason: string) => void,
  onError: (error: Error) => void,
  onReasoning?: (text: string) => void,
): AbortController {
  const controller = new AbortController();

  const model = createModel(config, apiKey);
  const coreMessages = toCoreMessages(messages);

  // Build provider-specific options for reasoning
  const providerOptions = buildProviderOptions(config);

  // Fire-and-forget async IIFE — errors are forwarded via onError.
  (async () => {
    try {
      const result = streamText({
        model,
        messages: coreMessages,
        system: config.systemPrompt,
        temperature: config.temperature,
        abortSignal: controller.signal,
        ...(Object.keys(providerOptions).length > 0 ? { providerOptions } : {}),
      });

      for await (const part of result.fullStream) {
        if (controller.signal.aborted) break;
        if (part.type === 'text-delta') {
          onChunk(part.text);
        } else if (part.type === 'reasoning-delta' && onReasoning) {
          onReasoning((part as { type: string; text: string }).text);
        }
      }

      const reason = await result.finishReason;
      onComplete(reason ?? 'unknown');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        onComplete('abort');
        return;
      }
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return controller;
}

// ── provider options builder ─────────────────────────────────────────────────

function buildProviderOptions(config: AIProviderConfig): Record<string, Record<string, JSONValue>> {
  const opts: Record<string, Record<string, JSONValue>> = {};

  if (!config.reasoningEnabled) return opts;

  switch (config.providerType) {
    case AIProviderType.OpenAI:
      opts.openai = {
        reasoningSummary: 'detailed',
        ...(config.reasoningEffort ? { reasoningEffort: config.reasoningEffort } : {}),
      };
      break;

    case AIProviderType.Google:
      opts.google = {
        thinkingConfig: { includeThoughts: true },
      };
      break;

    case AIProviderType.Anthropic:
      opts.anthropic = {
        thinking: { type: 'enabled', budgetTokens: 10000 },
      };
      break;

    case AIProviderType.xAI:
      opts.xai = {
        reasoningEffort: config.reasoningEffort ?? 'high',
      };
      break;

    // OpenAI-compatible providers that support reasoning
    case AIProviderType.DeepSeek:
    case AIProviderType.Groq:
    case AIProviderType.Together:
    case AIProviderType.Mistral:
      if (config.reasoningEffort) {
        opts[config.providerType] = {
          reasoningEffort: config.reasoningEffort,
        };
      }
      break;

    default:
      break;
  }

  return opts;
}

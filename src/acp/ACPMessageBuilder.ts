/**
 * Builds JSON-RPC param objects for ACP requests.
 * Mirrors the Swift ACPMessageBuilder / ACPServiceModels.
 */

import { JSONValue } from './models';

export interface InitializeParams {
  clientInfo?: { name: string; version: string };
  capabilities?: {
    filesystem?: { read?: boolean; write?: boolean };
    terminal?: boolean;
  };
}

export interface SessionNewParams {
  cwd?: string;
  modeId?: string;
}

export interface SessionLoadParams {
  sessionId: string;
  cwd?: string;
}

export interface SessionResumeParams {
  sessionId: string;
  cwd?: string;
}

export interface SessionPromptParams {
  sessionId: string;
  text: string;
  images?: Array<{ data: string; mimeType: string }>;
  commandName?: string;
}

export interface SessionCancelParams {
  sessionId: string;
}

export interface SessionSetModeParams {
  sessionId: string;
  modeId: string;
}

export function buildInitializeParams(opts?: InitializeParams): JSONValue {
  const params: Record<string, JSONValue> = {};

  const clientInfo = opts?.clientInfo ?? { name: 'Agmente RN', version: '1.0.0' };
  params.clientInfo = clientInfo as unknown as JSONValue;

  const capabilities = opts?.capabilities ?? {
    filesystem: { read: true, write: true },
    terminal: true,
  };
  params.capabilities = capabilities as unknown as JSONValue;

  return params as unknown as JSONValue;
}

export function buildSessionNewParams(opts?: SessionNewParams): JSONValue {
  const params: Record<string, JSONValue> = {};
  if (opts?.cwd) params.cwd = opts.cwd;
  if (opts?.modeId) params.modeId = opts.modeId;
  return params as unknown as JSONValue;
}

export function buildSessionLoadParams(opts: SessionLoadParams): JSONValue {
  const params: Record<string, JSONValue> = { sessionId: opts.sessionId };
  if (opts.cwd) params.cwd = opts.cwd;
  return params as unknown as JSONValue;
}

export function buildSessionResumeParams(opts: SessionResumeParams): JSONValue {
  const params: Record<string, JSONValue> = { sessionId: opts.sessionId };
  if (opts.cwd) params.cwd = opts.cwd;
  return params as unknown as JSONValue;
}

export function buildSessionPromptParams(opts: SessionPromptParams): JSONValue {
  const params: Record<string, JSONValue> = {
    sessionId: opts.sessionId,
    text: opts.text,
  };
  if (opts.images && opts.images.length > 0) {
    params.images = opts.images as unknown as JSONValue;
  }
  if (opts.commandName) params.commandName = opts.commandName;
  return params as unknown as JSONValue;
}

export function buildSessionCancelParams(opts: SessionCancelParams): JSONValue {
  return { sessionId: opts.sessionId } as unknown as JSONValue;
}

export function buildSessionSetModeParams(opts: SessionSetModeParams): JSONValue {
  return { sessionId: opts.sessionId, modeId: opts.modeId } as unknown as JSONValue;
}

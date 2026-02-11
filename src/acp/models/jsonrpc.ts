/**
 * JSON-RPC 2.0 types for ACP protocol communication.
 */

export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type RPCID = string | number | null;

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: RPCID;
  method: string;
  params?: JSONValue;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: RPCID;
  result?: JSONValue;
  error?: JSONRPCError;
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: JSONValue;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: JSONValue;
}

export type ACPWireMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

export function isRequest(msg: ACPWireMessage): msg is JSONRPCRequest {
  return 'method' in msg && 'id' in msg;
}

export function isResponse(msg: ACPWireMessage): msg is JSONRPCResponse {
  return 'id' in msg && !('method' in msg);
}

export function isNotification(msg: ACPWireMessage): msg is JSONRPCNotification {
  return 'method' in msg && !('id' in msg);
}

export function makeRequest(id: RPCID, method: string, params?: JSONValue): JSONRPCRequest {
  const req: JSONRPCRequest = { jsonrpc: '2.0', id, method };
  if (params !== undefined) {
    req.params = params;
  }
  return req;
}

export function makeNotification(method: string, params?: JSONValue): JSONRPCNotification {
  const notif: JSONRPCNotification = { jsonrpc: '2.0', method };
  if (params !== undefined) {
    notif.params = params;
  }
  return notif;
}

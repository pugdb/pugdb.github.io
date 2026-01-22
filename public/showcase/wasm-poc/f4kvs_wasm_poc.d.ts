/* tslint:disable */
/* eslint-disable */

export class F4KVS {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Batch delete multiple keys (accepts JSON array of keys, returns count of deleted keys)
   */
  batch_delete(keys_json: string): number;
  /**
   * Get a value by key
   */
  get(key: string): string | undefined;
  /**
   * Create a new F4KVS instance (zero-config)
   */
  constructor();
  /**
   * Put a key-value pair
   * Value can be any JSON value (string, number, boolean, null, object, array)
   * The value is stored as a JSON string internally
   */
  put(key: string, value: string): void;
  /**
   * Scan keys with prefix (returns JSON array of matching keys)
   */
  scan(prefix: string): string;
  /**
   * Get statistics (returns JSON object)
   */
  stats(): string;
  /**
   * Delete a key
   */
  delete(key: string): boolean;
  /**
   * Check if a key exists
   */
  exists(key: string): boolean;
  /**
   * Batch get multiple values by keys (accepts JSON array of keys, returns JSON array of values)
   */
  batch_get(keys_json: string): string;
  /**
   * Batch put multiple key-value pairs (accepts JSON array of [key, value] pairs)
   * Values can be any JSON type (string, number, boolean, null, object, array)
   */
  batch_put(items_json: string): void;
}

export function init(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_f4kvs_free: (a: number, b: number) => void;
  readonly f4kvs_batch_delete: (a: number, b: number, c: number) => [number, number, number];
  readonly f4kvs_batch_get: (a: number, b: number, c: number) => [number, number, number, number];
  readonly f4kvs_batch_put: (a: number, b: number, c: number) => [number, number];
  readonly f4kvs_delete: (a: number, b: number, c: number) => [number, number, number];
  readonly f4kvs_exists: (a: number, b: number, c: number) => [number, number, number];
  readonly f4kvs_get: (a: number, b: number, c: number) => [number, number, number, number];
  readonly f4kvs_new: () => [number, number, number];
  readonly f4kvs_put: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly f4kvs_scan: (a: number, b: number, c: number) => [number, number, number, number];
  readonly f4kvs_stats: (a: number) => [number, number, number, number];
  readonly init: () => void;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

/// <reference types="chrome" />
/// <reference types="chrome" />
/**
 * @param arr Array, support object array
 * @param key Comparison key, support function
 * @param removeOlder Whether to remove the old one will remove the newly added array by default. Setting as True will remove the old duplicate items. In the object array, if there is the same key, the last one will be retained.
 * @returns
 */
export declare const unique: <T>(arr: T[], key?: string | ((a: T, b: T) => boolean) | undefined, removeOlder?: boolean) => T[]
export type ITab = chrome.tabs.Tab & {
  $extra?: {
    lastModified: number
  }
}
export declare const findSameUrlTab: (url?: string, queryInfo?: chrome.tabs.QueryInfo) => Promise<chrome.tabs.Tab | null>
export declare const normalizeUrl: (url?: string) => string
/**
 *
 * @param delay Unit: second
 */
export declare const sleep: (delay: number) => Promise<void>
export declare const escapeHtml: (s: string) => string
export declare const localCache: {
  get: <T = any>(key: string) => Promise<T | null>
  set: <T_1 = object>(key: string, data: T_1, maxAge?: number) => Promise<void>
}
export declare const toDataUrl: (url: string) => Promise<string>
export declare const getURL: (url?: string, base?: string) => URL
export declare const getURLSearchParams: (url: string) => URLSearchParams
export declare const openPage: (url: string) => Promise<chrome.tabs.Tab>

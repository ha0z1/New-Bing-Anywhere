/**
 *
 * @param domSelector string
 * @param timeout number Unit: second
 * @param parent Element | undefined
 * @returns Element | null
 */
export declare const $w: (domSelector: string, timeout?: number, parent?: Document) => Promise<Element | null>

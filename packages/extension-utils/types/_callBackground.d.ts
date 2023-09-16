type IMethods = Record<string, (...args: any[]) => Promise<any>>
export declare const addBackgroundListener: (callMethods: IMethods) => void
export declare const callBackground: <T = any>(method: string, args?: any[]) => Promise<T>
export {}

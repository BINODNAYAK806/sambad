declare module 'dotenv' {
  export function config(options?: { path?: string; encoding?: string; debug?: boolean }): { parsed?: Record<string, string> } | undefined;
  export const parsed: Record<string, string> | undefined;
}

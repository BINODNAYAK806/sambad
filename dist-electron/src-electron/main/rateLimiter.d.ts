declare class RateLimiter {
    private requests;
    private readonly WINDOW_MS;
    private readonly MAX_REQUESTS;
    isRateLimited(key: string): boolean;
}
export declare const rateLimiter: RateLimiter;
export {};
//# sourceMappingURL=rateLimiter.d.ts.map
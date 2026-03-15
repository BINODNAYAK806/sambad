/**
 * Generates a short, readable random code (e.g., "REQ-A1B2")
 */
export declare function generateChallenge(): string;
/**
 * Verifies if the provided response key matches the challenge using HMAC
 */
export declare function verifySupportCode(challenge: string, response: string): boolean;
/**
 * Helper to get the secret (Only for the generator script, theoretically)
 * In the main app, we just use it internally.
 */
export declare function getSecret(): string;
//# sourceMappingURL=supportService.d.ts.map
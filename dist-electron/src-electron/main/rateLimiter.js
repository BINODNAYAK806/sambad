"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = void 0;
const logger_1 = require("./logger");
class RateLimiter {
    requests = new Map();
    WINDOW_MS = 60000; // 1 minute
    MAX_REQUESTS = 100; // 100 requests per minute
    isRateLimited(key) {
        const now = Date.now();
        const record = this.requests.get(key) || { count: 0, lastReset: now };
        if (now - record.lastReset > this.WINDOW_MS) {
            record.count = 1;
            record.lastReset = now;
            this.requests.set(key, record);
            return false;
        }
        if (record.count >= this.MAX_REQUESTS) {
            logger_1.logger.warn(`Rate limit exceeded for key: ${key}`);
            return true;
        }
        record.count++;
        this.requests.set(key, record);
        return false;
    }
}
exports.rateLimiter = new RateLimiter();
//# sourceMappingURL=rateLimiter.js.map
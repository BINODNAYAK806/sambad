/**
 * ServerHealthMonitor
 *
 * Monitors WhatsApp server health and availability.
 * Provides real-time status checking and server filtering.
 */
export class ServerHealthMonitor {
    whatsAppClient;
    healthCache = new Map();
    constructor(whatsAppClient) {
        this.whatsAppClient = whatsAppClient;
    }
    /**
     * Get all currently available (ready) servers
     * @returns Array of server IDs that are ready
     */
    getAvailableServers() {
        const statuses = this.whatsAppClient.getAllStatuses();
        const available = Object.keys(statuses)
            .map(Number)
            .filter(id => statuses[id].isReady)
            .sort((a, b) => a - b);
        console.log(`[ServerHealthMonitor] Available servers: [${available.join(', ')}] of [1, 2, 3, 4, 5]`);
        return available;
    }
    /**
     * Check if a specific server is ready
     * @param serverId - Server ID to check
     * @returns true if server is ready, false otherwise
     */
    isServerReady(serverId) {
        const status = this.whatsAppClient.getStatus(serverId);
        const isReady = status.isReady;
        // Update cache
        this.healthCache.set(serverId, {
            serverId,
            isReady,
            lastChecked: new Date(),
            error: status.error
        });
        return isReady;
    }
    /**
     * Wait for a specific server to become available
     * @param serverId - Server ID to wait for
     * @param timeout - Maximum milliseconds to wait
     * @returns Promise that resolves when server is ready or rejects on timeout
     */
    async waitForServer(serverId, timeout = 30000) {
        const startTime = Date.now();
        console.log(`[ServerHealthMonitor] Waiting for Server ${serverId} (timeout: ${timeout}ms)`);
        while (Date.now() - startTime < timeout) {
            if (this.isServerReady(serverId)) {
                console.log(`[ServerHealthMonitor] Server ${serverId} is now ready`);
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error(`Server ${serverId} did not become ready within ${timeout}ms`);
    }
    /**
     * Wait for ANY server to become available
     * @param timeout - Maximum milliseconds to wait
     * @returns Promise that resolves with the first available server ID
     */
    async waitForAnyServer(timeout = 30000) {
        const startTime = Date.now();
        console.log(`[ServerHealthMonitor] Waiting for any server (timeout: ${timeout}ms)`);
        while (Date.now() - startTime < timeout) {
            const available = this.getAvailableServers();
            if (available.length > 0) {
                console.log(`[ServerHealthMonitor] Server ${available[0]} is available`);
                return available[0];
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error(`No servers became available within ${timeout}ms`);
    }
    /**
     * Get health status for all servers
     * @returns Array of health status objects
     */
    getAllHealthStatuses() {
        const statuses = this.whatsAppClient.getAllStatuses();
        return Object.entries(statuses).map(([id, status]) => ({
            serverId: Number(id),
            isReady: status.isReady,
            lastChecked: new Date(),
            error: status.error
        }));
    }
    /**
     * Get health summary as string
     * @returns Human-readable health summary
     */
    getHealthSummary() {
        const all = this.getAllHealthStatuses();
        const ready = all.filter(s => s.isReady).map(s => s.serverId);
        const notReady = all.filter(s => !s.isReady).map(s => s.serverId);
        return `Ready: [${ready.join(', ')}] | Not Ready: [${notReady.join(', ')}]`;
    }
    /**
     * Clear the health cache
     */
    clearCache() {
        this.healthCache.clear();
    }
}
//# sourceMappingURL=ServerHealthMonitor.js.map
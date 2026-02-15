/**
 * ServerHealthMonitor
 *
 * Monitors WhatsApp server health and availability.
 * Provides real-time status checking and server filtering.
 */
import { WhatsAppClientSingleton } from '../whatsapp/WhatsAppClient.js';
import type { HealthStatus } from '../types/campaign.js';
export declare class ServerHealthMonitor {
    private whatsAppClient;
    private healthCache;
    constructor(whatsAppClient: WhatsAppClientSingleton);
    /**
     * Get all currently available (ready) servers
     * @returns Array of server IDs that are ready
     */
    getAvailableServers(): number[];
    /**
     * Check if a specific server is ready
     * @param serverId - Server ID to check
     * @returns true if server is ready, false otherwise
     */
    isServerReady(serverId: number): boolean;
    /**
     * Wait for a specific server to become available
     * @param serverId - Server ID to wait for
     * @param timeout - Maximum milliseconds to wait
     * @returns Promise that resolves when server is ready or rejects on timeout
     */
    waitForServer(serverId: number, timeout?: number): Promise<void>;
    /**
     * Wait for ANY server to become available
     * @param timeout - Maximum milliseconds to wait
     * @returns Promise that resolves with the first available server ID
     */
    waitForAnyServer(timeout?: number): Promise<number>;
    /**
     * Get health status for all servers
     * @returns Array of health status objects
     */
    getAllHealthStatuses(): HealthStatus[];
    /**
     * Get health summary as string
     * @returns Human-readable health summary
     */
    getHealthSummary(): string;
    /**
     * Clear the health cache
     */
    clearCache(): void;
}
//# sourceMappingURL=ServerHealthMonitor.d.ts.map
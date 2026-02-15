/**
 * ServerRotationManager
 *
 * Manages server selection and rotation state for multi-server campaigns.
 * Implements true round-robin distribution across available servers.
 */
export declare class ServerRotationManager {
    private currentIndex;
    private messagesSentPerServer;
    constructor();
    /**
     * Get the next server to use based on round-robin rotation
     * @param availableServers - Array of server IDs that are currently available
     * @param messageNumber - Current message number (0-indexed) for absolute positioning
     * @returns Server ID to use for this message
     */
    getNextServer(availableServers: number[], messageNumber: number): number;
    /**
     * Get the next server for single-server strategy
     * @param serverId - The designated server ID
     * @returns The same server ID
     */
    getSingleServer(serverId: number): number;
    /**
     * Reset rotation state
     */
    reset(): void;
    /**
     * Get distribution statistics
     * @returns Object mapping server IDs to message counts
     */
    getDistribution(): Record<number, number>;
    /**
     * Get the current rotation index
     */
    getCurrentIndex(): number;
    /**
     * Log distribution statistics
     */
    logDistribution(): void;
}
//# sourceMappingURL=ServerRotationManager.d.ts.map
/**
 * ServerRotationManager
 * 
 * Manages server selection and rotation state for multi-server campaigns.
 * Implements true round-robin distribution across available servers.
 */

export class ServerRotationManager {
    private currentIndex: number = 0;

    private messagesSentPerServer: Map<number, number> = new Map();

    constructor() {
        this.reset();
    }

    /**
     * Get the next server to use based on round-robin rotation
     * @param availableServers - Array of server IDs that are currently available
     * @param messageNumber - Current message number (0-indexed) for absolute positioning
     * @returns Server ID to use for this message
     */
    getNextServer(availableServers: number[], messageNumber: number): number {
        if (availableServers.length === 0) {
            throw new Error('No servers available');
        }

        // Sort servers to ensure consistent ordering
        const sortedServers = [...availableServers].sort((a, b) => a - b);

        // Use message number for true round-robin distribution
        const index = messageNumber % sortedServers.length;
        const serverId = sortedServers[index];

        // Track messages sent per server
        this.messagesSentPerServer.set(
            serverId,
            (this.messagesSentPerServer.get(serverId) || 0) + 1
        );

        return serverId;
    }

    /**
     * Get the next server for single-server strategy
     * @param serverId - The designated server ID
     * @returns The same server ID
     */
    getSingleServer(serverId: number): number {
        this.messagesSentPerServer.set(
            serverId,
            (this.messagesSentPerServer.get(serverId) || 0) + 1
        );
        return serverId;
    }

    /**
     * Reset rotation state
     */
    reset(): void {
        this.currentIndex = 0;
        this.messagesSentPerServer.clear();
    }

    /**
     * Get distribution statistics
     * @returns Object mapping server IDs to message counts
     */
    getDistribution(): Record<number, number> {
        const distribution: Record<number, number> = {};
        this.messagesSentPerServer.forEach((count, serverId) => {
            distribution[serverId] = count;
        });
        return distribution;
    }

    /**
     * Get the current rotation index
     */
    getCurrentIndex(): number {
        return this.currentIndex;
    }

    /**
     * Log distribution statistics
     */
    logDistribution(): void {
        const distribution = this.getDistribution();
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

        console.log('[ServerRotationManager] 📊 Campaign Distribution Summary:');
        console.log(`[ServerRotationManager] Total Messages Sent: ${total}`);

        Object.entries(distribution).forEach(([serverId, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            console.log(`[ServerRotationManager]   Server ${serverId}: ${count} messages (${percentage}%)`);
        });
    }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceFingerprint = getDeviceFingerprint;
const node_machine_id_1 = require("node-machine-id");
const crypto_1 = require("crypto");
/**
 * Generates a deterministic hardware fingerprint for the device.
 * Uses SHA-256 to hash the UUID from node-machine-id to ensure consistent format.
 */
function getDeviceFingerprint() {
    try {
        // Get the machine ID (true = original hardware ID, unstable on some VMs, so we use false for persistent UUID)
        // Actually, requirements say "Hardware-Bound". true is better for that, but can change if H/W changes.
        // Spec says "deterministic hardware identification". 'node-machine-id' default (false) uses DBus/Registry which is resistant to simple hardware swaps but survives OS updates?
        // Let's stick to true (hardware interaction) for stronger "Hardware-Bound" if possible, or false for stability.
        // Common practice for licensing: use both or just the stable UUID. Let's use the default (false) for stability first.
        const rawId = (0, node_machine_id_1.machineIdSync)(true);
        // Hash it to ensure uniform length and format
        return (0, crypto_1.createHash)('sha256').update(rawId).digest('hex');
    }
    catch (error) {
        console.error('[Sentinel] Failed to get device ID:', error);
        // Fallback? If security module fails, we should probably block. 
        // But for now, returning a fallback random ID would defeat the purpose. 
        // We throw to block startup.
        throw new Error('Critical Security Error: Unable to determine device identity.');
    }
}
//# sourceMappingURL=hardware.js.map
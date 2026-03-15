# Wapro v1.3.8 Release Notes

### 🚀 What's New & Fixed (WhatsApp Reliability Edition)
* **Robust WhatsApp Number Validation:**
    * Implemented a smart 3-try retry mechanism with backoff for number validation. No more "Number not on WhatsApp" errors due to temporary connection gaps.
* **Enhanced Phone Number Formatting:**
    * Added advanced parsing for all Indian number formats. The app now intelligently handles regional variations, leading zeros (common typos like `91070...`), and `+91` prefixes automatically.
* **Automatic Session Recovery:**
    * Fixed the persistent "Bad MAC" session error. The application now detects when WhatsApp encryption keys are out of sync and automatically triggers a background re-authentication to keep your servers running smoothly.
* **Terminal Crash Protection:**
    * Resolved "EPIPE" errors that caused the main process to crash unexpectedly during certain terminal outputs.

### 🔧 Technical Details
* Enhanced `formatJid` in `WhatsAppClient.ts` with comprehensive regional regex patterns.
* Added soft-reconnect logic to `getNumberId` to handle session desynchronization on-the-fly.
* Optimized build memory settings to prevent "Out of Memory" errors during production compilation.

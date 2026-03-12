# Wapro v1.3.6 Release Notes

### 🚀 What's New & Fixed
* **Fixed License Window Auto-Open Bug:** 
  * Resolved an annoying issue where the "Attach License" (Sentinel) window would appear on every single startup, even if a valid license key was already saved locally. The application now correctly launches directly to the main dashboard if a license is stored.
* **Network Resilience for License Validation:** 
  * If the app cannot reach the license server due to a temporary network error or timeout, but you have a valid license cached locally, the app will now gracefully allow you to launch instead of blocking access.
* **Core Stability & Performance Improvements:**
  * Fully migrated the Electron main process architectural foundation to increase compatibility with native Windows modules (specifically SQLite database operations).
  * Resolved deep compatibility issues with the WhatsApp connection library, preventing random crashes during session initialization.

### 🔧 Technical Details
* Downgraded/Adjusted module loading from ESM to CommonJS in the Electron backend to fix `ERR_DLOPEN_FAILED` native node module conflicts.
* Fixed the `validateLicense` API handler to correctly distinguish between definitive server rejections (e.g., `device_mismatch`, `expired`) vs. transient network errors (`network_error`).
* Successfully implemented and tested the auto-update pipeline via GitHub Releases.

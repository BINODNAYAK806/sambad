# Changelog

## [1.3.4] - 2026-02-15

### Added
- **Server-Wise Group Extraction**: Added capability to select specific WhatsApp servers (1-5) for group extraction. The UI now includes a dropdown selector, ensuring extracted data corresponds to the desired server instance.

### Fixed
- **Poll Robustness**: Implemented critical fixes for poll vote tracking:
    - **Phone Number Matching**: Added suffix-based matching (last 10 digits) to handle formatting discrepancies (e.g., `+91` prefix vs no prefix, dashes in numbers).
    - **Case-Insensitive IDs**: Fixed message ID lookup to be case-insensitive, resolving issues with some WhatsApp Web/Mobile client ID variations.
    - **Vote Fallback Search**: Added a fallback mechanism that searches for the most recent message to a phone number if the exact Message ID cannot be found. This ensures votes are captured even during minor network de-syncs.
- **Data Integrity**: Improved SQL queries to strip non-numeric characters (dashes, spaces) before comparison to prevent false negatives in vote matching.

// Application Configuration
const CONFIG = {
  // Google Sheets API endpoint (update this after deploying Apps Script)
  SHEETS_API_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  
  // Timer settings
  TIMER_DURATION_MS: 5 * 60 * 1000, // 5 minutes in milliseconds
  
  // Sync settings
  SYNC_RETRY_ATTEMPTS: 3,
  SYNC_RETRY_DELAY_MS: 2000,
  
  // Cache version for service worker
  CACHE_VERSION: 'v1',
  
  // Feature flags
  FEATURES: {
    AUTO_START_TIMER: true,
    BACKGROUND_SYNC: true,
    OFFLINE_MODE: true
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}

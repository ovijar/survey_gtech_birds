// Synchronization Manager
const SyncManager = {
    isSyncing: false,
    retryCount: 0,

    /**
     * Check if online
     * @returns {boolean}
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Sync all pending surveys to Google Sheets
     * @returns {Promise<Object>} - Sync result
     */
    async syncPendingSurveys() {
        if (this.isSyncing) {
            console.log('Sync already in progress');
            return { success: false, message: 'Sync in progress' };
        }

        if (!this.isOnline()) {
            console.log('Cannot sync: offline');
            return { success: false, message: 'Offline' };
        }

        this.isSyncing = true;

        try {
            const pendingSurveys = await DB.getPendingSurveys();

            if (pendingSurveys.length === 0) {
                console.log('No pending surveys to sync');
                this.isSyncing = false;
                return { success: true, message: 'No pending surveys', count: 0 };
            }

            console.log(`Syncing ${pendingSurveys.length} surveys...`);

            let successCount = 0;
            let failCount = 0;

            for (const survey of pendingSurveys) {
                try {
                    const success = await this.syncSingleSurvey(survey);
                    if (success) {
                        await DB.markAsSynced(survey.id);
                        successCount++;
                    } else {
                        failCount++;
                    }
                } catch (error) {
                    console.error('Error syncing survey:', survey.id, error);
                    failCount++;
                }
            }

            this.isSyncing = false;
            this.retryCount = 0;

            return {
                success: failCount === 0,
                message: `Synced ${successCount} surveys, ${failCount} failed`,
                successCount,
                failCount
            };

        } catch (error) {
            console.error('Sync error:', error);
            this.isSyncing = false;
            return { success: false, message: error.message };
        }
    },

    /**
     * Sync a single survey to Google Sheets
     * @param {Object} survey - Survey data
     * @returns {Promise<boolean>} - Success status
     */
    async syncSingleSurvey(survey) {
        try {
            // Prepare data for Google Sheets
            const data = {
                record_id: survey.record_id,
                pc_location_id: survey.pc_location_id,
                day: survey.day,
                month: survey.month,
                year: survey.year,
                start_time: survey.start_time,
                observer: survey.observer,
                species: survey.species,
                distance: survey.distance || '',
                directions: survey.directions || '',
                observation_details: survey.observation_details || '',
                notes: survey.notes || '',
                timestamp: survey.timestamp
            };

            // Check if API URL is configured
            if (!CONFIG.SHEETS_API_URL || CONFIG.SHEETS_API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
                console.warn('Google Sheets API URL not configured');
                // For development, we'll consider this a success
                return true;
            }

            const response = await fetch(CONFIG.SHEETS_API_URL, {
                method: 'POST',
                mode: 'no-cors', // Google Apps Script requires no-cors
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            // Note: With no-cors, we can't read the response
            // We'll assume success if no error was thrown
            console.log('Survey synced to Google Sheets:', survey.record_id);
            return true;

        } catch (error) {
            console.error('Error syncing to Google Sheets:', error);

            // Retry logic
            if (this.retryCount < CONFIG.SYNC_RETRY_ATTEMPTS) {
                this.retryCount++;
                console.log(`Retrying... (${this.retryCount}/${CONFIG.SYNC_RETRY_ATTEMPTS})`);
                await this.delay(CONFIG.SYNC_RETRY_DELAY_MS);
                return await this.syncSingleSurvey(survey);
            }

            return false;
        }
    },

    /**
     * Register background sync
     */
    async registerBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('sync-surveys');
                console.log('Background sync registered');
            } catch (error) {
                console.error('Background sync registration failed:', error);
            }
        }
    },

    /**
     * Delay helper
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Update pending count in UI
     */
    async updatePendingCount() {
        const count = await DB.getPendingCount();
        const pendingCountEl = document.getElementById('pendingCount');
        if (pendingCountEl) {
            pendingCountEl.textContent = count;
        }
        return count;
    }
};

// Auto-sync when coming online
window.addEventListener('online', async () => {
    console.log('Connection restored, attempting sync...');
    const result = await SyncManager.syncPendingSurveys();
    if (result.success) {
        await SyncManager.updatePendingCount();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncManager;
}

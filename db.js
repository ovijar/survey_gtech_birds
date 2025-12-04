// IndexedDB Database Setup using Dexie.js
const db = new Dexie('SurveyDatabase');

// Define database schema
db.version(1).stores({
    surveys: '++id, record_id, pc_location_id, timestamp, synced'
});

// Database helper functions
const DB = {
    /**
     * Save a survey to IndexedDB
     * @param {Object} surveyData - Survey form data
     * @returns {Promise<number>} - ID of saved record
     */
    async saveSurvey(surveyData) {
        try {
            const id = await db.surveys.add({
                ...surveyData,
                timestamp: new Date().toISOString(),
                synced: false
            });
            console.log('Survey saved to IndexedDB:', id);
            return id;
        } catch (error) {
            console.error('Error saving survey to IndexedDB:', error);
            throw error;
        }
    },

    /**
     * Get all pending (unsynced) surveys
     * @returns {Promise<Array>} - Array of unsynced surveys
     */
    async getPendingSurveys() {
        try {
            const pending = await db.surveys
                .where('synced')
                .equals(false)
                .toArray();
            return pending;
        } catch (error) {
            console.error('Error getting pending surveys:', error);
            return [];
        }
    },

    /**
     * Mark a survey as synced
     * @param {number} id - Survey ID
     * @returns {Promise<void>}
     */
    async markAsSynced(id) {
        try {
            await db.surveys.update(id, { synced: true });
            console.log('Survey marked as synced:', id);
        } catch (error) {
            console.error('Error marking survey as synced:', error);
            throw error;
        }
    },

    /**
     * Get count of pending surveys
     * @returns {Promise<number>} - Count of unsynced surveys
     */
    async getPendingCount() {
        try {
            const count = await db.surveys
                .where('synced')
                .equals(false)
                .count();
            return count;
        } catch (error) {
            console.error('Error getting pending count:', error);
            return 0;
        }
    },

    /**
     * Get all surveys (for debugging)
     * @returns {Promise<Array>} - All surveys
     */
    async getAllSurveys() {
        try {
            return await db.surveys.toArray();
        } catch (error) {
            console.error('Error getting all surveys:', error);
            return [];
        }
    },

    /**
     * Delete a survey
     * @param {number} id - Survey ID
     * @returns {Promise<void>}
     */
    async deleteSurvey(id) {
        try {
            await db.surveys.delete(id);
            console.log('Survey deleted:', id);
        } catch (error) {
            console.error('Error deleting survey:', error);
            throw error;
        }
    },

    /**
     * Generate next record ID
     * @returns {Promise<string>} - Generated record ID
     */
    async generateRecordId() {
        try {
            const count = await db.surveys.count();
            const timestamp = Date.now();
            return `REC-${timestamp}-${count + 1}`;
        } catch (error) {
            console.error('Error generating record ID:', error);
            return `REC-${Date.now()}-0`;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DB;
}

/**
 * Google Apps Script for Survey PWA
 * Deploy this as a web app to receive survey data
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this script
 * 4. Click Deploy > New deployment
 * 5. Choose "Web app" as deployment type
 * 6. Set "Execute as" to "Me"
 * 7. Set "Who has access" to "Anyone"
 * 8. Click Deploy
 * 9. Copy the Web app URL
 * 10. Update config.js in your PWA with this URL
 */

// Main function to handle POST requests
function doPost(e) {
    try {
        // Parse the JSON data
        const data = JSON.parse(e.postData.contents);

        // Get the active spreadsheet
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        // Check if headers exist, if not create them
        if (sheet.getLastRow() === 0) {
            const headers = [
                'Record ID',
                'PC Location ID',
                'Day',
                'Month',
                'Year',
                'Start Time',
                'Observer',
                'Species',
                'Distance',
                'Directions',
                'Observation Details',
                'Notes',
                'Timestamp'
            ];
            sheet.appendRow(headers);

            // Format header row
            const headerRange = sheet.getRange(1, 1, 1, headers.length);
            headerRange.setFontWeight('bold');
            headerRange.setBackground('#8b5cf6');
            headerRange.setFontColor('#ffffff');
        }

        // Prepare row data
        const rowData = [
            data.record_id || '',
            data.pc_location_id || '',
            data.day || '',
            data.month || '',
            data.year || '',
            data.start_time || '',
            data.observer || '',
            data.species || '',
            data.distance || '',
            data.directions || '',
            data.observation_details || '',
            data.notes || '',
            data.timestamp || new Date().toISOString()
        ];

        // Append the data to the sheet
        sheet.appendRow(rowData);

        // Return success response
        return ContentService
            .createTextOutput(JSON.stringify({
                success: true,
                message: 'Survey data saved successfully',
                record_id: data.record_id
            }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // Return error response
        return ContentService
            .createTextOutput(JSON.stringify({
                success: false,
                message: 'Error saving survey data',
                error: error.toString()
            }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// Test function (optional - for testing in Apps Script editor)
function testDoPost() {
    const testData = {
        postData: {
            contents: JSON.stringify({
                record_id: 'TEST-001',
                pc_location_id: 'LOC-001',
                day: 3,
                month: 12,
                year: 2025,
                start_time: '14:30',
                observer: 'Test Observer',
                species: 'American Robin, Blue Jay',
                distance: '50',
                directions: 'North',
                observation_details: 'Test observation',
                notes: 'Test notes',
                timestamp: new Date().toISOString()
            })
        }
    };

    const result = doPost(testData);
    Logger.log(result.getContent());
}

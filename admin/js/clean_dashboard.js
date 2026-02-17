const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    let content = fs.readFileSync(path, 'utf8');

    console.log('Original length:', content.length);

    // 1. Remove Accounting Trash (permanentDelete and empty)
    // Start: window.permanentDeleteAccTransaction
    // End: // --- Form Submit (Create) ---
    const accStartMarker = 'window.permanentDeleteAccTransaction = async (id) => {';
    const accEndMarker = '// --- Form Submit (Create) ---';

    const accStart = content.indexOf(accStartMarker);
    const accEnd = content.indexOf(accEndMarker);

    if (accStart !== -1 && accEnd !== -1) {
        console.log('Removing Accounting Trash block...');
        const toRemove = content.substring(accStart, accEnd);
        content = content.replace(toRemove, '');
    } else {
        console.log('Accounting Trash block not found or markers invalid:', { accStart, accEnd });
    }

    // 2. Remove Reservation Trash
    // Start: // --- RESERVATION TRASH ---
    // End: // --- Complete reservation (+ auto accounting) ---
    const resStartMarker = '// --- RESERVATION TRASH ---';
    const resEndMarker = '// --- Complete reservation (+ auto accounting) ---';

    const resStart = content.indexOf(resStartMarker);
    const resEnd = content.indexOf(resEndMarker);

    if (resStart !== -1 && resEnd !== -1) {
        console.log('Removing Reservation Trash block...');
        const toRemove = content.substring(resStart, resEnd);
        content = content.replace(toRemove, '');
    } else {
        console.log('Reservation Trash block not found:', { resStart, resEnd });
    }

    // 3. Remove Luggage Trash Helpers
    // Start: window.restoreLuggage
    // End: // Handle Form Submit
    const lugStartMarker = 'window.restoreLuggage = async (id) => {';
    const lugEndMarker = '// Handle Form Submit';

    const lugStart = content.indexOf(lugStartMarker);
    const lugEnd = content.indexOf(lugEndMarker);

    if (lugStart !== -1 && lugEnd !== -1) {
        console.log('Removing Luggage Trash Helpers block...');
        const toRemove = content.substring(lugStart, lugEnd);
        content = content.replace(toRemove, '');
    } else {
        console.log('Luggage Trash Helpers block not found:', { lugStart, lugEnd });
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('New length:', content.length);
    console.log('Cleanup complete.');

} catch (err) {
    console.error('Error:', err);
}

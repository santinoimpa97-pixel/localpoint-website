const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const buffer = fs.readFileSync(path);
    // Search for "<strong>${t.notes}:</strong>"
    // We want the bytes BEFORE this.
    const target = '<strong>${t.notes}:</strong>';
    const targetBuf = Buffer.from(target, 'utf8');

    const index = buffer.indexOf(targetBuf);

    if (index !== -1) {
        console.log(`Found target at offset ${index}`);
        // Let's look at the 10 bytes before
        const start = Math.max(0, index - 10);
        const snippet = buffer.subarray(start, index);

        console.log('Preceding 10 bytes (Hex):', snippet.toString('hex'));
        console.log('Preceding 10 bytes (String):', snippet.toString('utf8'));
    } else {
        console.log('Target NOT FOUND');
    }

} catch (err) {
    console.error(err);
}

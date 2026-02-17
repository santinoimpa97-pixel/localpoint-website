const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const buffer = fs.readFileSync(path);

    // Helper to find and print
    function findAndPrint(label, patternBuffer) {
        let index = buffer.indexOf(patternBuffer);
        if (index !== -1) {
            console.log(`\n--- Found ${label} at offset ${index} ---`);
            const end = Math.min(buffer.length, index + patternBuffer.length + 10);
            const snippet = buffer.subarray(index, end);
            console.log('Hex:', snippet.toString('hex'));
            console.log('String:', snippet.toString('utf8'));
        } else {
            console.log(`\n--- ${label} NOT FOUND ---`);
        }
    }

    // 1. Email Icon line: 📧  ${res.customer_email}
    // Pattern: 📧 (F0 9F 93 A7) followed by spaces/garbage
    // Let's search for "📧" and print subsequent bytes
    findAndPrint("Email Icon", Buffer.from([0xf0, 0x9f, 0x93, 0xa7]));

    // 2. Notes Icon: “  ${res.notes}
    // Pattern: “ (E2 80 9C) followed by spaces/garbage
    // Note: The previous fix replaced some "“  " with "📝 ", so if this still exists, 
    // it likely has a non-space character.
    findAndPrint("Notes Icon", Buffer.from([0xe2, 0x80, 0x9c]));

} catch (err) {
    console.error(err);
}

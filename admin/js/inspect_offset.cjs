const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const buffer = fs.readFileSync(path);
    const offset = 40722;
    // Show 20 bytes before and 20 bytes after
    const start = Math.max(0, offset - 20);
    const end = Math.min(buffer.length, offset + 20);

    const snippet = buffer.subarray(start, end);
    console.log('Context string:', snippet.toString('utf8'));
    console.log('Context hex:', snippet.toString('hex'));

} catch (err) {
    console.error(err);
}

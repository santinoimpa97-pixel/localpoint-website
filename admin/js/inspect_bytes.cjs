const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const buffer = fs.readFileSync(path);
    const content = buffer.toString('utf8');

    // Search for "text-purple-600" which is close to the timestamp
    const target = 'text-purple-600';
    const index = content.indexOf(target);

    if (index !== -1) {
        console.log(`Found "${target}" at index ${index}`);
        // We want to see what follows: ">•  ${time}"
        // "text-purple-600".length is 15.
        // plus quote and close tag: '">' -> 2 chars.
        // So offset around index + 17

        // Let's print a range relative to the byte offset in the buffer
        const bufIndex = buffer.indexOf(target);
        if (bufIndex !== -1) {
            const start = bufIndex;
            const end = bufIndex + 50;
            const snippet = buffer.subarray(start, end);

            console.log('Snippet Hex:', snippet.toString('hex'));
            console.log('Snippet UTF8:', snippet.toString('utf8'));

            for (let i = 0; i < snippet.length; i++) {
                console.log(`Byte[${i}]: ${snippet[i].toString(16)} ('${String.fromCharCode(snippet[i])}')`);
            }
        }
    } else {
        console.log('Target not found');
    }

} catch (err) {
    console.error(err);
}

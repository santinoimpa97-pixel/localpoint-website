const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';
const outPath = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/garbage_report.txt';

try {
    const content = fs.readFileSync(path, 'utf8'); // Read as string first to find "In Attesa..."

    let report = 'Garbage Analysis Report:\n\n';

    // 1. Specific check for "In Attesa di Conferma"
    const target = "In Attesa di Conferma";
    const index = content.indexOf(target);
    if (index !== -1) {
        report += `Found "${target}" at char index ${index}\n`;
        const buffer = fs.readFileSync(path); // Read as buffer for byte analysis
        // We need to find the byte offset. 
        // JS strings are UTF-16. Buffer is UTF-8 (usually).
        // Let's just search the buffer for the utf-8 bytes of "In Attesa di Conferma"
        const targetBuf = Buffer.from(target, 'utf8');
        const bufIndex = buffer.indexOf(targetBuf);

        if (bufIndex !== -1) {
            report += `Byte offset: ${bufIndex}\n`;
            // Print next 20 bytes
            const nextBytes = buffer.subarray(bufIndex + targetBuf.length, bufIndex + targetBuf.length + 20);
            report += `Next 20 bytes (Hex): ${nextBytes.toString('hex')}\n`;
            report += `Next 20 bytes (String): ${nextBytes.toString('utf8')}\n`;
        }
    } else {
        report += `"${target}" NOT FOUND\n`;
    }

    report += '\n-------------------\n\n';

    // 2. Scan for all Euro patterns (E2 82 AC)
    const buffer = fs.readFileSync(path);
    const euro = Buffer.from('€', 'utf8'); // e2 82 ac
    let offset = 0;

    while (true) {
        const found = buffer.indexOf(euro, offset);
        if (found === -1) break;

        // Check what follows
        const context = buffer.subarray(found, found + 10);
        report += `Euro at offset ${found}: ${context.toString('hex')} | "${context.toString('utf8').replace(/\n/g, '\\n')}"\n`;

        offset = found + 1;
    }

    fs.writeFileSync(outPath, report, 'utf8');
    console.log('Report generated at ' + outPath);

} catch (err) {
    console.error(err);
}

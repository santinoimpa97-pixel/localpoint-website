const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split(/\r?\n/);
    const newLines = [];
    let skipMode = false;
    let braceCount = 0;

    const funcsToRemove = [
        'window.restoreLuggage =',
        'window.permanentDeleteLuggage =',
        'window.emptyLuggageTrash =',
        'async function loadAccTrash()',
        'window.restoreAccTransaction =',
        'window.permanentDeleteAccTransaction =',
        'window.emptyAccTrash =',
        'async function loadResTrash()',
        'window.restoreReservation =',
        'window.permanentDeleteReservation =',
        'window.emptyResTrash ='
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if we start skipping
        if (!skipMode) {
            const trimmed = line.trim();
            let matched = false;
            for (const func of funcsToRemove) {
                if (trimmed.startsWith(func) || line.includes(func)) {
                    matched = true;
                    skipMode = true;
                    // Reset brace count for this new block
                    // Count braces in this line
                    braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                    console.log(`Removing block starting at line ${i + 1}: ${line.trim()}`);
                    break;
                }
            }
            if (!matched) {
                newLines.push(line);
            }
        } else {
            // We are in skip mode
            // Count braces to find end of function
            braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

            // If braceCount goes back to 0 (or less), we found the end
            if (braceCount <= 0) {
                skipMode = false;
                console.log(`Block ended at line ${i + 1}`);
            }
        }
    }

    const newContent = newLines.join('\n');
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Cleanup complete. New line count:', newLines.length);

} catch (err) {
    console.error('Error:', err);
}

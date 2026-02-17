const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const buffer = fs.readFileSync(path);
    const length = buffer.length;
    let newBuffer = Buffer.alloc(length * 2);
    let pos = 0;
    let newPos = 0;
    let fixedCount = 0;

    // Pattern 1: Email + Garbage
    // 📧 (F0 9F 93 A7) + 0xC2 0x90
    const patEmailGarbage = Buffer.from([0xf0, 0x9f, 0x93, 0xa7, 0xc2, 0x90]);
    const repEmail = Buffer.from([0xf0, 0x9f, 0x93, 0xa7]); // Just Email

    // Pattern 2: Quote + Garbage (Used in Reservation List for Notes)
    // “ (E2 80 9C) + 0xC2 0x90
    const patQuoteGarbage = Buffer.from([0xe2, 0x80, 0x9c, 0xc2, 0x90]);
    const repMemo = Buffer.from([0xf0, 0x9f, 0x93, 0x9d]); // 📝 Memo

    // Pattern 3: Quote + Spaces (Used in Email Template for Notes likely)
    // “ (E2 80 9C) + space (20) + space (20)
    // We want to replace this with 📝 (F0 9F 93 9D) + space (20)
    const patQuoteSpaces = Buffer.from([0xe2, 0x80, 0x9c, 0x20, 0x20]);
    const repMemoSpace = Buffer.from([0xf0, 0x9f, 0x93, 0x9d, 0x20]);

    // Pattern 4: Global cleanup of 0xC2 0x90 if it exists elsewhere standalone?
    // Let's stick to targeted for now to be safe, or just remove C2 90 anywhere generally?
    // The user saw it next to email and notes.
    // Let's add a generic stripper for C2 90 just in case.
    const patGarbage = Buffer.from([0xc2, 0x90]);

    while (pos < length) {
        let matched = false;

        // Check Email + Garbage
        if (pos + patEmailGarbage.length <= length && buffer.subarray(pos, pos + patEmailGarbage.length).equals(patEmailGarbage)) {
            repEmail.copy(newBuffer, newPos);
            newPos += repEmail.length;
            pos += patEmailGarbage.length;
            fixedCount++;
            matched = true;
        }
        // Check Quote + Garbage
        else if (pos + patQuoteGarbage.length <= length && buffer.subarray(pos, pos + patQuoteGarbage.length).equals(patQuoteGarbage)) {
            repMemo.copy(newBuffer, newPos);
            newPos += repMemo.length;
            pos += patQuoteGarbage.length;
            fixedCount++;
            matched = true;
        }
        // Check Quote + Spaces (Email Template)
        else if (pos + patQuoteSpaces.length <= length && buffer.subarray(pos, pos + patQuoteSpaces.length).equals(patQuoteSpaces)) {
            repMemoSpace.copy(newBuffer, newPos);
            newPos += repMemoSpace.length;
            pos += patQuoteSpaces.length;
            fixedCount++;
            matched = true;
        }
        // Check Generic Garbage (if not part of above)
        else if (pos + patGarbage.length <= length && buffer.subarray(pos, pos + patGarbage.length).equals(patGarbage)) {
            // Skip it (remove)
            pos += patGarbage.length;
            fixedCount++;
            matched = true;
        }

        if (!matched) {
            newBuffer[newPos++] = buffer[pos++];
        }
    }

    const finalBuffer = newBuffer.subarray(0, newPos);
    fs.writeFileSync(path, finalBuffer);

    console.log(`Fixed ${fixedCount} icon/garbage artifacts.`);

} catch (err) {
    console.error(err);
}

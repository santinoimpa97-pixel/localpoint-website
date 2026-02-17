const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    const buffer = fs.readFileSync(path);
    const length = buffer.length;
    let newBuffer = Buffer.alloc(length);
    let pos = 0;
    let newPos = 0;
    let fixedCount = 0;

    // Pattern: 0xE2 0x80 0x9C 0xC2 0x9D 0x20
    // "“" + Garbage + Space
    const pat1 = Buffer.from([0xe2, 0x80, 0x9c, 0xc2, 0x9d, 0x20]);

    // Replacement: 0xF0 0x9F 0x93 0x9D 0x20 (Memo 📝 + Space)
    const rep1 = Buffer.from([0xf0, 0x9f, 0x93, 0x9d, 0x20]);

    while (pos < length) {
        if (pos + pat1.length <= length && buffer.subarray(pos, pos + pat1.length).equals(pat1)) {
            rep1.copy(newBuffer, newPos);
            newPos += rep1.length;
            pos += pat1.length;
            fixedCount++;
        } else {
            newBuffer[newPos++] = buffer[pos++];
        }
    }

    const finalBuffer = newBuffer.subarray(0, newPos);
    fs.writeFileSync(path, finalBuffer);

    console.log(`Fixed ${fixedCount} persistent quote artifacts.`);

} catch (err) {
    console.error(err);
}

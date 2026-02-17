const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';
const logPath = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/fix_log.txt';

try {
    const buffer = fs.readFileSync(path);
    const length = buffer.length;
    let newBuffer = Buffer.alloc(length * 2); // Allocate enough space
    let pos = 0;
    let newPos = 0;
    let fixedCount = 0;

    // Patterns
    // 1. "€ <8F> ó" -> ⏳
    // e2 82 ac c2 8f c3 b3 -> e2 9d b3
    const pat1 = Buffer.from([0xe2, 0x82, 0xac, 0xc2, 0x8f, 0xc3, 0xb3]);
    const rep1 = Buffer.from([0xe2, 0x9d, 0xb3]); // ⏳

    // 2. "€ <8F> ±" -> 🕒
    // e2 82 ac c2 8f c2 b1 -> f0 9f 95 92
    const pat2 = Buffer.from([0xe2, 0x82, 0xac, 0xc2, 0x8f, 0xc2, 0xb1]);
    const rep2 = Buffer.from([0xf0, 0x9f, 0x95, 0x92]); // 🕒

    // 3. "€ <9D> Œ" -> ❌
    // e2 82 ac c2 9d c5 92 -> e2 9d 8c
    const pat3 = Buffer.from([0xe2, 0x82, 0xac, 0xc2, 0x9d, 0xc5, 0x92]);
    const rep3 = Buffer.from([0xe2, 0x9d, 0x8c]); // ❌

    // 4. "€ bient" -> "À bient"
    // e2 82 ac 20 62 69 65 6e 74 -> c3 80 20 62 69 65 6e 74
    const pat4 = Buffer.from([0xe2, 0x82, 0xac, 0x20, 0x62, 0x69, 0x65, 0x6e, 0x74]);
    const rep4 = Buffer.from([0xc3, 0x80, 0x20, 0x62, 0x69, 0x65, 0x6e, 0x74]); // À bient

    while (pos < length) {
        let matched = false;

        // Check Pattern 1
        if (pos + pat1.length <= length && buffer.subarray(pos, pos + pat1.length).equals(pat1)) {
            rep1.copy(newBuffer, newPos);
            newPos += rep1.length;
            pos += pat1.length;
            fixedCount++;
            matched = true;
        }
        // Check Pattern 2
        else if (pos + pat2.length <= length && buffer.subarray(pos, pos + pat2.length).equals(pat2)) {
            rep2.copy(newBuffer, newPos);
            newPos += rep2.length;
            pos += pat2.length;
            fixedCount++;
            matched = true;
        }
        // Check Pattern 3
        else if (pos + pat3.length <= length && buffer.subarray(pos, pos + pat3.length).equals(pat3)) {
            rep3.copy(newBuffer, newPos);
            newPos += rep3.length;
            pos += pat3.length;
            fixedCount++;
            matched = true;
        }
        // Check Pattern 4
        else if (pos + pat4.length <= length && buffer.subarray(pos, pos + pat4.length).equals(pat4)) {
            rep4.copy(newBuffer, newPos);
            newPos += rep4.length;
            pos += pat4.length;
            fixedCount++;
            matched = true;
        }

        if (!matched) {
            newBuffer[newPos++] = buffer[pos++];
        }
    }

    const finalBuffer = newBuffer.subarray(0, newPos);
    fs.writeFileSync(path, finalBuffer);

    fs.writeFileSync(logPath, `Fixed ${fixedCount} artifacts.\n`);
    console.log(`Fixed ${fixedCount} artifacts.`);

} catch (err) {
    console.error(err);
}

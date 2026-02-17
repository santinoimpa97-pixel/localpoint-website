const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    const originalLength = content.length;

    console.log('Original length:', originalLength);

    // 3. Fix Stubborn Artifacts
    // "In Attesa di Conferma € ó" -> ⏳
    // Matches € followed by space/nbsp and ó
    // Using loose matching for the space
    content = content.replace(/€\s*ó/g, '⏳');

    // "€ ±" -> 🕒 (Used in elapsed time: "€ ± timeStr")
    content = content.replace(/€\s*±/g, '🕒');

    // Just in case "€­" (star) missed some
    content = content.replace(/€­/g, '⭐');

    // Check for "â" artifacts which usually indicate UTF-8 interpretation errors
    // e.g. âœ” -> ✔
    // â€  -> 
    // We can do a pass for known ones if we see them.
    // Based on previous logs, I don't see obvious 'â' ones left in the viewed region, 
    // but the user said "ci sono ancora tante emoji... buggata".

    // Let's print out if we find any "€" followed by something that is NOT a space/number/quote
    // This is just a heuristic check printed to console
    const euroBug = /€[^ \d\.\,]/g;
    let match;
    while ((match = euroBug.exec(content)) !== null) {
        console.log(`Potential remaining Euro artifact at index ${match.index}: ${match[0]}`);
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed file saved.');

} catch (err) {
    console.error('Error processing file:', err);
}

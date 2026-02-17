const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    const originalLength = content.length;

    console.log('Original length:', originalLength);

    // 1. Fix corrupted Vowels (Missing 0xC3 byte pattern)
    // ¨ (0xA8) -> è
    content = content.replace(/¨/g, 'è');

    // © (0xA9) -> é
    content = content.replace(/©/g, 'é');

    //   (0xA0 - NBSP) -> à 
    // Heuristic: "Verr ", "Jusqu' ", "Gi ", "met "
    // We will replace   with à only when preceded by specific letters to avoid breaking layout NBSPs if any?
    // Actually, widespread use suggests global replacement is safer for text correctness vs layout.
    // Except where it's actually an NBSP. But in source code variable names vs strings?
    // In JS strings, à is likely.
    content = content.replace(/ /g, 'à');

    // ¤ (0xA4) -> ä (German: Buchungsbest¤tigung -> Buchungsbestätigung)
    content = content.replace(/¤/g, 'ä');

    // 2. Fix Emojis and Symbols (Garbage sequences)
    // "In Attesa di Conferma € ó" -> ⏳
    content = content.replace(/€ ó/g, '⏳');

    // "Lascia una Recensione €­ " -> ⭐
    content = content.replace(/€­/g, '⭐');

    // "€ ±" -> 🕒 (Used in elapsed time: "€ ± timeStr")
    content = content.replace(/€ ±/g, '🕒');

    // "“Œ" -> ℹ️ (Note: "“Œ Presenta...", "“Œ Nota")
    content = content.replace(/“Œ/g, 'ℹ️');

    // "“  " -> 📝 (Notes) ? 
    // Line 2341: "“  ${res.notes}"
    // Line 2386: "“  <strong>${t.notes}:</strong>"
    // Or maybe it's just a bullet point or quote?
    // Given the context of "notes", 📝 or 💬 fits. Let's use 📝.
    content = content.replace(/“  /g, '📝 ');

    // "¢" -> 🤝 or 🏢 (Supplier: "¢ Organized by")
    content = content.replace(/¢/g, '🤝');

    // Fix German/French specific encoding issues identified
    // " Buchungsbest¤tigung" -> ä handled above.

    // "£" -> ?? (Not seen yet, but common)

    // Specific word fixes just in case specific sequences were missed
    content = content.replace(/perchè/g, 'perché'); // modernization if desired, but è/é fix handles it

    console.log('Replacements applied.');

    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed file saved.');

} catch (err) {
    console.error('Error processing file:', err);
}

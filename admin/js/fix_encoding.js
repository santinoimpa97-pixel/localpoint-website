const fs = require('fs');

const filePath = './dashboard.js';

try {
    // Read as buffer, convert to string
    let buffer = fs.readFileSync(filePath);
    let content = buffer.toString('utf8');

    // Replacements for observed artifacts
    content = content.replace(/€™»ï¸/g, '♻️');
    content = content.replace(/—‘/g, '🗑️');
    content = content.replace(/€š ï¸/g, '⚠️');
    content = content.replace(/€¹/g, '¹');
    content = content.replace(/€º/g, 'º');
    content = content.replace(/pu²/g, 'può');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed encoding artifacts.');
} catch (err) {
    console.error('Error:', err);
}

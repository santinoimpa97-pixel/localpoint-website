const fs = require('fs');
const path = 'C:/Users/projo/.gemini/antigravity/scratch/localpoint/src/admin/js/dashboard.js';

try {
    let content = fs.readFileSync(path, 'utf8');
    let fixed = 0;

    // 1. FIX EMAIL “ QUOTE ISSUE
    // Search for: “  <strong>${t.notes}:</strong>
    // Be flexible with spaces (regex)
    // The previous analysis showed "“" is E2 80 9C.
    // Let's use a regex that matches the specific string context
    const noteRegex = /“\s+<strong>\$\{t\.notes\}:<\/strong>/g;
    if (noteRegex.test(content)) {
        content = content.replace(noteRegex, '📝 <strong>${t.notes}:</strong>');
        console.log('Fixed Email Notes Icon');
        fixed++;
    } else {
        console.log('Email Notes Icon pattern not found (maybe already fixed?)');
    }

    // 2. ADD BOOKING CODE TO EMAIL
    // Step A: Modify insert to return data
    // match: const { error } = await supabase.from('reservations').insert([data])
    const insertRegex = /const\s+\{\s*error\s*\}\s*=\s*await\s+supabase\.from\('reservations'\)\.insert\(\[data\]\)/;
    if (insertRegex.test(content)) {
        content = content.replace(insertRegex,
            "const { data: newRes, error } = await supabase.from('reservations').insert([data]).select()");
        console.log('Modified Insert to return data');
        fixed++;
    } else {
        console.log('Insert pattern not found');
    }

    // Step B: Pass booking code to sendReservationEmail
    // match: sendReservationEmail({
    const sendCallRegex = /sendReservationEmail\(\s*\{/;
    if (sendCallRegex.test(content)) {
        // We want to add only if we have newRes
        // But the call is inside the "else" block of if(error).
        // And we modified the line above to give newRes.
        // So we can assume newRes exists if we are here.
        // Let's add the property at the start of object
        content = content.replace(sendCallRegex,
            "sendReservationEmail({\n                booking_code: (newRes && newRes[0]) ? newRes[0].id.slice(0, 8).toUpperCase() : '???',");
        console.log('Added booking_code to sendReservationEmail');
        fixed++;
    }

    // Step C: Add row to HTML builder
    // match: const statusLabel = ...
    // insert row after that, or inside the detailRows template.
    // Let's look for: let detailRows = `
    const detailRowsRegex = /let detailRows = `\s*<tr/;
    if (detailRowsRegex.test(content)) {
        const newRow = `let detailRows = \`
        <tr style="border-bottom: 1px solid #e8eeec;">
            <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">🔖 Codice</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #1B3A5C; font-size: 15px;">#\${params.booking_code}</td>
        </tr>
        <tr`;
        content = content.replace(detailRowsRegex, newRow);
        console.log('Added Booking Code row to Email HTML');
        fixed++;
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log(`Summary: Applied ${fixed} changes.`);

} catch (err) {
    console.error(err);
}

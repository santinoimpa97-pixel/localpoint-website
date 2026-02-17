$path = "C:\Users\projo\.gemini\antigravity\scratch\localpoint\src\admin\js\dashboard.js"
# Force read as UTF8 even if it looks like ANSI/garbage
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# These replacements assume the file was READ as UTF8 but contains the garbage bytes as literals
# If ReadAllText(UTF8) sees them as valid UTF8 sequences, it might already show them as icons?
# No, if they are double-encoded, they appear as "€™»ï¸" when read as UTF8.
$content = $content.Replace('€™»ï¸ ', '♻️')
$content = $content.Replace('—‘', '🗑️')
$content = $content.Replace('€š ï¸ ', '⚠️')
$content = $content.Replace('€¹', '¹')
$content = $content.Replace('€º', 'º')
$content = $content.Replace('pu²', 'può')

# Write back as UTF8
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Host "Forced UTF8 fix applied"

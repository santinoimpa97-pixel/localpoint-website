$path = "C:\Users\projo\.gemini\antigravity\scratch\localpoint\src\admin\js\dashboard.js"
# Read with default encoding which likely matches how it was corrupted, or try to read raw bytes if needed. 
# But Get-Content -Raw usually auto-detects. Use UTF8 to match the file's current state if it is UTF8 but with bad chars.
# Actually, the file is likely UTF-8 interpreted as something else.
$content = Get-Content $path -Raw

# Replacements based on exact observed corrupted strings
$content = $content.Replace('€™»ï¸ ', '♻️')
$content = $content.Replace('—‘', '🗑️')
$content = $content.Replace('€š ï¸ ', '⚠️')
$content = $content.Replace('pu²', 'può')

# Write back as UTF-8 with BOM (default for Set-Content, but dotNET needs specific)
[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
write-host "Encoding fix applied."

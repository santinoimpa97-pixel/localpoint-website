
import os

file_path = r"C:\Users\projo\.gemini\antigravity\scratch\localpoint\src\admin\js\dashboard.js"

replacements = {
    # Symbols & Icons
    "€‚¬": "€",
    "€€”": "—",
    "€ °": "⏰",
    "€š ï¸": "⚠️",
    "€œ…": "✅",
    "€™»ï¸": "♻️",
    "—‘": "🗑️",
    "“ž": "📞",
    "€±": "⌛",
    "–¨": "🖨️",
    "€œ ï¸": "✏️",
    "‘¤": "👤",
    "§³": "🧳",
    "“…": "📅",
    "“§": "📧",
    "š¤": "🚤",
    "š²": "🚲",
    "š—": "🚗",
    "›µ": "🛵",
    "Œ‹": "🌋",
    "  ï¸": "🏝️",
    "š ": "🚕",
    "›…": "🛅",
    "“¦": "📦",
    "“‹": "✨",
    "€ ³": "⏳",
    "€ Œ": "❌",
    "€œ‰ï¸": "📧",
    "“  ": "📝",
    "€†’": "➡️",
    "Ž¯": "🛠️",
    "‘¥": "👥",
    "’³": "💰",
    "’°": "💵",
    " ¢": "🏢",
    "’š": "ℹ️",
    "€­ ": "⭐",
    "’¸": "💸",
    # Text
    "pu²": "può",
    "perch©": "perché",
    "perch¨": "perché",
    "citt ": "città",
    "verr ": "verrà",
    "sar ": "sarà",
    "Gi  ": "Già",
    "contabilit ": "contabilità",
    "Â¡": "¡",
    "³": "ó",
    "succ¨s": "succès",
    "Best¤tigung": "Bestätigung",
    "Gep¤ck": "Gepäck",
    "zur¼ckgegeben": "zurückgegeben",
    "Rese±a": "Reseña",
    "D©p´t": "Dépôt",
    "bient´t": "bientôt",
    "aplicar¡": "aplicará",
    "Fran§ais": "Français",
    "Espa±ol": "Español",
    "R¼ckgabedatum": "Rückgabedatum",
    "hinterlassen": "hinterlassen",
    "vielen Dank": "vielen Dank",
    "Gep¤ckaufbewahrung": "Gepäckaufbewahrung"
}

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_len = len(content)
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    # Extra safety for any lingering euro signs or symbols
    content = content.replace("€\u00A0", " ") # Non-breaking space
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Successfully processed file. Length changed from {original_len} to {len(content)}")

except Exception as e:
    print(f"Error: {e}")

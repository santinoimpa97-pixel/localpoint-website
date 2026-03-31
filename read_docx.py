import os
import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    try:
        with zipfile.ZipFile(path) as docx:
            xml_content = docx.read('word/document.xml')
        tree = ET.XML(xml_content)
        WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        PARA = WORD_NAMESPACE + 'p'
        TEXT = WORD_NAMESPACE + 't'
        
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text for node in paragraph.iter(TEXT) if node.text]
            if texts:
                paragraphs.append(''.join(texts))
        
        return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

base_dir = r"C:\Users\projo\.gemini\antigravity\scratch\localpoint\cataloghi_da_caricare"
out_path = r"C:\Users\projo\.gemini\antigravity\scratch\localpoint\cataloghi_da_caricare\cataloghi_testo_utf8.txt"

with open(out_path, 'w', encoding='utf-8') as out_f:
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            if f.endswith('.docx') and not f.startswith('~$'):
                path = os.path.join(root, f)
                out_f.write(f"========== FILE: {os.path.relpath(path, base_dir)} ==========\n")
                out_f.write(get_docx_text(path))
                out_f.write("\n\n")

print("Done")

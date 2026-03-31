import os
import shutil
import re

src_dir = r"C:\Users\projo\.gemini\antigravity\scratch\localpoint\cataloghi_da_caricare"
dest_dir = r"C:\Users\projo\.gemini\antigravity\scratch\localpoint\public\catalog"

# Clean and recreate
if os.path.exists(dest_dir):
    shutil.rmtree(dest_dir)
os.makedirs(dest_dir)

def slugify(value):
    value = str(value).lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-')

MIN_SIZE_BYTES = 10000  # Skip files smaller than 10KB (corrupt resource fork files)

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
            full_path = os.path.join(root, f)
            file_size = os.path.getsize(full_path)
            
            # Skip tiny corrupt files (Mac resource forks / junk)
            if file_size < MIN_SIZE_BYTES:
                print(f"  SKIP tiny ({file_size}b): {f}")
                continue
            
            rel_path = os.path.relpath(root, src_dir)
            parts = rel_path.split(os.sep)
            
            if len(parts) >= 1 and parts[0] != '.':
                cat = slugify(parts[0])
                subcat = slugify(parts[1]) if len(parts) > 1 else 'general'
                
                target_folder = os.path.join(dest_dir, cat, subcat)
                if not os.path.exists(target_folder):
                    os.makedirs(target_folder)
                
                ext = os.path.splitext(f)[1].lower()
                count = len([x for x in os.listdir(target_folder) if x.endswith(ext)]) + 1
                new_name = f"{count}{ext}"
                
                dest_file = os.path.join(target_folder, new_name)
                shutil.copy2(full_path, dest_file)
                print(f"  COPY ({file_size}b): {f} -> {os.path.relpath(dest_file, dest_dir)}")

print("\nDone! All real images copied.")

import os
import json

catalog_dir = r"C:\Users\projo\.gemini\antigravity\scratch\localpoint\public\catalog"

result = {}
for cat in os.listdir(catalog_dir):
    cat_path = os.path.join(catalog_dir, cat)
    if os.path.isdir(cat_path):
        result[cat] = {}
        for subcat in os.listdir(cat_path):
            subcat_path = os.path.join(cat_path, subcat)
            if os.path.isdir(subcat_path):
                imgs = sorted([f for f in os.listdir(subcat_path) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))])
                result[cat][subcat] = imgs

print(json.dumps(result, indent=2))

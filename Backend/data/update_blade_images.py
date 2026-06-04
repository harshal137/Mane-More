from pathlib import Path
import json
import re

js_path = Path(r'd:\Web Development\Projects\Beauty-Store\Backend\data\hairproduct_mongoose.js')
img_dir = Path(r'd:\Web Development\Projects\Beauty-Store\Backend\data\Blade_Images')
text = js_path.read_text(encoding='utf-8')
start = text.find('const products = [')
end = text.rfind('];')
if start == -1 or end == -1:
    raise SystemExit('Could not find products array in JS file')
json_text = text[start + len('const products = '): end + 1]
products = json.loads(json_text)

files = [p.name for p in sorted(img_dir.iterdir()) if p.is_file()]

# build base name mapping
base_map = {}
for fname in files:
    name = Path(fname).stem
    # remove trailing _digit suffix
    base = re.sub(r'_[0-9]+$', '', name)
    base_map.setdefault(base.upper(), []).append(fname)

# manual matching rules
match_rules = [
    (r'ASTRA RAZOR BLADE DOUBLE EDGE', 'ASTRA RAZOR BLADE'),
    (r'DERBY BLADE SINGLE EDGE', 'DERBY BLADE SINGLE EDGE'),
    (r'DERBY BLADE DOUBLE EDGE', 'DERBY BLADE DOUBLE EDGE'),
    (r'DERBY RAZOR BLADE DOUBLE EDGE', 'DERBY RAZOR BLADE DOUBLE EDGE'),
    (r'DERBY RAZOR BLADE SINGLE EDGE', 'DERBY RAZOR BLADE SINGLE'),
    (r'DORCO RAZOR BLADE SINGLE EDGE', 'DORCO RAZOR BLADE SINGLE EDGE'),
    (r'PERMASHARP|PERMA SHARP', 'PERMA SHARP RAZOR BLADE'),
]

updated = 0
for product in products:
    categories = product.get('categories', [])
    if 'Blade' not in categories:
        continue
    title = product.get('title', '').upper()
    matched = None
    for pattern, base in match_rules:
        if re.search(pattern, title):
            matched = base
            break
    if not matched:
        # fallback: look for any base substring
        for base in base_map:
            if base in title:
                matched = base
                break
    if matched and matched in base_map:
        image_files = sorted(base_map[matched])
        product['img'] = [f'Blade_Images/{name}' for name in image_files]
        updated += 1
    else:
        print(f'WARNING: no image match for title: {product.get("title")!r}')

print(f'Updated images for {updated} blade products')

# write back JS file with minimal formatting
with js_path.open('w', encoding='utf-8') as f:
    f.write('const products = [\n')
    for obj in products:
        js = json.dumps(obj, ensure_ascii=False, indent=2)
        f.write(js + ',\n')
    f.write('];\n\nmodule.exports = products;\n')

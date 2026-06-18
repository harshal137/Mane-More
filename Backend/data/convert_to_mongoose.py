from pathlib import Path
import re
import ast

src = Path(r'd:\Web Development\Projects\Beauty-Store\Backend\data\hairproduct.js')
out = Path(r'd:\Web Development\Projects\Beauty-Store\Backend\data\hairproduct_mongoose.js')
text = src.read_text(encoding='utf-8')
start = text.find('const products = [')
if start == -1:
    raise SystemExit('products array not found')
arr_text = text[start:]
# extract inside brackets
arr_start = arr_text = text[start:]
open_br = text.find('[', start)
close_br = text.rfind('];')
objects_text = text[open_br+1:close_br]
lines = objects_text.splitlines()

# split into individual object blocks
objs = []
current = []
brace_level = 0
for line in lines:
    if '{' in line and line.strip().startswith('{'):
        brace_level = 1
        current = [line]
        continue
    if brace_level > 0:
        current.append(line)
        if '}' in line and line.strip().endswith('},'):
            objs.append('\n'.join(current))
            brace_level = 0
            current = []
# handle trailing without comma
if current:
    objs.append('\n'.join(current))

parsed = []
for block in objs:
    props = {}
    for line in block.splitlines():
        m = re.match(r"\s*(\w+):\s*(.+?),?\s*$", line)
        if m:
            key = m.group(1)
            val = m.group(2).strip()
            # try to parse values
            try:
                # normalize JS-style arrays/strings to Python
                pyval = ast.literal_eval(val)
            except Exception:
                # keep raw string without trailing commas
                pyval = val.strip().strip('"')
            props[key] = pyval
    parsed.append(props)

# helper generators
from random import randint, choice
names = ['Michael Brown','David Wilson','Emily Clark','Sarah Johnson','Jessica Lee','Daniel Smith','Olivia Martin']

# mapping helpers

def to_array(v):
    if v is None:
        return []
    if isinstance(v, list):
        return v
    s = str(v).strip()
    if s == '':
        return []
    return [s]


def gen_desc(title, categories):
    cat = categories[0] if categories else ''
    return f"Professional {cat.lower()} product: {title}. High quality and reliable performance."


def gen_type(categories):
    t = set()
    for c in categories:
        c_low = c.lower()
        if 'hair' in c_low or 'shampoo' in c_low or 'gel' in c_low:
            t.update(['Professional','Hair Care'])
        if 'wax' in c_low or 'styling' in c_low or 'gel' in c_low:
            t.update(['Styling','Salon Product'])
        if 'extension' in c_low or 'extensions' in c_low:
            t.update(['Hair Extensions', 'Hair Care'])
        if 'blade' in c_low or 'accessories' in c_low:
            t.update(['Accessories'])
    if not t:
        t.add('General')
    return list(t)


def gen_keyBenefits(categories):
    kb = []
    c = ' '.join(categories).lower()
    if 'wax' in c or 'gel' in c or 'styling' in c:
        kb = [
            'Strong long-lasting hold',
            'Non-greasy finish',
            'Easy to wash off',
            'Professional salon quality',
            'Suitable for all hair types'
        ]
    elif 'shampoo' in c or 'tonic' in c:
        kb = [
            'Cleanses thoroughly',
            'Gentle on scalp',
            'Restores natural shine',
            'Sulfate-free formulation',
            'Suitable for daily use'
        ]
    elif 'cologne' in c or 'aftershave' in c or 'cologne' in c:
        kb = [
            'Long-lasting fragrance',
            'Refined notes and balance',
            'Skin-friendly formulation',
            'Alcohol-balanced solution',
            'Modern signature scent'
        ]
    else:
        kb = [
            'High quality',
            'Reliable performance',
            'Value for money',
            'Trusted brand'
        ]
    return kb[:6]


def make_ratings(idx):
    r1 = {
        'star': '5',
        'name': choice(names),
        'comment': 'Excellent quality and performance.',
        'postedBy': f'664bc91234f98ab1234567{(idx%90)+10:02d}'
    }
    r2 = {
        'star': '4',
        'name': choice(names),
        'comment': 'Very satisfied with the product.',
        'postedBy': f'664bc91234f98ab1234567{(idx%90)+90:02d}'
    }
    return [r1, r2]

converted = []
for idx, p in enumerate(parsed):
    title = p.get('title','')
    brand = p.get('brand','')
    # images or img
    img = p.get('images') or p.get('img') or [""]
    # ensure array of strings
    if not isinstance(img, list):
        img = [str(img)]
    video = ''
    categories = to_array(p.get('categories'))
    size = to_array(p.get('size'))
    originalPrice = p.get('originalPrice', 0) or 0
    # discountedPrice: keep if exists, else copy originalPrice
    if 'discountedPrice' in p and p.get('discountedPrice', None) is not None:
        discountedPrice = p.get('discountedPrice')
    else:
        discountedPrice = originalPrice
    # items per box
    items_per_box = p.get('itemsPerBox') or p.get('items_per_box') or p.get('itemsPerBox') if False else p.get('itemsPerBox') or p.get('itemsPerBox')
    items_per_box = items_per_box or p.get('pieces') or 0
    try:
        items_per_box = int(items_per_box)
    except Exception:
        items_per_box = 0
    types = gen_type(categories)
    keyBenefits = gen_keyBenefits(categories)
    desc = gen_desc(title, categories)
    ratings = make_ratings(idx)

    obj = {
        'title': title,
        'desc': desc,
        'img': img if img else [""],
        'video': video,
        'categories': categories,
        'brand': brand,
        'originalPrice': originalPrice,
        'discountedPrice': discountedPrice,
        'items_per_box': items_per_box,
        'type': types,
        'size': size,
        'keyBenefits': keyBenefits,
        'ratings': ratings
    }
    converted.append(obj)

# write JS file
with out.open('w', encoding='utf-8') as f:
    f.write('const products = [\n')
    for o in converted:
        # convert python lists to JS arrays and strings
        import json
        js = json.dumps(o, ensure_ascii=False, indent=2)
        # small transform: keys should be unquoted? but JS accepts quoted keys; keep as is for clean JS
        f.write(js + ',\n')
    f.write('];\n\nmodule.exports = products;\n')

print(f'Wrote {len(converted)} products to {out}')

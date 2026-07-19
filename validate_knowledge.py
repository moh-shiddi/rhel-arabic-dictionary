#!/usr/bin/env python3
from pathlib import Path
from collections import Counter
import json, re, sys

path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("knowledge.json")
errors, warnings = [], []
try:
    data = json.loads(path.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"تعذر قراءة JSON: {exc}")
    raise SystemExit(1)

if data.get("schema_version") != "3.0.0": errors.append("schema_version يجب أن يكون 3.0.0")
entities = data.get("entities")
if not isinstance(entities, list): errors.append("entities يجب أن تكون قائمة"); entities=[]
ids = set()
valid_types = {"task","command","concept","troubleshooting","learning_path"}
valid_difficulty = {"beginner","intermediate","advanced"}
valid_status = {"draft","reviewed","verified"}
valid_risk = {"low","medium","high","critical"}
required = {"id","entity_type","title_ar","summary_ar","category","keywords_ar","difficulty","supported_versions","related_entities","status"}

for i, item in enumerate(entities):
    loc=f"entities[{i}]"
    missing=required-set(item)
    if missing: errors.append(f"{loc}: حقول ناقصة {sorted(missing)}")
    id_=item.get("id","")
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*",id_): errors.append(f"{loc}: id غير صالح")
    if id_ in ids: errors.append(f"{loc}: id مكرر {id_}")
    ids.add(id_)
    t=item.get("entity_type")
    if t not in valid_types: errors.append(f"{loc}: نوع غير صالح")
    if item.get("difficulty") not in valid_difficulty: errors.append(f"{loc}: مستوى غير صالح")
    if item.get("status") not in valid_status: errors.append(f"{loc}: حالة غير صالحة")
    if t in {"task","troubleshooting","command"} and item.get("risk") not in valid_risk: errors.append(f"{loc}: خطورة غير صالحة")
    if t in {"task","troubleshooting"} and not item.get("steps"): errors.append(f"{loc}: لا توجد خطوات")
    if t=="command" and (not item.get("syntax") or not item.get("examples")): errors.append(f"{loc}: صفحة الأمر ناقصة")
    if t=="concept" and not item.get("key_points_ar"): errors.append(f"{loc}: المفهوم بلا نقاط")
    if t=="learning_path" and not item.get("modules"): errors.append(f"{loc}: المسار بلا وحدات")

for item in entities:
    for relation in item.get("related_entities",[]):
        if relation not in ids: warnings.append(f"{item.get('id')} → {relation} غير موجود")
    for module in item.get("modules",[]):
        if module.get("entity_id") not in ids: errors.append(f"{item.get('id')}: وحدة غير موجودة {module.get('entity_id')}")

if warnings:
    print("تحذيرات:")
    for w in warnings: print("-",w)
if errors:
    print(f"فشل التحقق: {len(errors)} خطأ")
    for e in errors: print("-",e)
    raise SystemExit(1)
counts=Counter(x["entity_type"] for x in entities)
print("الملف صالح.")
print("إجمالي الكيانات:",len(entities))
for k,v in counts.items(): print(f"- {k}: {v}")

# RHEL Knowledge Engine

A bilingual, browser-based knowledge and troubleshooting platform for **Red Hat Enterprise Linux**.

The project combines practical tasks, command references, Linux concepts, guided workflows, interactive diagnostics, and local analysis of terminal output.

## Try It Online

- **Arabic interface:** https://rhel-arabic-dictionary.pages.dev/
- **English interface:** https://rhel-arabic-dictionary.pages.dev/en

---

# English

## Overview

**RHEL Knowledge Engine** is an independent educational and operational platform designed for Linux learners, RHEL trainees, system administrators, instructors, and technical support teams.

It is more than a command dictionary. The platform helps users move through the complete troubleshooting cycle:

```text
Search or describe a problem
        ↓
Open a task, command, concept, or diagnostic guide
        ↓
Follow guided execution steps
        ↓
Paste terminal output
        ↓
Detect the error pattern
        ↓
Receive the next check and suggested remediation
        ↓
Verify the result
```

## Main Features

- Arabic and English interfaces
- Practical RHEL administration tasks
- Command references and Linux concepts
- Natural-language search
- Guided execution workflows
- Interactive **Linux Doctor**
- Local terminal-output diagnostics
- Verification, rollback, and safety guidance
- Browser-based session and progress storage
- No backend or AI API required

## Current Content

| Component | Count |
|---|---:|
| Knowledge entities | 215 |
| Practical tasks | 181 |
| Command references | 17 |
| Concepts | 11 |
| Troubleshooting pages | 3 |
| Learning paths | 3 |
| Guided workflows | 184 |
| Search intents | 43 |
| Linux Doctor flows | 9 |
| Diagnostic error rules | 41 |

The content is primarily designed around **RHEL 9**, with selected compatibility metadata for RHEL 8, 9, and 10.

## Privacy

Terminal output is analyzed locally in the browser using JavaScript.

The project does not require:

- a backend server,
- a central database,
- an AI API,
- remote terminal access,
- or an external diagnostic service.

User progress, preferences, and diagnostic sessions may be stored in `localStorage`.

## Technology

- HTML
- CSS
- Vanilla JavaScript
- JSON
- Python maintenance scripts
- Node.js tests

## Run Locally

Because the project loads JSON files with `fetch()`, run it through a local HTTP server:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## Important Files

```text
index.html
en.html
style.css
app.js
intent-engine.js
workflow-engine.js
doctor-engine.js
execution-diagnostics.js
knowledge.json
intents.json
doctor-data.json
diagnostic-patterns.json
```

## Safety and Disclaimer

The platform does not execute commands. It only displays commands, analyzes pasted output, and recommends possible next steps.

Always review commands before running them, verify the target system, test sensitive changes in a lab or maintenance window, and follow your organization's change-management policies.

This is an independent project and is not an official Red Hat product or support channel.

---

# العربية

## نبذة عن المشروع

**محرك معرفة RHEL** منصة ثنائية اللغة تعمل داخل المتصفح، وموجهة للمتعلمين ومتدربي RHEL ومسؤولي الأنظمة والمدربين وفرق الدعم الفني.

يمكنك تجربة المشروع مباشرة على الرابط التالي:
https://rhel-arabic-dictionary.pages.dev

المشروع ليس مجرد قاموس أوامر، بل يساعد المستخدم خلال دورة العمل كاملة:

```text
البحث أو وصف المشكلة
        ↓
فتح مهمة أو أمر أو مفهوم أو دليل تشخيص
        ↓
اتباع خطوات تنفيذ موجهة
        ↓
لصق مخرجات الطرفية
        ↓
اكتشاف نمط الخطأ
        ↓
اقتراح الفحص التالي والمعالجة
        ↓
التحقق من نجاح الحل
```

## أبرز المميزات

- واجهة عربية وواجهة إنجليزية
- مهام عملية لإدارة RHEL
- مراجع أوامر ومفاهيم Linux
- بحث باللغة الطبيعية
- مسارات تنفيذ موجهة
- نظام **Linux Doctor** التفاعلي
- تحليل محلي لمخرجات الطرفية
- خطوات تحقق وتراجع وتنبيهات سلامة
- حفظ الجلسات والتقدم داخل المتصفح
- لا يحتاج إلى خادم خلفي أو API ذكاء اصطناعي

## حجم المحتوى

| المكوّن | العدد |
|---|---:|
| كيانات المعرفة | 215 |
| المهام العملية | 181 |
| مراجع الأوامر | 17 |
| المفاهيم | 11 |
| صفحات حل المشكلات | 3 |
| مسارات التعلم | 3 |
| مسارات التنفيذ | 184 |
| نوايا البحث | 43 |
| مسارات Linux Doctor | 9 |
| قواعد التشخيص | 41 |

تم بناء المحتوى أساساً حول **RHEL 9**، مع معلومات توافق مختارة لإصدارات RHEL 8 و9 و10.

## الخصوصية

يتم تحليل مخرجات الطرفية محلياً باستخدام JavaScript داخل المتصفح، دون إرسالها إلى خدمة خارجية.

يمكن حفظ التفضيلات والتقدم والجلسات داخل `localStorage`.

## التقنية المستخدمة

- HTML
- CSS
- JavaScript خام
- JSON
- سكربتات Python
- اختبارات Node.js

## التشغيل المحلي

```bash
python -m http.server 8000
```

ثم افتح:

```text
http://localhost:8000/
```

## تنبيه

الموقع لا ينفذ الأوامر، بل يعرضها ويحلل النص الملصق ويقترح الخطوات التالية.

راجع كل أمر قبل تنفيذه، وتأكد من الخادم المستهدف، واختبر التغييرات الحساسة في بيئة تدريبية أو نافذة صيانة.

هذا مشروع مستقل، وليس منتجاً رسمياً أو قناة دعم رسمية من Red Hat.

# Bilingual RHEL Knowledge Engine — Native English Edition

This package preserves the complete Arabic interface and adds a native English interface.

- `index.html` — Arabic interface (RTL)
- `en.html` — English interface (LTR)

The English interface was rewritten as natural technical English for English-speaking users. It is not Arabic transliteration.

## English data files

- `knowledge-en.json`
- `intents-en.json`
- `doctor-data-en.json`
- `diagnostic-patterns-en.json`
- `english-runtime.js`

The existing JavaScript engines are shared by both pages. `english-runtime.js` redirects the English page to the English data files and translates shared runtime labels.

## Language switch

Use **EN** from the Arabic interface and **AR** from the English interface.

## Local testing

```bash
python -m http.server 8000
```

Open:

- Arabic: `http://localhost:8000/`
- English: `http://localhost:8000/en.html`

## Privacy

Terminal output is analyzed locally in the browser. The application does not send pasted terminal output to an API and does not execute commands on the user's system.

## Schema compatibility

English JSON files retain legacy field names such as `title_ar` because the existing application expects those keys. The values inside the English files are English.

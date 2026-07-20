# RHEL Knowledge Engine — Arabic and English Interfaces

## Interfaces

- `index.html`: Arabic interface (RTL)
- `en.html`: English interface (LTR)

Both interfaces use the same entity IDs and share favorites, progress, diagnostic sessions, and workflow sessions.

## English data files

- `knowledge-en.json`
- `intents-en.json`
- `doctor-data-en.json`
- `diagnostic-patterns-en.json`

## English runtime files

- `app-en.js`
- `workflow-engine-en.js`
- `doctor-engine-en.js`
- `execution-diagnostics-en.js`
- `intent-engine-en.js`
- `language-en.js`

The Arabic files remain unchanged except for the EN language button. The English interface contains an AR button to return to Arabic.

## Deployment

Upload every file in this ZIP to the repository root, replacing the existing files, then commit the changes.

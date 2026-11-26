# Birthday Planner
A local-first, dependency-free birthday and gift planner PWA.

## Run locally
`python3 -m http.server 8000` then open http://localhost:8000.

## Deploy
Push the files to GitHub and enable Pages from main / root. Open the HTTPS site in Safari and use Share > Add to Home Screen (Open as Web App if offered).

## Data
IndexedDB stores records locally. Export JSON backups from Settings. Restore replaces all records. Localhost and the deployed site have separate storage; export/import to transfer data. No push notifications or cloud sync. Birthdays recur annually; February 29 is observed February 28 in non-leap years. Gifts and parties belong to a selected birthday year. Save details before navigating between years.

## Updating
Increment the CACHE version in sw.js when changing app assets. Close all open app windows and reopen to activate a waiting service worker. Never delete IndexedDB to update the app.

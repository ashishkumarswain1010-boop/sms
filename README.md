# ISAMS – Integrated GIS-Based Solar Asset Management & Monitoring System

Static front-end prototype (HTML5, CSS3, vanilla JS, Bootstrap 5.3, Bootstrap Icons, Chart.js, Leaflet + OpenStreetMap, Inter font). No backend, no build step.

## Run
1. Unzip and open `index.html` in a modern browser (Chrome/Edge/Firefox). Internet is needed for the CDN libraries and map tiles.
2. Optional: serve locally for browser geolocation (needs https or localhost): `python -m http.server 8000` → http://localhost:8000

## Demo scenario
GIS Solar Map → centre **Bhubaneswar** → **10 km** → counts, capacity, energy and markers update. Change to 5/15/25/50 km or **Custom**, search another place, click **Pick centre on map**, or **Save current** zone.

## Data
* Each HTML page stores initial tabular records in rows under the hidden `#app-seed-data` table inside `<body>`. Each row has a `data-collection` name and a JSON `data-record` value. Non-tabular defaults and static configuration remain in `#app-data`; `js/data.js` combines them on startup.
* Every page reads/writes this one store, so edits, surveys and closed tickets appear on the dashboard, map and reports. Changes persist in `localStorage` (key `isams_v2`). On first load, existing `isams_v1` data is migrated and missing seeded assets are restored while existing asset edits are preserved. Resetting demo data rebuilds the state from that page's HTML seed rows and configuration.
* **Reset demo data**: user menu (top right).

## Files
Each HTML file contains its static application shell and page layout and loads the shared and page-specific behavior from `js/`. `js/app.js` provides shared utilities and Users/Notifications/Settings behavior; `dashboard.js`, `map.js`, `assets.js` (inventory + street lights, rooftop, plants, pumps), `monitoring.js`, `alerts.js`, `maintenance.js`, `survey.js`, and `reports.js` provide page functionality.

## Notes
* Live Monitoring and street-light sensor values are **simulated** (DEMO MODE) – real monitoring needs IoT hardware and API integration.
* Maintenance workflow: Fault Detected → Ticket Created → Technician Assigned → Inspection → Repair → Verification → Closed. Closing a ticket restores the asset to *Working*.
* Photos are downsized and stored as data URLs; localStorage (~5 MB) limits how many can be kept.
* Excel export is an Excel-compatible `.xls` HTML table; CSV is UTF-8 with BOM.

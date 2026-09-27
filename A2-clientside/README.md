# Charity Events — Client-side Website (PROG2002 Assessment 2, Part 3)

Static HTML/CSS/JavaScript website that consumes the Charity Events API.
No build step is required.

## Folder contents

```
A2-clientside/
├── index.html          # Home page  (static content + dynamic event list)
├── search.html         # Search page (filter form + results)
├── event.html          # Event detail page (reads ?id= from the URL)
├── css/
│   └── style.css       # all shared styles
├── js/
│   ├── config.js       # API base URL (edit this if the API runs elsewhere)
│   ├── common.js       # shared helpers (apiGet, formatting, event card, nav)
│   ├── index.js        # Home page logic
│   ├── search.js       # Search page logic (+ validation, clear filters)
│   └── event.js        # Detail page logic (+ modal)
└── images/             # placeholder images used by the sample data
```

## How to run

1. Start the API first (see `../A2-api/README.md`) so it listens on
   `http://localhost:3000`.
2. Open `index.html` in your browser **or**, to avoid any CORS/file issues,
   serve the folder with a simple static server:

   ```bash
   npx serve A2-clientside
   # or:  python -m http.server 5500 --directory A2-clientside
   ```

3. Browse to the Home page → click an event → try the Search page filters.

If your API runs on a different port, change `API_BASE` in `js/config.js`.

## Where each requirement is implemented

| Requirement | File / function |
|---|---|
| Static organisation content (mission, contact) | `index.html` (hero + mission + footer) |
| Dynamic upcoming event list via API | `js/index.js` → `loadHomePage()` |
| Navigation menu on every page | header block in all three HTML files |
| Filter form with three criteria | `search.html` + `js/search.js` |
| Clear Filters button | `js/search.js` → `clearFilters()` |
| Form validation + error messages | `js/search.js` → `validateForm()` |
| Pass event id between pages (query string) | `js/event.js` → `URLSearchParams` |
| Goal vs. Progress bar | `js/event.js` → `renderEvent()` |
| Register button (modal) | `event.html` modal + `js/event.js` |

# Charity Events API — PROG2002 Assessment 2 (Part 1 & Part 2)

Node.js + Express + MySQL RESTful API that serves charity event data to the
client-side website.

## Folder contents

```
A2-api/
├── database/
│   └── charityevents_db.sql   # creates the DB, tables and sample data
├── routes/
│   ├── events.js              # /api/events endpoints
│   ├── categories.js          # /api/categories endpoint
│   └── organisations.js       # /api/organisations endpoints
├── event_db.js                # MySQL connection pool (shared by all routes)
├── server.js                  # Express app entry point
├── package.json
└── .env.example               # copy to .env and set your credentials
```

## 1. Create the database

1. Open **MySQL Workbench**.
2. Open `database/charityevents_db.sql` and run the whole script (⚡ Execute).
3. This creates the `charityevents_db` database with:
   - 3 organisations
   - 6 categories
   - 10 sample events (some upcoming, some past, one suspended)

To export your own version later: *Server ▸ Data Export* (the tutorial in the
assessment brief shows the same steps).

## 2. Configure and run the API

```bash
cd A2-api
npm install
cp .env.example .env      # then edit .env with your MySQL password
npm start
# → Charity Events API is running on http://localhost:3000
```

Check it works: open <http://localhost:3000/api/health>

## 3. Endpoints

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/events` | Active + upcoming events (Home page). Optional `?status=all\|upcoming\|ongoing\|past`, `?limit=6`, `?category=2` |
| GET | `/api/events/search` | Filter events. Query: `?date=YYYY-MM-DD&location=text&category=id` |
| GET | `/api/events/:id` | Full details for one event (Detail page) |
| GET | `/api/categories` | All categories + how many active events each has (Search page filter) |
| GET | `/api/organisations` | All organisations + active event counts |
| GET | `/api/organisations/:id` | One organisation's details |

### Example

```
GET /api/events/search?location=Lismore&category=1
```

```json
{
  "count": 1,
  "filters": { "date": null, "location": "Lismore", "category": "1" },
  "events": [
    { "event_id": 1, "title": "Sunrise City Fun Run 2026", "category_name": "Fun Run",
      "city": "Lismore", "start_datetime": "2026-06-14 06:30:00", "event_status": "past" }
  ]
}
```

## 4. Testing with Postman

Create a new **GET** request for each URL above and click *Send*. The search
endpoint is the best one to demonstrate filtering.

## Security notes

- All user input is sent to MySQL as **bound parameters**, preventing SQL injection.
- Only `GET` is implemented in A2; `POST/PUT/DELETE` arrive in Assessment 3.
- Suspended events are excluded from the public endpoints.

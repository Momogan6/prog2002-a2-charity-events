/**
 * routes/events.js
 * ------------------------------------------------------------------
 * All endpoints that operate on the "events" resource.
 *
 * RESTful design notes:
 *   - Every endpoint only READS data (GET), because Assessment 3 will
 *     introduce POST/PUT/DELETE. This keeps the resource semantics for
 *     A2 clean and predictable.
 *   - The collection resource is /api/events. A single item is addressed
 *     by its id: /api/events/:id.
 *   - Filtering of the collection is expressed as query-string parameters
 *     (date, location, category, status) rather than inventing new URLs,
 *     which follows the REST principle that a URL identifies a resource
 *     and query strings identify a *view* of that resource.
 *   - All user-supplied values are passed to MySQL as bound parameters,
 *     which prevents SQL injection.
 * ------------------------------------------------------------------
 */

const express = require('express');
const { pool } = require('../event_db');

const router = express.Router();

// Shared SELECT list so that every endpoint returns the same shape for
// an event and the client-side code only has to understand one format.
const EVENT_SELECT = `
    SELECT
        e.event_id,
        e.title,
        e.summary,
        e.description,
        e.location_name,
        e.address,
        e.city,
        e.start_datetime,
        e.end_datetime,
        e.image_url,
        e.ticket_price,
        e.is_free,
        e.goal_amount,
        e.raised_amount,
        e.status,
        c.category_id,
        c.name  AS category_name,
        c.icon  AS category_icon,
        o.organisation_id,
        o.name        AS organisation_name,
        o.description AS organisation_description,
        o.email       AS organisation_email,
        CASE
            WHEN e.start_datetime > NOW() THEN 'upcoming'
            WHEN e.start_datetime <= NOW()
                 AND (e.end_datetime IS NULL OR e.end_datetime >= NOW()) THEN 'ongoing'
            ELSE 'past'
        END AS event_status
    FROM events e
    JOIN categories    c ON c.category_id = e.category_id
    JOIN organisations o ON o.organisation_id = e.organisation_id
`;

// ==================================================================
// GET /api/events
// Home page: every ACTIVE event that has not finished yet (upcoming or
// currently running), ordered by the soonest start date.
// Query params (all optional):
//   ?status=upcoming|ongoing|past   - override the default "not finished"
//   ?limit=6                        - cap the number of rows returned
//   ?category=<id>                  - convenience filter
// ==================================================================
router.get('/', async (req, res) => {
    try {
        const conditions = ["e.status = 'active'"];
        const params = [];

        const { status, category, limit } = req.query;

        if (status === 'past') {
            conditions.push('COALESCE(e.end_datetime, e.start_datetime) < NOW()');
        } else if (status === 'upcoming') {
            conditions.push('e.start_datetime > NOW()');
        } else if (status === 'ongoing') {
            conditions.push('e.start_datetime <= NOW()');
            conditions.push('(e.end_datetime IS NULL OR e.end_datetime >= NOW())');
        } else if (status === 'all') {
            // no date restriction - return every active event
        } else {
            // Default for the home page: current + upcoming events only.
            conditions.push('COALESCE(e.end_datetime, e.start_datetime) >= NOW()');
        }

        if (category && !Number.isNaN(Number(category))) {
            conditions.push('e.category_id = ?');
            params.push(Number(category));
        }

        let sql = `${EVENT_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY e.start_datetime ASC`;

        // `limit` is validated to a number before being concatenated,
        // so it cannot be used for injection.
        const safeLimit = Number(limit);
        if (Number.isInteger(safeLimit) && safeLimit > 0) {
            sql += ` LIMIT ${safeLimit}`;
        }

        const [rows] = await pool.query(sql, params);
        res.json({ count: rows.length, events: rows });
    } catch (err) {
        console.error('GET /api/events failed:', err);
        res.status(500).json({ error: 'Failed to retrieve events', message: err.message });
    }
});

// ==================================================================
// GET /api/events/search
// Search page: filter ACTIVE events by any combination of
//   ?date=YYYY-MM-DD   events that take place on this calendar date
//   ?location=text     partial match on city OR venue name
//   ?category=<id>     events belonging to this category
// All criteria are optional and are combined with AND, so the user may
// select one, two or all three criteria (as required by the brief).
// NOTE: this route is declared BEFORE "/:id" so that the literal path
// "search" is not captured as an event id.
// ==================================================================
router.get('/search', async (req, res) => {
    try {
        const { date, location, category } = req.query;
        const conditions = ["e.status = 'active'"];
        const params = [];

        // --- Criteria 1: date -------------------------------------
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            conditions.push('DATE(e.start_datetime) = ?');
            params.push(date);
        }

        // --- Criteria 2: location ---------------------------------
        if (location && location.trim() !== '') {
            conditions.push('(e.city LIKE ? OR e.location_name LIKE ?)');
            const like = `%${location.trim()}%`;
            params.push(like, like);
        }

        // --- Criteria 3: category ---------------------------------
        if (category && category !== '' && !Number.isNaN(Number(category))) {
            conditions.push('e.category_id = ?');
            params.push(Number(category));
        }

        const sql = `${EVENT_SELECT}
                     WHERE ${conditions.join(' AND ')}
                     ORDER BY e.start_datetime ASC`;

        const [rows] = await pool.query(sql, params);

        res.json({
            count: rows.length,
            filters: { date: date || null, location: location || null, category: category || null },
            events: rows
        });
    } catch (err) {
        console.error('GET /api/events/search failed:', err);
        res.status(500).json({ error: 'Failed to search events', message: err.message });
    }
});

// ==================================================================
// GET /api/events/:id
// Event detail page: full information for one event.
// A suspended event is treated as "not found" for the public site,
// because suspended events must not be displayed.
// ==================================================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Bad Request', message: 'Event id must be a positive integer.' });
        }

        const [rows] = await pool.query(
            `${EVENT_SELECT} WHERE e.event_id = ? AND e.status = 'active' LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: `No active event found with id ${id}.` });
        }

        res.json({ event: rows[0] });
    } catch (err) {
        console.error('GET /api/events/:id failed:', err);
        res.status(500).json({ error: 'Failed to retrieve event', message: err.message });
    }
});

module.exports = router;

/**
 * routes/categories.js
 * ------------------------------------------------------------------
 * Endpoint that supplies the list of event categories.
 *
 * The Search page needs this to build its category filter, and the Home
 * page can use it to show quick category shortcuts. Returning it from a
 * dedicated resource keeps the client from hard-coding category names.
 * ------------------------------------------------------------------
 */

const express = require('express');
const { pool } = require('../event_db');

const router = express.Router();

// ==================================================================
// GET /api/categories
// Returns every category together with a count of how many ACTIVE,
// not-yet-finished events currently belong to it.
// ==================================================================
router.get('/', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                 c.category_id,
                 c.name,
                 c.description,
                 c.icon,
                 COUNT(e.event_id) AS event_count
             FROM categories c
             LEFT JOIN events e
                    ON e.category_id = c.category_id
                   AND e.status = 'active'
                   AND COALESCE(e.end_datetime, e.start_datetime) >= NOW()
             GROUP BY c.category_id, c.name, c.description, c.icon
             ORDER BY c.name ASC`
        );

        res.json({ count: rows.length, categories: rows });
    } catch (err) {
        console.error('GET /api/categories failed:', err);
        res.status(500).json({ error: 'Failed to retrieve categories', message: err.message });
    }
});

module.exports = router;

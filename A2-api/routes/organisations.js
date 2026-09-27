/**
 * routes/organisations.js
 * ------------------------------------------------------------------
 * Endpoints for the charitable organisations that host events.
 *
 * The Home page displays the organisation's mission and contact details
 * (partly hard-coded, partly served from here) so the website always
 * shows up-to-date contact information.
 * ------------------------------------------------------------------
 */

const express = require('express');
const { pool } = require('../event_db');

const router = express.Router();

// ==================================================================
// GET /api/organisations
// A list of all organisations with the number of active events each one
// is hosting.
// ==================================================================
router.get('/', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                 o.organisation_id,
                 o.name,
                 o.description,
                 o.email,
                 o.phone,
                 o.website,
                 o.logo_url,
                 COUNT(e.event_id) AS active_event_count
             FROM organisations o
             LEFT JOIN events e
                    ON e.organisation_id = o.organisation_id
                   AND e.status = 'active'
             GROUP BY o.organisation_id, o.name, o.description, o.email,
                      o.phone, o.website, o.logo_url
             ORDER BY o.name ASC`
        );

        res.json({ count: rows.length, organisations: rows });
    } catch (err) {
        console.error('GET /api/organisations failed:', err);
        res.status(500).json({ error: 'Failed to retrieve organisations', message: err.message });
    }
});

// ==================================================================
// GET /api/organisations/:id
// Details for one organisation, used on the Home page to render the
// "about us" / contact block dynamically.
// ==================================================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Bad Request', message: 'Organisation id must be a positive integer.' });
        }

        const [rows] = await pool.query(
            `SELECT organisation_id, name, description, email, phone, website, logo_url
             FROM organisations WHERE organisation_id = ? LIMIT 1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: `No organisation found with id ${id}.` });
        }

        res.json({ organisation: rows[0] });
    } catch (err) {
        console.error('GET /api/organisations/:id failed:', err);
        res.status(500).json({ error: 'Failed to retrieve organisation', message: err.message });
    }
});

module.exports = router;

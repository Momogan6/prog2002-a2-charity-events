/**
 * server.js
 * ------------------------------------------------------------------
 * Entry point of the Charity Events RESTful API.
 *
 * Responsibilities:
 *   1. Create the Express application.
 *   2. Enable CORS so the separate client-side website (which runs on a
 *      different origin/port) is allowed to call these endpoints.
 *   3. Parse incoming JSON (used again in A3 for POST requests).
 *   4. Mount the resource routers.
 *   5. Provide a health-check endpoint and central error handling.
 *   6. Start listening and verify the database connection.
 * ------------------------------------------------------------------
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { testConnection } = require('./event_db');
const eventsRouter = require('./routes/events');
const categoriesRouter = require('./routes/categories');
const organisationsRouter = require('./routes/organisations');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());            // parse application/json bodies
app.use(express.urlencoded({ extended: true }));

// Small request logger (helps when demonstrating in the video).
app.use((req, _res, next) => {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
    next();
});

// ---------------------------------------------------------------
// Root + health check
// ---------------------------------------------------------------
app.get('/', (_req, res) => {
    res.json({
        name: 'Charity Events API',
        version: '1.0.0',
        endpoints: [
            'GET /api/events',
            'GET /api/events/search',
            'GET /api/events/:id',
            'GET /api/categories',
            'GET /api/organisations',
            'GET /api/organisations/:id'
        ]
    });
});

app.get('/api/health', async (_req, res) => {
    try {
        await testConnection();
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'unreachable', message: err.message });
    }
});

// ---------------------------------------------------------------
// Resource routers
// ---------------------------------------------------------------
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/organisations', organisationsRouter);

// ---------------------------------------------------------------
// 404 handler for unknown routes
// ---------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `No route for ${req.method} ${req.originalUrl}` });
});

// ---------------------------------------------------------------
// Central error handler (must have 4 arguments)
// ---------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ---------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------
app.listen(PORT, async () => {
    console.log(`Charity Events API is running on http://localhost:${PORT}`);
    try {
        await testConnection();
        console.log('Database connection OK (charityevents_db)');
    } catch (err) {
        console.error('WARNING: could not connect to the database.');
        console.error('Check the settings in your .env file and that MySQL is running.');
        console.error(err.message);
    }
});

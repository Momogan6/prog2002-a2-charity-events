/**
 * event_db.js
 * ------------------------------------------------------------------
 * Central database connection module for the Charity Events API.
 *
 * It uses the `mysql2` library in promise mode so that route handlers
 * can use async/await. A connection POOL is exported rather than a
 * single connection: a pool reuses a small set of connections, which is
 * more efficient and reliable for a web server than opening a new
 * connection for every request.
 *
 * Every other file in this project imports this module instead of
 * creating its own connection, so the database settings live in ONE
 * place and connections are never leaked.
 * ------------------------------------------------------------------
 */

const mysql = require('mysql2/promise');

// ------------------------------------------------------------------
// Connection settings.
// In a real project these values should come from environment
// variables (see .env.example) so that credentials are not committed.
// ------------------------------------------------------------------
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'charityevents_db',
    waitForConnections: true,
    connectionLimit: 10,     // maximum number of pooled connections
    queueLimit: 0,           // 0 = unlimited queued requests
    dateStrings: true        // return DATE/DATETIME as plain strings
};

// Create the shared connection pool.
const pool = mysql.createPool(dbConfig);

/**
 * Small helper that makes a quick "is the database reachable?" check.
 * It is called once when the server starts so that the developer sees a
 * clear message instead of a confusing error on the first request.
 */
async function testConnection() {
    const connection = await pool.getConnection();
    try {
        await connection.ping();
    } finally {
        connection.release();
    }
}

module.exports = { pool, testConnection };

// ------------------------------------------------------------------
// Simpler alternative (single connection) - shown here for reference.
// A pool is preferred, but this is what a minimal version looks like:
//
//   const mysql = require('mysql2');
//   const connection = mysql.createConnection(dbConfig);
//   connection.connect(err => {
//       if (err) throw err;
//       console.log('Connected to charityevents_db');
//   });
//   module.exports = connection;
// ------------------------------------------------------------------

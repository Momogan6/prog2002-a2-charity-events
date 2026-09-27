/**
 * js/common.js
 * -------------------------------------------------------------
 * Shared helpers used by the Home, Search and Event pages.
 *
 * Contains:
 *   - apiGet()            wraps fetch() and turns errors into rejects
 *   - formatDate()        human-readable date/time
 *   - formatMoney()       AUD currency
 *   - escapeHtml()        protects the DOM against injected HTML
 *   - renderEventCard()   builds one event card element (reused on the
 *                         Home and Search pages)
 *   - showAlert()         shows an inline status/error message
 * -------------------------------------------------------------
 */

/**
 * Perform a GET request against the API.
 * @param {string} path  e.g. '/events' or '/events/3'
 * @param {object} params optional query-string values; empty values are skipped
 * @returns {Promise<object>} parsed JSON body
 */
async function apiGet(path, params = {}) {
    const url = new URL(API_BASE + path);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            url.searchParams.set(key, value);
        }
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
        // Try to read the JSON error body the API returns.
        let message = `Request failed with status ${response.status}`;
        try {
            const body = await response.json();
            if (body && body.message) message = body.message;
        } catch (_) { /* body was not JSON - keep the default message */ }
        throw new Error(message);
    }

    return response.json();
}

/** Format an ISO date string like "2026-10-18T18:30:00" nicely. */
function formatDate(value) {
    if (!value) return 'Date to be announced';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const datePart = date.toLocaleDateString('en-AU', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric'
    });
    const timePart = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
}

/** Format a date without the time (used for the goal caption). */
function formatDateOnly(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format a number as Australian dollars. */
function formatMoney(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return '$0.00';
    return number.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

/** Escape text before inserting it into innerHTML. */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Return the CSS class used for a status pill. */
function statusClass(status) {
    if (status === 'ongoing') return 'pill pill-ongoing';
    if (status === 'past') return 'pill pill-past';
    return 'pill pill-upcoming';
}

/**
 * Build the HTML for a single event card.
 * @param {object} event an event object returned by the API
 * @returns {string} HTML string
 */
function renderEventCard(event) {
    const price = event.is_free == 1 || Number(event.ticket_price) === 0
        ? '<span class="price free">Free entry</span>'
        : `<span class="price">${formatMoney(event.ticket_price)}</span>`;

    const detailsUrl = `event.html?id=${encodeURIComponent(event.event_id)}`;

    // Use the real image when present, otherwise show a coloured
    // placeholder. The onerror handler covers broken image links.
    const image = event.image_url
        ? `<img src="${escapeHtml(event.image_url)}" alt="${escapeHtml(event.title)}"
                class="card-img" loading="lazy"
                onerror="this.classList.add('img-missing'); this.removeAttribute('src');">`
        : '<div class="card-img img-missing"></div>';

    return `
        <article class="event-card">
            <a class="card-media" href="${detailsUrl}" aria-label="View details for ${escapeHtml(event.title)}">
                ${image}
                <span class="${statusClass(event.event_status)}">${escapeHtml(event.event_status)}</span>
            </a>
            <div class="card-body">
                <span class="chip">${escapeHtml(event.category_name)}</span>
                <h3 class="card-title">
                    <a href="${detailsUrl}">${escapeHtml(event.title)}</a>
                </h3>
                <p class="card-summary">${escapeHtml(event.summary || '')}</p>
                <ul class="card-meta">
                    <li><span class="ico">📍</span>${escapeHtml(event.location_name || '')}, ${escapeHtml(event.city || '')}</li>
                    <li><span class="ico">🗓️</span>${escapeHtml(formatDate(event.start_datetime))}</li>
                </ul>
                <div class="card-foot">
                    ${price}
                    <a class="btn btn-outline" href="${detailsUrl}">View details</a>
                </div>
            </div>
        </article>`;
}

/**
 * Show an inline message in a container element.
 * @param {HTMLElement} el      container to write into
 * @param {string} message      text to display
 * @param {'info'|'error'|'success'} type
 */
function showAlert(el, message, type = 'info') {
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

/**
 * Highlight the navigation link that matches the current page, so the
 * user always knows where they are (basic DOM manipulation).
 */
function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach((link) => {
        const target = link.getAttribute('href');
        if (target === current) {
            link.classList.add('active');
        } else if (target && target !== '#' && !target.startsWith('#')) {
            link.classList.remove('active');
        }
    });
}

/** Wire up the mobile hamburger menu. */
function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        const isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });
}

// Run the navigation helpers once the DOM is ready on every page.
document.addEventListener('DOMContentLoaded', () => {
    initActiveNav();
    initNavToggle();
});

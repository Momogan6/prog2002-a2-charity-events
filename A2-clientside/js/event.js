/**
 * js/event.js  -  Event detail page logic
 * -------------------------------------------------------------
 * Demonstrates:
 *   - Reading the event id from the URL query string
 *     (?id=3) using URLSearchParams.
 *   - Calling GET /api/events/:id to fetch that one event.
 *   - Rendering every field of the response into the page with DOM
 *     manipulation, including a computed "goal vs progress" bar.
 *   - A Register button that opens a modal dialog.
 * -------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    initEventPage();
});

function initEventPage() {
    // 1. Read the event id from the URL (query string method).
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    const status = document.getElementById('status');

    if (!eventId) {
        showAlert(status,
            'No event was selected. Please choose an event from the home or search page.', 'error');
        return;
    }

    loadEvent(eventId);

    // 3. Wire up the modal dialog.
    const modal = document.getElementById('registerModal');
    document.getElementById('registerBtn').addEventListener('click', () => {
        modal.classList.add('open');
    });
    document.getElementById('modalClose').addEventListener('click', () => {
        modal.classList.remove('open');
    });
    // Close when the user clicks the dark backdrop or presses Escape.
    modal.addEventListener('click', (event) => {
        if (event.target === modal) modal.classList.remove('open');
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') modal.classList.remove('open');
    });
}

async function loadEvent(eventId) {
    const status = document.getElementById('status');

    try {
        // 2. Ask the API for this single event.
        const data = await apiGet(`/events/${encodeURIComponent(eventId)}`);
        const event = data.event;

        if (!event) throw new Error('Event data was empty.');

        renderEvent(event);

        status.innerHTML = '';                       // clear messages
        document.getElementById('eventContent').style.display = 'block';
        document.title = `${event.title} | Bright Futures`;

    } catch (error) {
        showAlert(status,
            `We could not load this event. ${error.message}`, 'error');
    }
}

/** Write every field of the event object into the page. */
function renderEvent(event) {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value === null || value === undefined || value === '' ? '—' : value;
    };

    // ---- Headings / hero -------------------------------------
    setText('eventTitle', event.title);
    setText('eventCategory', event.category_name);
    setText('eventLocation', `${event.location_name || ''}, ${event.city || ''}`.replace(/^, |, $/g, ''));
    setText('eventDate', formatDate(event.start_datetime));
    setText('eventOrg', event.organisation_name);

    document.getElementById('eventStatus').innerHTML =
        `<span class="${statusClass(event.event_status)}" style="margin-left:8px;">${escapeHtml(event.event_status)}</span>`;

    const image = document.getElementById('eventImage');
    if (event.image_url) {
        image.src = event.image_url;
        image.alt = event.title;
    } else {
        image.classList.add('img-missing');
        image.alt = '';
    }

    // ---- Description block -----------------------------------
    setText('eventSummary', event.summary);
    setText('eventDescription', event.description);
    setText('eventPurpose',
        `All funds raised through ${event.title} support the work of ${event.organisation_name}. `
        + (event.organisation_description || '').trim());
    const orgLine = event.organisation_email
        ? `${event.organisation_name} — contact ${event.organisation_email}`
        : event.organisation_name;
    setText('eventOrgDetail', orgLine);

    // ---- Facts ------------------------------------------------
    setText('factStart', formatDate(event.start_datetime));
    setText('factEnd', formatDate(event.end_datetime));
    setText('factVenue', event.location_name);
    setText('factAddress', `${event.address || ''}, ${event.city || ''}`.replace(/^, |, $/g, ''));

    // ---- Ticket information -----------------------------------
    const priceEl = document.getElementById('eventPrice');
    const isFree = event.is_free == 1 || Number(event.ticket_price) === 0;
    priceEl.textContent = isFree ? 'Free entry' : formatMoney(event.ticket_price);
    priceEl.classList.toggle('free', isFree);

    document.getElementById('ticketNote').textContent = isFree
        ? 'Entry is free. Donations at the door are welcome and appreciated.'
        : 'Your ticket price is a donation that goes directly to this cause.';

    // ---- Goal vs progress -------------------------------------
    const raised = Number(event.raised_amount || 0);
    const goal = Number(event.goal_amount || 0);
    const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

    document.getElementById('progressBar').style.width = `${percent}%`;
    document.getElementById('raisedText').textContent = formatMoney(raised);
    document.getElementById('goalText').textContent = `Goal: ${formatMoney(goal)}`;
    document.getElementById('progressNote').textContent = goal > 0
        ? `${percent}% of the ${formatMoney(goal)} goal has been raised so far.`
        : 'No fundraising goal has been set for this event.';
}

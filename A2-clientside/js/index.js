/**
 * js/index.js  -  Home page logic
 * -------------------------------------------------------------
 * Data flow demonstrated on this page:
 *   1. The page loads with only the static organisation content.
 *   2. On DOMContentLoaded we call the API (GET /api/events and
 *      GET /api/categories) using fetch().
 *   3. When the JSON response arrives we build DOM nodes for each event
 *      and insert them into #eventGrid.
 *   4. Any network/API error is shown to the user with showAlert().
 * -------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    loadHomePage();
});

async function loadHomePage() {
    const grid = document.getElementById('eventGrid');
    const status = document.getElementById('status');

    showAlert(status, 'Loading upcoming events…', 'info');

    try {
        // Fire both requests in parallel - they are independent.
        const [eventsResponse, categoriesResponse] = await Promise.all([
            apiGet('/events'),            // active + not-finished events
            apiGet('/categories')
        ]);

        const events = eventsResponse.events || [];
        const categories = categoriesResponse.categories || [];

        // ---- Update the hero statistics --------------------------
        document.getElementById('statEvents').textContent = events.length;
        document.getElementById('statCategories').textContent = categories.length;

        const totalRaised = events.reduce((sum, e) => sum + Number(e.raised_amount || 0), 0);
        document.getElementById('statRaised').textContent = formatMoney(totalRaised);

        // ---- Render the event cards ------------------------------
        if (events.length === 0) {
            showAlert(status, 'There are no upcoming events at the moment. Please check back soon.', 'info');
            grid.innerHTML = '';
            return;
        }

        status.innerHTML = '';   // clear the loading message
        grid.innerHTML = events.map(renderEventCard).join('');

    } catch (error) {
        // The API is unreachable or returned an error.
        showAlert(
            status,
            `Sorry, we could not load the events right now. ${error.message}`,
            'error'
        );
        grid.innerHTML = '';
    }
}

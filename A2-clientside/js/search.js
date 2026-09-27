/**
 * js/search.js  -  Search page logic
 * -------------------------------------------------------------
 * Demonstrates:
 *   - Populating a <select> dynamically from the API (categories).
 *   - Reading form values and validating them before sending a request.
 *   - Calling the search endpoint GET /api/events/search with query
 *     parameters built from the selected criteria.
 *   - Rendering the results with DOM methods.
 *   - A "Clear filters" button that resets the form (DOM manipulation).
 *   - Showing error messages to the user with DOM manipulation.
 * -------------------------------------------------------------
 */

let categoriesLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    initSearchPage();
});

async function initSearchPage() {
    const form = document.getElementById('searchForm');
    const clearBtn = document.getElementById('clearBtn');

    // Pre-fill the form from the URL (so a search can be shared/bookmarked).
    restoreFromUrl();

    // Load categories to build the dropdown, then run the initial search.
    await loadCategories();
    runSearch();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (validateForm()) {
            runSearch();
        }
    });

    clearBtn.addEventListener('click', clearFilters);

    // Re-validate a field as soon as the user changes it.
    document.getElementById('filterDate').addEventListener('input', () => clearFieldError('filterDate', 'errorDate'));
    document.getElementById('filterLocation').addEventListener('input', () => clearFieldError('filterLocation', 'errorLocation'));
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
async function loadCategories() {
    const select = document.getElementById('filterCategory');
    try {
        const data = await apiGet('/categories');
        (data.categories || []).forEach((category) => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = `${category.name}${category.event_count ? ` (${category.event_count})` : ''}`;
            select.appendChild(option);
        });
        categoriesLoaded = true;
    } catch (error) {
        // Non-fatal: the user can still search by date/location.
        showAlert(document.getElementById('status'),
            `Categories could not be loaded: ${error.message}`, 'error');
    } finally {
        // Now that the options exist, apply any category that was
        // requested through the URL, then tell listeners it is ready.
        const pending = select.dataset.pending;
        if (pending) {
            select.value = pending;
            delete select.dataset.pending;
        }
        document.dispatchEvent(new Event('categoriesReady'));
    }
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */
function validateForm() {
    let isValid = true;
    let firstInvalid = null;

    const dateEl = document.getElementById('filterDate');
    const locationEl = document.getElementById('filterLocation');

    clearFieldError('filterDate', 'errorDate');
    clearFieldError('filterLocation', 'errorLocation');

    // --- Date: must be a real date and not in the past ---
    if (dateEl.value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const chosen = new Date(dateEl.value + 'T00:00:00');

        if (Number.isNaN(chosen.getTime())) {
            setFieldError('filterDate', 'errorDate', 'Please enter a valid date.');
            isValid = false;
            firstInvalid = firstInvalid || dateEl;
        } else if (chosen < today) {
            setFieldError('filterDate', 'errorDate', 'Please choose today or a future date.');
            isValid = false;
            firstInvalid = firstInvalid || dateEl;
        }
    }

    // --- Location: if entered, at least 2 characters ---
    if (locationEl.value.trim() !== '' && locationEl.value.trim().length < 2) {
        setFieldError('filterLocation', 'errorLocation', 'Enter at least 2 characters.');
        isValid = false;
        firstInvalid = firstInvalid || locationEl;
    }

    if (firstInvalid) firstInvalid.focus();
    return isValid;
}

function setFieldError(inputId, errorId, message) {
    document.getElementById(inputId).classList.add('invalid');
    document.getElementById(errorId).textContent = message;
}

function clearFieldError(inputId, errorId) {
    document.getElementById(inputId).classList.remove('invalid');
    document.getElementById(errorId).textContent = '';
}

/* ------------------------------------------------------------------ */
/* Search + render                                                     */
/* ------------------------------------------------------------------ */
async function runSearch() {
    const results = document.getElementById('results');
    const count = document.getElementById('resultCount');
    const status = document.getElementById('status');

    const params = {
        date: document.getElementById('filterDate').value,
        location: document.getElementById('filterLocation').value.trim(),
        category: document.getElementById('filterCategory').value
    };

    // Keep the URL in sync with the search so it can be shared.
    updateUrl(params);

    status.innerHTML = '';
    results.innerHTML = '';
    count.textContent = 'Searching…';

    try {
        const data = await apiGet('/events/search', params);
        const events = data.events || [];

        if (events.length === 0) {
            count.textContent = 'No matching events';
            showAlert(status,
                'No events matched your search. Try changing the date, location or category.', 'info');
            return;
        }

        count.textContent = `${events.length} event${events.length === 1 ? '' : 's'} found`;
        results.innerHTML = events.map(renderEventCard).join('');

    } catch (error) {
        count.textContent = 'Search failed';
        showAlert(status, `Something went wrong while searching: ${error.message}`, 'error');
    }
}

/* ------------------------------------------------------------------ */
/* Clear filters (DOM manipulation)                                    */
/* ------------------------------------------------------------------ */
function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('filterCategory').value = '';

    ['filterDate', 'filterLocation'].forEach((id) => {
        document.getElementById(id).classList.remove('invalid');
    });
    document.getElementById('errorDate').textContent = '';
    document.getElementById('errorLocation').textContent = '';

    // Reset the URL and show every active event again.
    history.replaceState(null, '', window.location.pathname);
    runSearch();
}

/* ------------------------------------------------------------------ */
/* URL <-> form synchronisation                                        */
/* ------------------------------------------------------------------ */
function updateUrl(params) {
    const url = new URL(window.location.href);
    ['date', 'location', 'category'].forEach((key) => {
        if (params[key]) url.searchParams.set(key, params[key]);
        else url.searchParams.delete(key);
    });
    history.replaceState(null, '', url.toString());
}

function restoreFromUrl() {
    const url = new URL(window.location.href);
    const date = url.searchParams.get('date');
    const location = url.searchParams.get('location');
    const category = url.searchParams.get('category');

    if (date) document.getElementById('filterDate').value = date;
    if (location) document.getElementById('filterLocation').value = location;
    if (category) {
        // The category <option> may not exist yet (loaded from the API).
        // Set a data attribute and apply it after loadCategories().
        document.getElementById('filterCategory').dataset.pending = category;
        document.addEventListener('categoriesReady', () => {
            document.getElementById('filterCategory').value = category;
        }, { once: true });
    }
}

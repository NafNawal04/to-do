// Targeted verification of the new apiRequest() helper (extracted
// verbatim from static/app.js) against a fake fetch, covering all 3
// branches the 4 refactored call sites depend on: success, 401, and a
// non-401 error - without needing a full DOM (jsdom isn't installed,
// and app.js's other 62 functions aren't relevant to this check).
//
// Run with: node maintenance/preventive/05_refactoring/verify_apiRequest.js

let loggedOut = false;
function getAuthHeaders() { return { 'Authorization': 'Bearer test-token' }; }
function handleLogout() { loggedOut = true; }

// --- verbatim copy of the new helper from static/app.js ---
async function apiRequest(url, { errorMessage = 'Request failed', headers, ...options } = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...getAuthHeaders() }
    });

    if (response.status === 401) {
        handleLogout();
        return null;
    }

    if (!response.ok) throw new Error(errorMessage);
    return response;
}
// --- end verbatim copy ---

let assertions = 0;
function assert(cond, msg) {
    assertions++;
    if (!cond) throw new Error('FAIL: ' + msg);
    console.log('  OK: ' + msg);
}

async function main() {
    // 1. Success path: auth header merged in, response returned as-is.
    global.fetch = async (url, opts) => {
        assert(opts.headers.Authorization === 'Bearer test-token', 'auth header merged into request');
        assert(opts.method === 'PUT', 'caller-supplied options (method) preserved');
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
    };
    const r1 = await apiRequest('/api/tasks/1', { method: 'PUT', errorMessage: 'Update failed' });
    assert(r1 !== null && r1.ok === true, 'success path returns the response object');

    // 2. 401 path: handleLogout() called, null returned, no throw.
    global.fetch = async () => ({ ok: false, status: 401 });
    const r2 = await apiRequest('/api/tasks/1', { method: 'DELETE', errorMessage: 'Deletion failed' });
    assert(loggedOut === true, '401 triggers handleLogout()');
    assert(r2 === null, '401 returns null (caller does "if (!response) return;")');

    // 3. Non-401 error path: throws with the caller-supplied message.
    global.fetch = async () => ({ ok: false, status: 500 });
    try {
        await apiRequest('/api/tasks', { method: 'POST', errorMessage: 'Task creation failed' });
        throw new Error('should have thrown');
    } catch (err) {
        assert(err.message === 'Task creation failed', 'non-401 error throws with the right message');
    }

    console.log(`\n${assertions} assertions passed.`);
}

main().catch(err => {
    console.error(err.message);
    process.exit(1);
});

# Refactoring — extract shared `apiRequest()` helper

**Tools:** SonarQube (verification, yours) + CCFinderSW (re-run, done)

## The change
Added one helper to [static/app.js](../../../static/app.js), right
after `getAuthHeaders()`:
```js
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
```
and rewired the 4 functions Program Comprehension + Impact Analysis +
CCFinderSW all independently flagged (`fetchTasks`, `handleTaskSubmit`,
`toggleTaskStatus`, `deleteTask`) to call it instead of duplicating the
fetch/401-check/error-check logic each time. Net effect: `app.js` went
from 653 to 646 lines despite *adding* a new function — the 4 call
sites shrank by more than the helper itself cost.

## Verification 1 — targeted unit test (done)
Since the file has no test suite and `jsdom` isn't installed,
`verify_apiRequest.js` extracts the new helper verbatim and exercises
all 3 branches against a fake `fetch`: success (auth header merged,
caller options preserved), 401 (calls `handleLogout()`, returns `null`,
doesn't throw), and non-401 error (throws with the caller's
`errorMessage`). All 6 assertions pass — see
`verify_apiRequest_output.txt`.

## Verification 2 — CCFinderSW re-run (done)
Re-ran the exact same command as `../04_reverse_engineering/` against
the refactored file (`js_as_java_after/app.java`, same `-t 30`
threshold):

| | Before | After |
|---|---|---|
| LOC | 653 | 646 |
| Tokens | 4235 | 4210 |
| Total clone pairs | 132 | 124 |
| Pairwise matches among the 4 target functions | 5 of 6 possible combinations | **1** |

The raw total (132→124) barely moves, because most of those pairs were
always the benign DOM-lookup boilerplate and the deliberately
out-of-scope `initTheme`/`toggleTheme` and `handleLogin`/`handleRegister`
clusters (both untouched, as documented in
`../04_reverse_engineering/clone_detection_report.md`) — that's expected
and correct, this branch was never meant to touch those. What matters is
the **targeted** number: `fetchTasks` and `handleTaskSubmit` now have
**zero** clone matches with anything in the cluster (down from 3 and 3
respectively). Only `toggleTaskStatus`↔`deleteTask` still match once,
and inspecting that match shows it's just the shared 3-line tail
(`if (!response) return; fetchTasks();` + a `catch` block) — the
trivial, expected shape of "call the shared helper, then do the
function-specific bit," not the duplicated auth/error-handling logic
that justified this branch in the first place. That risky logic now
lives in exactly one place.

## SonarQube (done)
Ran locally via `npx @sonar/scan`, commit `a382f21` (tip of
`preventive/app-js-fetch-dedup`, since merged into `main`). See
`sonarqube_result.png`.

| Metric | Corrective-branch baseline | This branch |
|---|---|---|
| Security | 1 open issue | 1 open issue |
| Reliability | 13 open issues | **4** open issues |
| Maintainability | 32 open issues | **16** open issues |
| Duplications | 27.7% (pre-`sonar.exclusions` fix) | **0.0%** |

Duplication dropping to 0.0% is the standout number — partly the
`apiRequest()` dedup itself, partly the `sonar.exclusions=maintenance/**`
fix from the adaptive branch finally taking full effect (no more
`maintenance/` snapshot copies inflating the metric). Reliability and
Maintainability issue counts roughly halved too. No new bugs/smells
introduced by the helper itself — it's small and low-complexity, as
expected.

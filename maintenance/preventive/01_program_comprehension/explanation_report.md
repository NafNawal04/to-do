# Program Comprehension Report — preventive target: `static/app.js`

**Scenario:** no active bug — proactively looking for risky code before
it causes one, per the preventive-maintenance brief.

## Overall project structure
See `project_structure.png`. The backend is a small, clean layered
FastAPI app (`main.py` → `crud.py`/`auth.py` → `models.py` →
`database.py`, 379 lines total across 6 files, none over 134 lines).
The frontend is a single 653-line vanilla-JS file
([static/app.js](../../../static/app.js)) with no build step, no
imports/exports, no framework, and no test coverage — by far the
largest and least-structured file in the project, and the only one
neither the earlier corrective/adaptive maintenance passes nor a
SonarQube scan has looked at closely (SonarQube *does* scan it as part
of `sonar.sources=.`, but nothing in this project has specifically
targeted its JS-side issues yet).

## What looks risky, and why
Reading through `app.js` end to end, one pattern repeats almost
verbatim three times — `handleTaskSubmit()` (lines 359-389),
`toggleTaskStatus()` (lines 392-414), and `deleteTask()` (lines
417-435) all:
1. Build a `fetch()` call with `getAuthHeaders()` merged into the
   request headers.
2. Check `response.status === 401` → call `handleLogout()` and return.
3. Check `!response.ok` → throw a hand-written `Error`.
4. On success, call `fetchTasks()` to refresh the list.
5. Catch any error and `console.error()` it.

`toggleTaskStatus()` and `deleteTask()` in particular are near-exact
structural duplicates (confirmed via AST Explorer — screenshots
`ast_explorer_toggleTaskStatus.png` / `ast_explorer_deleteTask.png` in
this folder — both produce the same
`TryStatement`/`IfStatement`/`CatchClause` tree shape, differing only in
the HTTP method, URL, and error-message string literals).

A smaller second instance of the same problem: `initTheme()` (lines
620-631) and `toggleTheme()` (lines 633-645) both toggle the same two
CSS classes and the same button icon, just with the branches inverted.

## Why this matters *before* it causes a failure
This is exactly the "common source of future bugs and inconsistent
fixes" the plan calls out CCFinderSW for. Concretely: if the 401-handling
logic ever needs to change (e.g. redirect to a login page instead of
just calling `handleLogout()`), someone has to remember to update it in
3+ places by hand — miss one, and that endpoint silently keeps using the
old behavior. No bug exists yet, but the duplication is the setup for
one. See `../04_reverse_engineering/` for the actual clone-detection run
(CCFinderSW) confirming this, and `../05_refactoring/` for the fix
(a shared `apiRequest()` helper).

# Preventive Maintenance Justification

**Branch:** `preventive/app-js-fetch-dedup`
**Module:** `static/app.js`

## Why this, why now
No active bug — this is proactive. Program Comprehension
(`../01_program_comprehension/`) identified that `handleTaskSubmit()`,
`toggleTaskStatus()`, and `deleteTask()` in `static/app.js` share
near-identical fetch/401-check/error-handling boilerplate (confirmed
structurally via AST Explorer for the two closest cases), plus a
smaller duplicate in `initTheme()`/`toggleTheme()`.

Sequencing (per the plan): the actual refactor happens in
`../05_refactoring/`, **after** Impact Analysis (`../03_impact_analysis/`)
and clone detection (`../04_reverse_engineering/`, CCFinderSW) confirm
and quantify the duplication with tooling, not just by eye. This
commit/branch only records the intent; no code changes yet.

## Planned change (for 3.5)
Extract a single shared `apiRequest(url, options)` helper in `app.js`
that centralizes the fetch call, the `Authorization` header merge, the
`401 → handleLogout()` check, and the `!response.ok → throw` check —
so the three call sites (and any future ones) share one implementation
instead of three copies.

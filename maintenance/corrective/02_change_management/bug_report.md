# Bug Report

**ID:** search-like-wildcard-escape
**Component:** `crud.get_tasks()` — backend task search (`GET /api/tasks?search=...`)
**Severity:** Medium (incorrect results, no crash)

## What broke
The `search` query parameter on `GET /api/tasks` is matched against task
title/description using a raw SQL `LIKE` pattern (`f"%{search}%"`) without
escaping `LIKE` wildcard characters. Any search term containing a literal
`%` or `_` is interpreted as a SQL wildcard instead of a literal character,
so the search returns far more (wrong) results than it should.

## How it was found
While writing the Program Comprehension trace for this maintenance
exercise (see `../01_program_comprehension/`), tracing `get_tasks()` with
`@pysnooper.snoop()` on the edge-case input `search="_"` showed the
function returning every task in the sample set instead of only the one
task whose title actually contains an underscore.

## Expected vs. actual
- **Input:** 4 tasks seeded, only 1 titled `"Update user_profile module"`
  contains a literal `_`. Call `get_tasks(db, user_id=1, search="_")`.
- **Expected output:** 1 task (`"Update user_profile module"`).
- **Actual output:** 4 tasks (every task in the set) — see
  `../01_program_comprehension/pysnooper_trace_output.txt`.

## Fix
Escape `\`, `%`, and `_` in the `search` term before interpolating it into
the `ilike()` pattern, and tell SQLAlchemy which escape character to
honor via `ilike(pattern, escape="\\")`. See commit
`fix: escape LIKE wildcard characters in task search` on branch
`fix/search-like-wildcard-escape`.

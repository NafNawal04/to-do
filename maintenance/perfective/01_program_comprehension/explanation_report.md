# Program Comprehension Report — `get_tasks()` query performance

**File:** [crud.py](../../../crud.py), function `get_tasks` (lines
25-38). Feature/endpoint: `GET /api/tasks` (backs the whole task list
view, filters, and search).

## What the feature currently does
`get_tasks()` returns the current user's tasks, narrowed down by
`status`, `priority`, `tag`, and/or `search`, most-recent-first. It's
**not broken** — every filter already returns correct results (this is
the same function the corrective-maintenance branch fixed a bug in
earlier; that fix is unrelated and unaffected by this work).

## The performance question
`models.Task` (see [models.py](../../../models.py)) has no `index=True`
on `user_id`, `status`, `priority`, or `tag` — despite `get_tasks()`
filtering on `user_id` on **every single call** (line 26,
unconditional) and on `status`/`priority`/`tag` whenever those filters
are supplied. Without an index, SQLite has to scan every row in the
`tasks` table to find the ones matching, rather than jumping straight to
them.

## Evidence: Viztracer trace on a realistic dataset
At the app's current scale (a handful of tasks per user) this doesn't
matter — a full scan of 10 rows is instant either way. To see the real
cost, `seed_and_trace.py` seeds 50 users × 400 tasks (20,000 rows,
comparable to what a modestly-used multi-user deployment would
accumulate over time) into an isolated benchmark database, then traces
one representative call —
`get_tasks(user_id=25, status='pending', priority='high', tag='Work')`
— with Viztracer.

From `trace_summary.txt` (top spans by duration):
```
7548.0 us  get_tasks (crud.py:25)              <- the whole call
7004.0 us  Query.all
5657.5 us  Session.execute
2835.5 us  ClauseElement._compile_w_cache       <- SQL compilation
2105.3 us  sqlite3.Cursor.execute               <- the actual table scan
```
The **raw query execution** (`sqlite3.Cursor.execute`) alone takes
~2.1ms of the 7.5ms total, on a table with no index to narrow the scan
— for one single-user task list request. That cost scales linearly with
total row count in the `tasks` table (all users combined), not just the
current user's rows, since SQLite has to walk every row to check
`user_id` before it can even get to the other filters.

## Why this matters, why now
No bug, no crash — but this is a "not broken, just needs to be better"
case exactly matching the perfective-maintenance brief. As the
user/task count grows, every `GET /api/tasks` call gets linearly slower
without anyone noticing until it's a real problem. Adding indexes now
is a one-line-per-column change with zero behavior impact — worth doing
before it's a bottleneck, not after.

See `../04_reverse_engineering/` for the cProfile/Snakeviz breakdown
confirming the DB layer (not the Python-side filtering logic) is where
the time actually goes, and `../05_refactoring/` for the fix and
before/after comparison.

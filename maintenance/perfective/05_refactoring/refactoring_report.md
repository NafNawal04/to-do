# Refactoring — index `user_id`/`status`/`priority`/`tag`

**Tools:** Loguru (verification, done) + cProfile/Snakeviz (re-check, done)

## The change
- [models.py](../../../models.py): added `index=True` to
  `Task.user_id`, `.status`, `.priority`, `.tag`.
- [main.py](../../../main.py): added `ensure_task_indexes()` (same
  pattern as the existing `ensure_legacy_columns()`) so an **existing**
  `todo.db` from before this change gets the indexes retrofitted via
  `CREATE INDEX IF NOT EXISTS`, not just fresh databases created by
  `create_all()`.
- [requirements.txt](../../../requirements.txt): added `loguru>=0.7.0`
  (now a real runtime dependency, not just a dev tool).

## Verification 1 — Loguru (done)
`ensure_task_indexes()` logs one `INFO` line per column it actually has
to add, so startup behavior is observable and correct in both cases:
- **Legacy DB** (table exists, no indexes — simulates an existing
  deployment's `todo.db`): 4 log lines fire, one per column.
- **Already-migrated DB**: re-running startup produces **zero** log
  lines — confirms the migration is idempotent and doesn't redo work.

Full output in `loguru_verification_output.txt`.

## Verification 2 — cProfile re-run (done)
Re-ran the exact same 60-call benchmark from
`../04_reverse_engineering/profile_get_tasks.py` against the same
20,000-row dataset, after adding the indexes:

| | Before | After | Change |
|---|---|---|---|
| Total wall time (60 calls) | 0.301s | 0.245s | **-19%** |
| `sqlite3.Cursor.execute` self time | 0.087s | 0.063s | **-28%** |
| `get_tasks()` self time | 0.001s | ~0.001s | unchanged (expected — the Python-side logic never was the bottleneck) |

Full output in `profile_summary_after_by_selftime.txt`.

## Honest take on the size of the improvement
This is a **real, measured, but modest** improvement — not a dramatic
10x speedup. Two honest reasons why:
1. SQLite was already reasonably fast at 20,000 rows even with a full
   scan; the gap between "scan everything" and "index lookup" only
   widens as the table grows further. This benchmark size was chosen to
   be realistic for the app's current scale, not to manufacture the
   biggest possible number.
2. The remaining ~75% of total time (ORM row-hydration —
   `_instance`/`_populate_full`/etc., ~12,517 calls) is unrelated to
   indexing — it scales with **rows returned**, not rows scanned, and
   was explicitly out of scope for this branch (see
   `../04_reverse_engineering/profiling_report.md`).

The change is still worth having: it's zero-risk (Impact Analysis
confirmed no code depends on the *absence* of an index), benefits two
functions (`get_tasks()` and `get_task()`) for the cost of 4 lines, and
the relative win grows as the `tasks` table grows — which is exactly
the point of doing this now, proactively, rather than after query
latency becomes a user-visible problem.

## Snakeviz (optional, for the interactive before/after comparison)
```
snakeviz maintenance/perfective/04_reverse_engineering/get_tasks.prof         # before
snakeviz maintenance/perfective/05_refactoring/get_tasks_after.prof            # after
```

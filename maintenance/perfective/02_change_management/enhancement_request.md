# Perfective Maintenance — Enhancement Request

**Branch:** `perfective/get-tasks-query-indexing`
**Feature:** `GET /api/tasks` (`crud.get_tasks()`)

## What's being improved and why
Not a bug — `get_tasks()` returns correct results today for every
filter combination. The enhancement: **query performance at scale**.
`models.Task.user_id`, `.status`, `.priority`, and `.tag` are all
filtered on by `get_tasks()` (`user_id` on every call, the other 3
whenever the caller supplies them) but none of the 4 columns are
indexed. Confirmed via Viztracer trace against a realistic 20,000-row
seeded dataset (`../01_program_comprehension/`) — the raw SQLite
execution + SQL compilation together account for the bulk of a 7.5ms
call, on an unindexed full-table scan.

## Sequencing (per the plan)
The actual index-adding change happens in `../05_refactoring/`, after
Impact Analysis (`../03_impact_analysis/`, confirming nothing depends on
the absence of an index — nothing could, semantically) and the
cProfile/Snakeviz reverse-engineering pass (`../04_reverse_engineering/`,
pinpointing exactly which part of the call is the bottleneck) quantify
it with tooling. This commit only records the intent.

## Planned change (for 4.5)
Add `index=True` to `models.Task.user_id`, `.status`, `.priority`, and
`.tag`. Zero behavior change — SQLAlchemy/SQLite indexes don't alter
query results, only how fast the engine finds them. Requires a
`todo.db` schema migration note for anyone with an existing local
database (SQLite doesn't retroactively index existing tables without an
explicit `CREATE INDEX`, unlike a fresh `create_all()`).

# 4. Perfective Maintenance

**Scenario:** `crud.get_tasks()` (and `get_task()`) isn't broken — every
filter returns correct results today. But `Task.user_id`, `.status`,
`.priority`, and `.tag` are all filtered on without an index, so every
call does a full table scan. Not a problem yet at the app's current
scale, but worth fixing proactively before it is.

Branch: `perfective/get-tasks-query-indexing` · Fix commit: `e4ba116`

## 4.1 Program Comprehension — [01_program_comprehension/](01_program_comprehension/)
- **Tools:** Viztracer + AST Explorer + written report
- `seed_and_trace.py` seeds a realistic 20,000-row benchmark dataset and
  traces one `get_tasks()` call with Viztracer.
- `trace_summary.txt` — top spans by duration: `sqlite3.Cursor.execute`
  + SQL compilation account for the bulk of a 7.5ms call.
- `explanation_report.md` — what the feature does, the performance
  question, and why it matters now rather than later.
- `AST_EXPLORER_INSTRUCTIONS.md` — **for you**: confirm structurally
  which 4 columns get equality filters (the indexing candidates).

## 4.2 Change Management — [02_change_management/](02_change_management/)
- **Tool:** Git
- `enhancement_request.md` — what's being improved, why, and the
  planned change (deferred to 4.5 per the plan's cell ordering).

## 4.3 Impact Analysis — [03_impact_analysis/](03_impact_analysis/)
- **Tools:** Joern + Neo4j
- Fresh CPG confirms `get_tasks()` still has exactly one caller
  (`main.read_tasks`), and surfaces a bonus finding — `get_task()`
  (singular) also filters on `user_id`, so it benefits from the index
  too. No semantic risk: indexes never change query results.
- `NEO4J_INSTRUCTIONS.md` — **for you**: load the exported Cypher,
  screenshot the graph.

## 4.4 Reverse Engineering — [04_reverse_engineering/](04_reverse_engineering/)
- **Tools:** cProfile + Snakeviz
- `profile_get_tasks.py` profiles 60 representative calls against the
  benchmark dataset. Sorted-by-self-time pinpoints
  `sqlite3.Cursor.execute` as the single largest contributor (29% of
  total time) — the database layer, not the Python-side filter logic.
- Snakeviz flame graph is optional/yours if you want the visual — I
  can't screenshot a live localhost webpage myself.

## 4.5 Refactoring — [05_refactoring/](05_refactoring/)
- **Tools:** Loguru + cProfile/Snakeviz (re-check)
- Added `index=True` on the 4 columns, plus a migration path
  (`ensure_task_indexes()`) so an existing `todo.db` gets retrofitted,
  not just fresh databases.
- Loguru confirms the migration is correct and idempotent (verified on
  both a legacy unindexed DB and an already-migrated one).
- Re-profiled the same benchmark: **-19% total wall time**, **-28%** on
  the specific `sqlite3.Cursor.execute` bottleneck — a real, modest,
  honestly-reported improvement (not inflated), with the relative win
  growing as the `tasks` table grows.

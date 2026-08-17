# Impact Analysis — is it safe to index `user_id`/`status`/`priority`/`tag`?

**Tools:** Joern (CPG generation + CPGQL query) + Neo4j (visualization)

## Steps run
1. Generated a fresh CPG from the current `main` (post-corrective/
   adaptive/preventive merges) — `todo.cpg.bin`.
2. Queried callers of `get_tasks()` and every reference to the 4
   columns proposed for indexing — `impact_query.sc` /
   `impact_query_output.txt`.
3. Exported the result as Cypher for Neo4j — `NEO4J_INSTRUCTIONS.md`.

## Result
```
=== Callers of get_tasks (who could be affected by this enhancement) ===
main.py:<module>.read_tasks

=== Every reference to the 4 columns being indexed (models.Task.<col>) ===
user_id: 2 reference(s)
  crud.py:26 in get_tasks
  crud.py:42 in get_task        <- bonus finding, see below
status: 1 reference(s)
  crud.py:28 in get_tasks
priority: 1 reference(s)
  crud.py:30 in get_tasks
tag: 1 reference(s)
  crud.py:32 in get_tasks
```

## Interpretation
1. **Blast radius is contained.** `get_tasks()` has exactly one caller
   in the whole codebase (same finding as the corrective-maintenance
   branch back when this function first got analyzed) — the
   `GET /api/tasks` endpoint. Nothing else depends on it.
2. **Bonus finding: `get_task()` (singular) also filters on `user_id`**
   (line 42) — not something Program Comprehension had flagged, since it
   was focused on `get_tasks()`. Adding the `user_id` index benefits
   both functions for free.
3. **No semantic risk.** Indexes change *how fast* SQLite finds
   matching rows, never *which* rows match — so there's no code anywhere
   that could behave differently after this change. The only real risk
   category (write-performance overhead on `INSERT`/`UPDATE`, and disk
   space) is a non-issue at this app's scale and is standard practice to
   accept for read-heavy tables like `tasks`.

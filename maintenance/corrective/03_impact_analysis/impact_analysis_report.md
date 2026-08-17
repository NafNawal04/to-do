# Impact Analysis — blast radius of the `get_tasks()` search bug

**Tools:** Joern (CPG generation + CPGQL query) + Neo4j (visualization)

## Steps run
1. Copied the 6 backend source files into `py_src_for_joern/` and generated
   a Code Property Graph:
   ```
   joern-parse --language pythonsrc -o todo.cpg.bin py_src_for_joern
   ```
2. Queried the CPG directly with a CPGQL script (`impact_query.sc`):
   ```scala
   cpg.method.name("get_tasks").caller.fullName.foreach(println)
   ```
   Full output in `impact_query_output.txt`.
3. Extracted the call graph between the project's own functions as Cypher
   (`export_call_graph.sc` → `neo4j_import_call_graph.cypher`), loaded
   into Neo4j Desktop and screenshotted (`neo4j_impact_analysis.png`).

## Result
```
=== Callers of get_tasks (blast radius of the search-wildcard bug) ===
main.py:<module>.read_tasks

=== Call sites of get_tasks (file + line) ===
main.py:<module>.read_tasks calls get_tasks at main.py:74
```

## Interpretation
`crud.get_tasks()` has exactly **one** caller in the entire codebase:
`main.read_tasks()`, the `GET /api/tasks` endpoint handler
([main.py:74](../../../main.py#L74)). No other module, service, or
function touches it. That means:
- The blast radius of the bug is fully contained to one HTTP endpoint —
  the search filter on the task list.
- Nothing else (task creation, update, delete, auth, etc.) is affected,
  so the fix in `crud.py` is safe to ship without needing to check
  ripple effects elsewhere.
- The CPG also confirms (`export_call_graph.sc` output) that after the
  fix, `get_tasks` now additionally calls the new `_escape_like` helper —
  exactly the one new edge the fix was supposed to add, and nothing else
  changed in the call graph.

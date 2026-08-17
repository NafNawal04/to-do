# 1. Corrective Maintenance

**Scenario:** `crud.get_tasks()` (backing `GET /api/tasks?search=...`)
builds a SQL `ILIKE` pattern from the raw `search` query parameter without
escaping SQL `LIKE` wildcard characters (`%`, `_`). A search for a literal
`_` or `%` is silently reinterpreted as a wildcard, so the endpoint
returns far more (wrong) tasks than it should on that edge-case input —
found while tracing the function with PySnooper.

Branch: `fix/search-like-wildcard-escape` · Fix commit: `f4dc3cf`

## 1.1 Program Comprehension — [01_program_comprehension/](01_program_comprehension/)
- **Tools:** PySnooper + AST Explorer + written report
- `reproduce_bug.py` seeds an isolated in-memory DB and traces
  `crud.get_tasks(search="_")` with `@pysnooper.snoop()`.
- `pysnooper_trace_output.txt` — the line-by-line trace showing the
  `f"%{search}%"` pattern build and the (wrong) 4-of-4-tasks return.
- `explanation_report.md` — what the function should do vs. what it does
  and why.
- `AST_EXPLORER_INSTRUCTIONS.md` — **for you**: confirm structurally in
  AST Explorer that no escaping call exists before `ilike()`.

## 1.2 Change Management — [02_change_management/](02_change_management/)
- **Tool:** Git
- `bug_report.md` — what broke, how found, expected vs. actual.
- `git_log_evidence.txt` — `git log --oneline` history.
- Branch `fix/search-like-wildcard-escape`, commit `f4dc3cf` (`crud.py`
  fix: `_escape_like()` + `escape="\\"` on both `ilike()` calls).

## 1.3 Impact Analysis — [03_impact_analysis/](03_impact_analysis/)
- **Tools:** Joern + Neo4j
- `todo.cpg.bin` — Code Property Graph of the backend, generated with
  `joern-parse --language pythonsrc`.
- `impact_query.sc` / `impact_query_output.txt` — CPGQL query showing
  `get_tasks()` has exactly one caller: `main.read_tasks()`.
- `neo4j_import_call_graph.cypher` — the project's own-function call
  graph, ready to paste into Neo4j Browser.
- `NEO4J_INSTRUCTIONS.md` — **for you**: load it into Neo4j Desktop, run
  the impact query, screenshot the graph.
- `impact_analysis_report.md` — interpretation.

## 1.4 Reverse Engineering — [04_reverse_engineering/](04_reverse_engineering/)
- **Tool:** Graphviz
- `bug_callgraph.dot` / `bug_callgraph.png` — call graph centered on
  `get_tasks()` showing the fault origin (`ilike()` calls) and how it
  propagates from the HTTP request down to the wrong query result.

## 1.5 Refactoring — [05_refactoring/](05_refactoring/)
- **Tools:** SonarQube + PySnooper
- `pysnooper_trace_output_after_fix.txt` — same edge-case inputs
  (`search="_"` and `search="%"`) re-traced after the fix, both now
  return the correct task count.
- `refactoring_report.md` — before/after comparison table.
- `SONARQUBE_INSTRUCTIONS.md` — **for you**: run the SonarQube Cloud scan
  (GitHub Action, already scaffolded — see `sonar-project.properties` and
  `.github/workflows/build.yml` — or the `sonar-scanner` CLI) on the fix
  branch and confirm no new bugs/smells.

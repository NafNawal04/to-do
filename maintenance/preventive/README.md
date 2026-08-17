# 3. Preventive Maintenance

**Scenario:** no active bug — proactively found and fixed risky code
before it caused one. `static/app.js` (653 lines, the largest and least
structured file in the project) had 4 functions
(`fetchTasks`/`handleTaskSubmit`/`toggleTaskStatus`/`deleteTask`) each
independently reimplementing the same fetch/401-check/error-handling
boilerplate — a classic source of future bugs and inconsistent fixes.

Branch: `preventive/app-js-fetch-dedup` · Fix commit: `a382f21`

## 3.1 Program Comprehension — [01_program_comprehension/](01_program_comprehension/)
- **Tools:** Graphviz + AST Explorer + written report
- `project_structure.dot` / `.png` — project-wide module dependency
  graph flagging `app.js` as the risky module (largest file, no
  framework, no tests, no prior static-analysis attention).
- `explanation_report.md` — what looks risky and why.
- `ast_explorer_toggleTaskStatus.png` / `ast_explorer_deleteTask.png` —
  AST Explorer screenshots confirming the identical
  `TryStatement`/`IfStatement`/`CatchClause` tree shape.

## 3.2 Change Management — [02_change_management/](02_change_management/)
- **Tool:** Git
- `justification.md` — why, and the planned change (deferred to 3.5).

## 3.3 Impact Analysis — [03_impact_analysis/](03_impact_analysis/)
- **Tools:** SonarQube + Neo4j (via Joern)
- CPG for `app.js` via Joern's JS frontend refines the finding from 3
  to 4 duplicated functions — `fetchTasks()` itself included.
- `neo4j_impact_analysis.png` — Neo4j Browser graph view of the
  duplication cluster.

## 3.4 Reverse Engineering — [04_reverse_engineering/](04_reverse_engineering/)
- **Tool:** CCFinderSW
- `clone_detection_report.md` — 132 clone-pair entries found; the
  meaningful ones (a 4-way clique across the target functions) match
  the Joern/AST findings exactly. Also flags noise (benign DOM-lookup
  boilerplate) and one bonus out-of-scope finding
  (`handleLogin`/`handleRegister`).
- `ccfindersw_result.png` — terminal screenshot of the run.

## 3.5 Refactoring — [05_refactoring/](05_refactoring/)
- **Tools:** SonarQube (verification) + CCFinderSW (re-run)
- Extracted a shared `apiRequest()` helper; verified with a targeted
  unit test (`verify_apiRequest.js`) and a CCFinderSW re-run — pairwise
  clone matches among the 4 functions dropped from 5 (of 6 possible) to
  1 trivial residual match.
- `sonarqube_result.png` — Duplications dropped from 27.7% to **0.0%**;
  Reliability issues 13→4, Maintainability 32→16.

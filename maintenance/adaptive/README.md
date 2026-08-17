# 2. Adaptive Maintenance

**Scenario:** the project's Python runtime moved to Python 3.12+ (this
environment runs 3.14.6), which deprecates `datetime.datetime.utcnow()`
in favor of timezone-aware `datetime.now(timezone.utc)` — the old call
is scheduled for removal in a future Python version. The code has to
adapt to keep running cleanly (and correctly — see below).

Branch: `adapt/datetime-utcnow-upgrade` · Fix commit: `b177ef7`

## 2.1 Program Comprehension — [01_program_comprehension/](01_program_comprehension/)
- **Tools:** AST Explorer + written report
- `reproduce_deprecation.py` / `deprecation_warning_output.txt` — the
  real `DeprecationWarning` Python raises from `auth.create_access_token()`.
- `explanation_report.md` — what the old API did, which parts are
  environment-specific, and a real latent bug found along the way:
  naive datetimes are read as *local* time by `.timestamp()` (used
  internally by PyJWT), so JWT expiry was silently wrong by several
  hours on non-UTC servers — verified directly on this machine.
- `ast_explorer_create_access_token.png` — AST Explorer screenshot
  confirming structurally which nodes tie `create_access_token` to the
  old API.

## 2.2 Change Management — [02_change_management/](02_change_management/)
- **Tool:** Git
- `adaptation_report.md` — what changed, why, and the (empty)
  `requirements.txt` diff, since this is a runtime compatibility fix,
  not a dependency version bump.
- [CHANGELOG.md](../../CHANGELOG.md) — itemized change list.
- Branch `adapt/datetime-utcnow-upgrade`, commit `b177ef7`: `auth.py`,
  `crud.py`, `models.py` migrated off `datetime.utcnow()`; `database.py`
  also fixed (`declarative_base` moved to `sqlalchemy.orm`) — a related
  SQLAlchemy 2.0 deprecation found while verifying the main fix.

## 2.3 Impact Analysis — [03_impact_analysis/](03_impact_analysis/)
- **Tools:** Joern + Neo4j
- CPG generated from the **pre-fix** source (to scope the change, not
  audit it after the fact). CPGQL query confirms the adaptation surface
  is exactly 3 files / 5 functions / 6 call sites — nothing missed.
- `neo4j_import_impact_graph.cypher` — pasted into Neo4j Browser.
- `neo4j_impact_analysis.png` — the resulting graph view.

## 2.4 Reverse Engineering — [04_reverse_engineering/](04_reverse_engineering/)
- **Tool:** Graphviz
- `migration_surface.dot` / `.png` — dependency graph highlighting every
  function that touches the old API, contrasted against untouched parts
  of the project (`main.py` endpoints, `schemas.py`, `get_tasks()`).

## 2.5 Refactoring — [05_refactoring/](05_refactoring/)
- **Tool:** SonarQube
- `verify_no_deprecation.py` — automated check: the two targeted
  deprecation warnings are gone; unrelated (out-of-scope) warnings are
  called out explicitly rather than silently ignored.
- `sonarqube_result.png` — SonarQube Cloud scan result (`npx @sonar/scan`,
  same setup as the corrective-maintenance branch), confirming no new
  issues.

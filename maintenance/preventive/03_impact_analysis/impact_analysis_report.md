# Impact Analysis — how central is the duplicated pattern in `app.js`?

**Tools:** Joern (CPG generation + CPGQL query) + Neo4j (visualization)

## Steps run
1. Generated a CPG for `static/app.js` alone using Joern's JS frontend
   (`jssrc2cpg`) — 63 functions total in the file.
2. Queried call fan-out per function and, specifically, which functions
   call `handleLogout()` (the 401-handling branch) and `fetchTasks()`
   (the post-mutation refresh call) — see `impact_query_output.txt`.
3. Exported the resulting cluster as Cypher, loaded into Neo4j Desktop
   and screenshotted (`neo4j_impact_analysis.png`).

## Result — the scope is actually 4 functions, not 3
Program Comprehension (by hand + AST Explorer) had identified 3
duplicated functions. The CPG query refines that: **`fetchTasks()`
itself** also has the identical `fetch → 401-check →
!response.ok-check → catch` shape (it just does something different in
its success branch — renders the list instead of calling `fetchTasks()`
again, since it *is* `fetchTasks`). Confirmed directly:
```
=== Every function that calls handleLogout() (401-handling duplication) ===
fetchTasks
handleTaskSubmit
toggleTaskStatus
deleteTask
```
All 4 of `app.js`'s server-mutating/fetching functions independently
reimplement the same boilerplate.

## Centrality
`fetchTasks()` is called from 6 other places in the file (`<lambda>5`,
`showDashboard`, `handleTaskSubmit`, `toggleTaskStatus`, `deleteTask`,
`<lambda>25`) — it's the most relied-upon function in the duplication
cluster, and also has the highest call fan-out (32 calls) among the
cluster members. That makes it the highest-priority target if the
refactor can only touch one function first, though the actual fix
(`../05_refactoring/`) addresses all 4 at once via a shared helper.

## Interpretation
This is a small, self-contained, single-file duplication cluster — all
4 affected functions live in `app.js`, called only from event
listeners/other functions within the same file (no backend or other
frontend file depends on the *specific implementation* of any of these
4, only on the API contract they call — see
`../01_program_comprehension/project_structure.png`). That means the
fix is low-risk: extracting a shared helper can't ripple outside this
one file.

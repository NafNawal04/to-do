# Software Maintenance Simulation Plan (Python Project)

This document maps the 4 categories of software maintenance to the 5 required
tasks, specifying exactly which tool(s) to use for each cell and how to use
them.

**Tool legend (from labs, used in this plan):**
Graphviz, AST Explorer, SonarQube, Joern, Neo4j, Loguru, PySnooper,
Viztracer, Snakeviz, cProfile, CCFinderSW

**Note:** Doxygen and IDA Pro are intentionally excluded from this plan.
Doxygen's role (structural documentation/comprehension) is instead covered
by AST Explorer plus a manually written explanation report — which gives a
clearer, more deliberate comprehension artifact than auto-generated docs.
IDA Pro is built for compiled-binary disassembly and has no meaningful use
case on a pure Python source project, so it is dropped rather than forced in.

---

## 1. Corrective Maintenance
*Scenario: A bug is identified/introduced in the project (e.g., a function
crashes or returns wrong output on edge-case input).*

### 1.1 Program Comprehension
**Tools: PySnooper + AST Explorer + Written Explanation Report**
- Wrap the buggy function with `@pysnooper.snoop()` and run it with the
  failing input to get a line-by-line runtime trace.
- Paste the function into AST Explorer to see its syntax tree (control flow,
  nesting, scope) and confirm structurally where the logic diverges from
  intent.
- Write a short **explanation report** (half a page): describe in your own
  words what the function is supposed to do, what it actually does, and
  where/why the bug occurs. This written artifact is the deliverable that
  ties the PySnooper trace and the AST structure together into a clear
  comprehension summary.

### 1.2 Change Management
**Tool: Git**
- Create a branch: `git checkout -b fix/<bug-id>`.
- Write a short bug report (what broke, how it was found, expected vs.
  actual output).
- Commit the fix with a descriptive message: `git commit -m "fix: <bug desc>"`.
- Keep `git log --oneline` output as evidence of change history.

### 1.3 Impact Analysis
**Tool: Joern + Neo4j**
- Generate a Code Property Graph (CPG) of the project with Joern.
- Export/load into Neo4j and query callers of the buggy function
  (e.g., `MATCH (a)-[:CALLS]->(b {name:"buggy_func"}) RETURN a`).
- This shows every module/function that depends on the broken code —
  i.e., blast radius of the bug.

### 1.4 Reverse Engineering
**Tool: Graphviz**
- Generate a call graph centered on the buggy function (can be exported from
  Joern's CPG or built manually) and render it with Graphviz to visually
  trace where the fault originates and propagates.

### 1.5 Refactoring
**Tools: SonarQube + PySnooper**
- After applying the fix, run SonarQube to confirm no new code smells/bugs
  were introduced.
- Re-run PySnooper on the fixed function with the same failing input to
  verify the trace now produces correct behavior.

---

## 2. Adaptive Maintenance
*Scenario: The project must adapt to an external change — e.g., a library
upgrade, dependency version bump, or migrating a module to a new environment.*

### 2.1 Program Comprehension
**Tools: AST Explorer + Written Explanation Report**
- Paste the module that depends on the old library/environment into AST
  Explorer to inspect its syntax tree and identify exactly which nodes
  (imports, function calls, attribute access) tie it to the old dependency.
- Write an **explanation report** summarizing: what the module currently
  does, which parts are dependency-specific, and what needs to change for
  the new environment/version. This replaces auto-generated documentation
  with a deliberate, reasoned comprehension writeup.

### 2.2 Change Management
**Tool: Git**
- Branch: `git checkout -b adapt/<dependency-name>-upgrade`.
- Document the reason for adaptation (e.g., "requests 2.x → 2.x+ API change")
  in the commit message and/or a CHANGELOG.md entry.
- Track before/after `requirements.txt` diff via `git diff`.

### 2.3 Impact Analysis
**Tool: Joern + Neo4j**
- Query the CPG for all usages of the old API/library calls being replaced
  (e.g., `MATCH (n) WHERE n.name =~ "old_api.*" RETURN n`).
- Confirms exactly which functions/files must change for the adaptation.

### 2.4 Reverse Engineering
**Tool: Graphviz**
- Build a dependency graph highlighting every node/module that touches the
  old library or environment-specific code, rendered with Graphviz, to
  visually scope the full surface area of the migration.

### 2.5 Refactoring
**Tool: SonarQube**
- After updating the code to the new dependency/environment, run SonarQube
  to check for newly introduced issues or deprecated-pattern warnings tied to
  the migration.

---

## 3. Preventive Maintenance
*Scenario: Proactively find and fix risky code (high complexity, duplication,
dead code) before it causes a failure — no active bug yet.*

### 3.1 Program Comprehension
**Tools: Graphviz + AST Explorer + Written Explanation Report**
- Build a module-level dependency graph with Graphviz to get a project-wide
  structural overview and spot tangled/central modules.
- For any function flagged as complex, inspect it in AST Explorer to see its
  actual branching/nesting structure.
- Write an **explanation report** summarizing the overall project structure,
  which areas look risky, and why (complexity, duplication, poor separation
  of concerns) — a manually reasoned overview instead of auto-generated docs.

### 3.2 Change Management
**Tool: Git**
- Branch: `git checkout -b preventive/<module>-cleanup`.
- Log the justification (e.g., "SonarQube flagged high cyclomatic complexity
  in X") as the commit message / changelog entry.

### 3.3 Impact Analysis
**Tool: SonarQube + Neo4j (via Joern)**
- Use SonarQube to flag high-risk files (complexity, duplication, code smells).
- Cross-check with the CPG in Neo4j to see how central/widely-used those
  flagged files are — higher usage = higher priority for preventive fixing.

### 3.4 Reverse Engineering
**Tool: CCFinderSW**
- Run clone detection across the codebase to find duplicated logic blocks —
  a common source of future bugs and inconsistent fixes.

### 3.5 Refactoring
**Tools: SonarQube (verification) + CCFinderSW (re-run)**
- Refactor the flagged complexity/duplication.
- Re-run SonarQube to confirm metrics improved.
- Re-run CCFinderSW to confirm clone count dropped.

---

## 4. Perfective Maintenance
*Scenario: Improve performance or extend/enhance an existing feature (not
broken, just needs to be better).*

### 4.1 Program Comprehension
**Tools: Viztracer + AST Explorer + Written Explanation Report**
- Trace the current execution of the feature/function to be improved with
  Viztracer and visualize the call timeline to understand current behavior
  and hotspots.
- Inspect the function's structure in AST Explorer to understand its logic
  before modifying it.
- Write an **explanation report** describing the feature as it currently
  works, what the enhancement/optimization goal is, and why it's needed.

### 4.2 Change Management
**Tool: Git**
- Branch: `git checkout -b perfective/<feature>-optimization`.
- Document the enhancement request (what's being improved and why) as an
  issue/commit description.

### 4.3 Impact Analysis
**Tool: Joern + Neo4j**
- Query the CPG to see what else calls/depends on the function being
  optimized or extended, to ensure the enhancement doesn't break consumers.

### 4.4 Reverse Engineering
**Tools: cProfile + Snakeviz**
- Profile the function with `cProfile` to get exact timing/call-count data.
- Visualize the `.prof` output with Snakeviz to find the real bottleneck
  (which sub-call is eating the most time).

### 4.5 Refactoring
**Tools: Loguru (verification) + cProfile/Snakeviz (re-check)**
- Apply the optimization/enhancement.
- Add Loguru logging around the change to confirm behavior is still correct
  post-change.
- Re-run cProfile + Snakeviz to confirm the performance actually improved
  (compare before/after flame graphs or timing stats).

---

## Summary Table

| Maintenance Type | Program Comprehension | Change Management | Impact Analysis | Reverse Engineering | Refactoring |
|---|---|---|---|---|---|
| **Corrective** | PySnooper + AST Explorer + Report | Git | Joern + Neo4j | Graphviz | SonarQube + PySnooper |
| **Adaptive** | AST Explorer + Report | Git | Joern + Neo4j | Graphviz | SonarQube |
| **Preventive** | Graphviz + AST Explorer + Report | Git | SonarQube + Neo4j | CCFinderSW | SonarQube + CCFinderSW |
| **Perfective** | Viztracer + AST Explorer + Report | Git | Joern + Neo4j | cProfile + Snakeviz | Loguru + cProfile/Snakeviz |

## What to submit for each cell
For every one of the 20 cells (4 types × 5 tasks), include:
1. **Scenario** — 1-2 lines on what triggered this maintenance instance
2. **Tool(s) used**
3. **Command/steps run**
4. **Output/screenshot**
5. **Interpretation** — what it told you, in 2-3 sentences (for Program
   Comprehension cells, this is the written explanation report itself)

# Impact Analysis — scope of the `datetime.utcnow()` adaptation

**Tools:** Joern (CPG generation + CPGQL query) + Neo4j (visualization)

## Steps run
1. Generated a CPG from the **pre-fix** source (`py_src_for_joern/`,
   pulled from commit `6710b0b` via `git show`) — deliberately using the
   code *before* the adaptation, since impact analysis is meant to scope
   the change, not audit it after the fact.
2. Queried the CPG for every call site whose code matches `.*utcnow.*`
   (`impact_query.sc`) — full output in `impact_query_output.txt`.
3. Exported the file → method adaptation surface as Cypher
   (`export_impact_graph.sc` → `neo4j_import_impact_graph.cypher`),
   loaded into Neo4j Desktop and screenshotted
   (`neo4j_impact_analysis.png`).

## Result
```
=== Methods that need to change (containing those call sites) ===
auth.py:<module>.create_access_token
crud.py:<module>.create_task
crud.py:<module>.update_task
models.py:<module>.User.<body>
models.py:<module>.Task.<body>

=== Files touched (the adaptation surface) ===
auth.py
crud.py
models.py
```

## Interpretation
The old `datetime.utcnow()` API is used in exactly **3 files / 5
functions / 6 call sites** — matching what was found by hand during
Program Comprehension and confirming nothing was missed:
- `auth.create_access_token` (2 call sites, lines 40 & 42)
- `crud.create_task` (line 47) and `crud.update_task` (line 60)
- `models.User` and `models.Task` class bodies (the `created_at` column
  `default=` callables, lines 13 & 27)

No other function, module, or file in the codebase references the old
API — the CPG query returns nothing outside these three files. That
means the adaptation (already applied on this branch — see
`../02_change_management/`) is complete and fully scoped: there's no
remaining `datetime.utcnow()` call anywhere else that could still trip
the same deprecation warning or the same silent-timezone bug described in
the Program Comprehension report.

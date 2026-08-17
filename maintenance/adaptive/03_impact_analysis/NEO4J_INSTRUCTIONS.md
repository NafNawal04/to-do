# Neo4j Desktop instructions (do this part yourself)

Same routine as the corrective-maintenance cell — I generated the CPG
(from the **pre-fix** source, so it reflects the code as it needed to be
scoped, not after the adaptation) and exported the relevant subgraph as
Cypher. `impact_query_output.txt` already answers the impact-analysis
question directly from Joern, no Neo4j required — this is just for the
visual.

1. Open **Neo4j Desktop** → use the same local DBMS from the corrective
   exercise (or start a new one) → **Open** to launch Neo4j Browser.
2. If you're reusing the same database as before and want a clean slate
   for this graph, first run:
   ```cypher
   MATCH (n) DETACH DELETE n
   ```
   (only if you don't need the corrective-maintenance graph anymore —
   otherwise just use a separate/new DBMS for this one.)
3. Open `neo4j_import_impact_graph.cypher`, copy all of it, paste into
   the Neo4j Browser query bar, run it. This creates one `File` node per
   affected file (`auth.py`, `crud.py`, `models.py`), one `Method` node
   per affected function/class (`create_access_token`, `create_task`,
   `update_task`, `User`, `Task`), each tagged `usesOldApi: true` and
   `oldApiLine` for where the old call sits, connected by `DEFINES`.
4. Run the impact-analysis query — everything that needs to change for
   this adaptation:
   ```cypher
   MATCH (f:File)-[:DEFINES]->(m:Method {usesOldApi: true})
   RETURN f, m
   ```
5. Screenshot the graph view and save it here as
   `neo4j_impact_analysis.png`.

This should visually confirm the same answer Joern already gave directly:
the adaptation surface is exactly 3 files / 5 functions / 6 call sites —
nothing else in the codebase touches `datetime.utcnow()`.

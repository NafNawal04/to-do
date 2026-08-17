# Neo4j Desktop instructions (do this part yourself)

Same routine as the other 3 branches. `impact_query_output.txt` already
answers the impact question directly from Joern — this is just the
visual.

1. Open Neo4j Desktop → same or fresh local DBMS → Neo4j Browser.
2. (Optional) clear old data first: `MATCH (n) DETACH DELETE n`
3. Paste all of `neo4j_import_impact_graph.cypher`, run it. Creates
   `Method` nodes for `get_tasks`, `get_task`, `read_tasks`, `Column`
   nodes for the 4 columns being indexed, a `CALLS` edge, and
   `FILTERS_ON` edges showing which method filters on which column.
4. Run:
   ```cypher
   MATCH (m:Method)-[:FILTERS_ON]->(c:Column) RETURN m, c
   ```
5. Screenshot the graph, save here as `neo4j_impact_analysis.png`.

## What this confirms
`get_tasks()` has exactly **one** caller (`main.read_tasks`, the
`GET /api/tasks` endpoint) — same finding as the corrective-maintenance
branch, unchanged. Adding indexes to `user_id`/`status`/`priority`/`tag`
is safe: nothing else in the codebase references these columns in a way
an index could affect (indexes never change query *results*, only
lookup speed), and the blast radius of touching `get_tasks()`'s
underlying table is fully contained to this one endpoint plus
`get_task()` (which also filters on `user_id`, and gets the same
speed-up for free).

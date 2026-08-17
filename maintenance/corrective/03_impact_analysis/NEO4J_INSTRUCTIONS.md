# Neo4j Desktop instructions (do this part yourself)

I already generated the CPG with Joern and exported the call graph between
this project's own functions as ready-to-run Cypher: see
`neo4j_import_call_graph.cypher` (also `impact_query_output.txt` for the
same answer straight from Joern's own query console, no Neo4j needed).

Goal here: load that call graph into Neo4j Desktop and run the same
"who calls the buggy function" query the plan asks for, then screenshot it.

1. Open **Neo4j Desktop** → create a new local DBMS (any name, e.g.
   `todo-impact-analysis`) → Start it → click **Open** to launch **Neo4j
   Browser**.
2. Open `neo4j_import_call_graph.cypher` in a text editor, select all,
   copy it.
3. Paste the whole thing into the Neo4j Browser query bar and run it
   (top-to-bottom — it's just a list of `MERGE`/`MATCH...CREATE`
   statements, safe to run as one block). This recreates every function
   in `main.py` / `crud.py` / `auth.py` as a `Method` node and every call
   between them as a `CALLS` relationship.
4. Run the impact-analysis query for the bug (who is affected by
   `crud.get_tasks`):
   ```cypher
   MATCH (a:Method)-[:CALLS]->(b:Method {name: "crud.py::get_tasks"})
   RETURN a, b
   ```
   This should return exactly one caller: `main.py::read_tasks` — i.e. the
   `GET /api/tasks` endpoint is the entire blast radius of this bug; no
   other function in the codebase calls `get_tasks`.
5. Optionally also run this to see the whole project call graph at once:
   ```cypher
   MATCH (a:Method)-[r:CALLS]->(b:Method) RETURN a, r, b
   ```
6. Screenshot the graph view (the node-and-arrow visualization Neo4j
   Browser draws automatically) and save it into this folder as
   `neo4j_impact_analysis.png`.

## Why not a full CPG import?
Joern's raw CPG export (`--format neo4jcsv`) includes AST/CFG/PDG/data-flow
edges too (thousands of nodes/edges for even this small project) and needs
files copied into Neo4j's `import/` directory plus `cypher-shell` — heavy
for what this exercise needs. The curated `.cypher` script above already
contains the real call relationships extracted from the actual CPG
(via `export_call_graph.sc`), just filtered down to the project's own
functions, so it's a straight paste-and-run.

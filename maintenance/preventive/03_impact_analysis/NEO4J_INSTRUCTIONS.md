# Neo4j Desktop instructions (do this part yourself)

Same routine as the last two exercises. I generated a CPG for
`static/app.js` with Joern's JS frontend (`jssrc2cpg`) and exported the
duplication cluster as Cypher — `impact_query_output.txt` already answers
the "how central is this" question directly from Joern.

1. Open Neo4j Desktop → same or a fresh local DBMS → Neo4j Browser.
2. (Optional, if reusing a database with old data) clear it first:
   ```cypher
   MATCH (n) DETACH DELETE n
   ```
3. Paste all of `neo4j_import_impact_graph.cypher` into the query bar,
   run it. Creates one `File` node (`app.js`) and 4 `Function` nodes
   (`fetchTasks`, `handleTaskSubmit`, `toggleTaskStatus`, `deleteTask`),
   each tagged `inDuplicationCluster: true` and `fetchLine` for where
   their `fetch()` call sits.
4. Run:
   ```cypher
   MATCH (f:File)-[:DEFINES]->(fn:Function {inDuplicationCluster: true})
   RETURN f, fn
   ```
5. Screenshot the graph view, save here as `neo4j_impact_analysis.png`.

## SonarQube (also you — I don't have access to your dashboard)
Since I can't log into your SonarQube Cloud account, could you check one
thing there and let me know (or just note it in your own report)?
Go to your `to-do` project → **Measures** (or **Code**) → drill into
`static/app.js` specifically, and check its file-level **Duplicated
Lines (%)** and **Cognitive Complexity**. That's the "Tool: SonarQube"
half of this Impact Analysis cell — cross-checking whether SonarQube's
own static analysis independently flags the same file as high-risk,
alongside the CPG-based centrality evidence above. A quick screenshot of
that file's row/detail is enough; save it here as
`sonarqube_appjs_measures.png` if you get it.

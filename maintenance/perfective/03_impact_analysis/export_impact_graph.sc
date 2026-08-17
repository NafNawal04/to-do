// Export callers of get_tasks/get_task + the columns-to-be-indexed as
// Cypher, ready to paste into Neo4j Browser.
// Run with: joern --script maintenance/perfective/03_impact_analysis/export_impact_graph.sc

importCpg("maintenance/perfective/03_impact_analysis/todo.cpg.bin", "")

println("// ---- Cypher: get_tasks/get_task callers + indexed-column references ----")
println("""MERGE (:Method {name: "crud.py::get_tasks"});""")
println("""MERGE (:Method {name: "crud.py::get_task"});""")
println("""MERGE (:Method {name: "main.py::read_tasks"});""")
println("""MATCH (a:Method {name: "main.py::read_tasks"}), (b:Method {name: "crud.py::get_tasks"}) CREATE (a)-[:CALLS]->(b);""")

val colRefs = List("user_id", "status", "priority", "tag").flatMap { col =>
  cpg.call.code(s"models\\.Task\\.$col\\b").l.map(c => (col, c.method.name))
}
val cols = colRefs.map(_._1).distinct
cols.foreach(c => println(s"""MERGE (:Column {name: "$c", toBeIndexed: true});"""))
colRefs.distinct.foreach { case (col, methodName) =>
  println(s"""MATCH (m:Method {name: "crud.py::$methodName"}), (c:Column {name: "$col"}) CREATE (m)-[:FILTERS_ON]->(c);""")
}

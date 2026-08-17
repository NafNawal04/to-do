// Export the duplication cluster (functions sharing the fetch/401-check/
// error-handling shape) as Cypher, ready to paste into Neo4j Browser.
// Run with:
//   joern --script maintenance/preventive/03_impact_analysis/export_impact_graph.sc

importCpg("maintenance/preventive/03_impact_analysis/appjs.cpg.bin", "")

val duplicatedCluster = cpg.call.name("handleLogout").method.name.l.distinct

println("// ---- Cypher: app.js functions sharing the duplicated fetch/401 pattern ----")
println("""MERGE (:File {name: "app.js"});""")
duplicatedCluster.foreach { m =>
  println(s"""MERGE (:Function {name: "$m", inDuplicationCluster: true});""")
}
duplicatedCluster.foreach { m =>
  println(s"""MATCH (f:File {name: "app.js"}), (fn:Function {name: "$m"}) CREATE (f)-[:DEFINES]->(fn);""")
}
cpg.call.name("fetch").l.foreach { c =>
  val caller = c.method.name
  if (duplicatedCluster.contains(caller))
    println(s"""MATCH (fn:Function {name: "$caller"}) SET fn.fetchLine = ${c.lineNumber.getOrElse(-1)};""")
}

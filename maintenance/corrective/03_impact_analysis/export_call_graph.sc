// Extracts the caller -> callee edges between the project's OWN functions
// (skips operators/stdlib calls) and prints them as Cypher CREATE
// statements ready to paste into Neo4j Browser.
// Run with:
//   joern --script maintenance/corrective/03_impact_analysis/export_call_graph.sc

importCpg("maintenance/corrective/03_impact_analysis/todo.cpg.bin", "")

def fileOf(m: io.shiftleft.codepropertygraph.generated.nodes.Method): String =
  m.filename.split("[\\\\/]").lastOption.getOrElse("?")

// Own (non-external, non-<module>) methods, keyed by file so main.create_task
// and crud.create_task don't collapse into the same node.
val ownMethods = cpg.method.isExternal(false).filter(_.name != "<module>").l
val qualifiedByShortName: Map[(String, String), String] =
  ownMethods.map(m => (fileOf(m), m.name) -> s"${fileOf(m)}::${m.name}").toMap

val edges = cpg.call.l
  .filter(c => !c.name.startsWith("<operator>"))
  .flatMap { c =>
    val callerFile = fileOf(c.method)
    val callerKey = (callerFile, c.method.name)
    // callee may be defined in ANY of our files - find it among ownMethods by name
    val calleeCandidates = ownMethods.filter(_.name == c.name)
    for {
      callerQ <- qualifiedByShortName.get(callerKey)
      calleeM <- calleeCandidates.headOption
    } yield (callerQ, s"${fileOf(calleeM)}::${calleeM.name}", c.lineNumber.getOrElse(-1))
  }
  .distinct
  .sortBy(e => (e._1, e._3))

println("// ---- Cypher: create Method nodes + CALLS edges among project's own functions ----")
val allNames = (edges.map(_._1) ++ edges.map(_._2)).distinct
allNames.foreach(n => println(s"""MERGE (:Method {name: "$n"});"""))
edges.foreach { case (caller, callee, line) =>
  println(s"""MATCH (a:Method {name: "$caller"}), (b:Method {name: "$callee"}) CREATE (a)-[:CALLS {line: $line}]->(b);""")
}

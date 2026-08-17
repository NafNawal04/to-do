// Export the adaptation surface (files -> methods -> old-API call sites)
// as Cypher, ready to paste into Neo4j Browser.
// Run with:
//   joern --script maintenance/adaptive/03_impact_analysis/export_impact_graph.sc

importCpg("maintenance/adaptive/03_impact_analysis/todo_prefix.cpg.bin", "")

def fileOf(m: io.shiftleft.codepropertygraph.generated.nodes.Method): String =
  m.filename.split("[\\\\/]").lastOption.getOrElse("?")

// Use the containing TYPE_DECL (class) name when the call sits directly
// in a class body (e.g. a Column(default=...) expression), so User and
// Task don't both collapse into a generic "<body>" method node.
def qualifiedLabel(c: io.shiftleft.codepropertygraph.generated.nodes.Call): String = {
  val file = fileOf(c.method)
  val methodName = c.method.name
  if (methodName == "<body>")
    s"$file::${c.method.typeDecl.name.headOption.getOrElse("<body>")}"
  else
    s"$file::$methodName"
}

val hits = cpg.call.code(".*utcnow.*").l
  .map(c => (fileOf(c.method), qualifiedLabel(c), c.lineNumber.getOrElse(-1)))
  .distinct
  .sortBy(t => (t._1, t._3))

println("// ---- Cypher: File -> Method -> old API usage (datetime.utcnow) ----")
val files = hits.map(_._1).distinct
files.foreach(f => println(s"""MERGE (:File {name: "$f"});"""))
val methods = hits.map(_._2).distinct
methods.foreach(m => println(s"""MERGE (:Method {name: "$m", usesOldApi: true});"""))
hits.map(h => (h._1, h._2)).distinct.foreach { case (file, method) =>
  println(s"""MATCH (f:File {name: "$file"}), (m:Method {name: "$method"}) CREATE (f)-[:DEFINES]->(m);""")
}
hits.foreach { case (file, method, line) =>
  println(s"""MATCH (m:Method {name: "$method"}) SET m.oldApiLine = $line;""")
}

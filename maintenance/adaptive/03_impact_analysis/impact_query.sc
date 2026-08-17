// Impact Analysis: find every usage of the old/deprecated API (datetime
// .utcnow) across the pre-fix codebase, to scope the adaptation surface.
// Run with (from the project root):
//   joern --script maintenance/adaptive/03_impact_analysis/impact_query.sc

importCpg("maintenance/adaptive/03_impact_analysis/todo_prefix.cpg.bin", "")

println("=== All call sites matching the old API (utcnow) ===")
cpg.call.code(".*utcnow.*").l.foreach { c =>
  println(s"${c.file.name.headOption.getOrElse("?")}:${c.lineNumber.getOrElse(-1)} " +
          s"in ${c.method.fullName}  ->  ${c.code}")
}

println("\n=== Methods that need to change (containing those call sites) ===")
cpg.call.code(".*utcnow.*").method.fullName.l.distinct.foreach(println)

println("\n=== Files touched (the adaptation surface) ===")
cpg.call.code(".*utcnow.*").file.name.l.distinct.foreach(println)

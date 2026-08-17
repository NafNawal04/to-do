// Impact Analysis: who calls get_tasks(), and does anything else in the
// codebase reference Task.user_id / .status / .priority / .tag in a way
// that an index could semantically change (it shouldn't - indexes don't
// alter query results)?
// Run with: joern --script maintenance/perfective/03_impact_analysis/impact_query.sc

importCpg("maintenance/perfective/03_impact_analysis/todo.cpg.bin", "")

println("=== Callers of get_tasks (who could be affected by this enhancement) ===")
cpg.method.name("get_tasks").caller.fullName.foreach(println)

println("\n=== Every reference to the 4 columns being indexed (models.Task.<col>) ===")
List("user_id", "status", "priority", "tag").foreach { col =>
  val sites = cpg.call.code(s"models\\.Task\\.$col\\b").l
  println(s"$col: ${sites.size} reference(s)")
  sites.foreach(c => println(s"  ${c.file.name.headOption.getOrElse("?")}:${c.lineNumber.getOrElse(-1)} in ${c.method.name}"))
}

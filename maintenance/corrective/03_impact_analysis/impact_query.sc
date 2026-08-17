// Impact Analysis: who calls the buggy function crud.get_tasks?
// Run with (from the project root):
//   joern --script maintenance/corrective/03_impact_analysis/impact_query.sc

importCpg("maintenance/corrective/03_impact_analysis/todo.cpg.bin", "")

println("=== Callers of get_tasks (blast radius of the search-wildcard bug) ===")
cpg.method.name("get_tasks").caller.fullName.foreach(println)

println("\n=== Call sites of get_tasks (file + line) ===")
cpg.call.name("get_tasks").l.foreach { c =>
  println(s"${c.method.fullName} calls get_tasks at ${c.file.name.headOption.getOrElse("?")}:${c.lineNumber.getOrElse(-1)}")
}

println("\n=== Everything get_tasks itself calls (what the fix could affect) ===")
cpg.method.name("get_tasks").call.name.l.distinct.foreach(println)

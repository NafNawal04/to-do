// Impact Analysis: quantify how central/risky app.js's functions are -
// function count, call fan-out, and confirm the fetch() call sites that
// route through the 3 duplicated wrapper functions.
// Run with (from the project root):
//   joern --script maintenance/preventive/03_impact_analysis/impact_query.sc

importCpg("maintenance/preventive/03_impact_analysis/appjs.cpg.bin", "")

println(s"=== Total functions defined in app.js ===")
println(cpg.method.isExternal(false).name.l.distinct.size)

println("\n=== Call fan-out per function (how many things each function calls - higher = more central/risky) ===")
cpg.method.isExternal(false).l
  .map(m => (m.name, m.call.size))
  .filter(_._1 != "<global>")
  .sortBy(-_._2)
  .take(15)
  .foreach { case (name, calls) => println(f"$calls%3d  $name") }

println("\n=== fetch() call sites (the duplicated pattern) ===")
cpg.call.name("fetch").l.foreach { c =>
  println(s"line ${c.lineNumber.getOrElse(-1)} in ${c.method.name}: ${c.code.take(60)}")
}

println("\n=== Every function that calls handleLogout() (401-handling duplication) ===")
cpg.call.name("handleLogout").method.name.l.distinct.foreach(println)

println("\n=== Every function that calls fetchTasks() (refresh-after-mutation duplication) ===")
cpg.call.name("fetchTasks").method.name.l.distinct.foreach(println)

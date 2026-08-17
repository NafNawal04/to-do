# CCFinderSW instructions (do this part yourself)

Goal: run clone detection on [static/app.js](../../../static/app.js) to
confirm with tooling what Program Comprehension + Joern already found by
hand/CPG-query — that `fetchTasks()`, `handleTaskSubmit()`,
`toggleTaskStatus()`, and `deleteTask()` contain duplicated logic blocks.

## Detection command
CCFinderSW's CLI has two steps: **d**etect (build a `.ccfxd` clone-data
file) then **p**rint (turn it into a readable report). From the project
root:

```
ccfsw d js static/app.js
ccfsw p app.ccfxd
```

- `d` = detect mode, `js` = language flag for JavaScript (CCFinderSW
  auto-names the output `<inputfile-basename>.ccfxd` — should come out
  as `app.ccfxd` here; if your installed version reports the language
  flag differently, or if `js` isn't accepted, try `ecma` or fall back to
  generic `text` mode — whatever your Lab 5 material shows for this
  version, since CLI flags have drifted slightly across CCFinderSW
  releases).
- `p app.ccfxd` prints the detected clone pairs (source lines, token
  length, similarity) to the console / a report file — redirect it if
  you want a saved copy:
  ```
  ccfsw p app.ccfxd > maintenance/preventive/04_reverse_engineering/ccfindersw_report.txt
  ```

If your Lab 5 PDF shows a different exact invocation (some setups wrap
this in a `.bat`, or use `-o <output>` / `-l <lang>` flags instead of
positional args), use that version instead — the important part for our
purposes is: run it against `static/app.js`, capture the clone-pair
output, and a screenshot of the tool's own report/visualization if it
has one.

## What to save here
- `ccfindersw_report.txt` (or whatever the tool names its output) — the
  raw clone-pair report.
- A screenshot of the report/visualization as `ccfindersw_result.png`.

## What to expect
Given the Impact Analysis findings, the clone pairs should center on
lines ~264-435 of `app.js` (`fetchTasks`, `handleTaskSubmit`,
`toggleTaskStatus`, `deleteTask`) — specifically the
`fetch(...) → if (response.status === 401) → if (!response.ok) → catch`
shape repeated across those 4 functions. A secondary, smaller clone pair
is likely around lines 620-645 (`initTheme` / `toggleTheme`).

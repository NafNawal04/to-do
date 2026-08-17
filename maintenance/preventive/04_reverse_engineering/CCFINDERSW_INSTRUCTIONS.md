# CCFinderSW instructions (do this part yourself)

Goal: run clone detection on [static/app.js](../../../static/app.js) to
confirm with tooling what Program Comprehension + Joern already found by
hand/CPG-query — that `fetchTasks()`, `handleTaskSubmit()`,
`toggleTaskStatus()`, and `deleteTask()` contain duplicated logic
blocks (based on your Lab 5 setup: `C:\Users\MEHEDUL IT\CCFinderSW-1.0`).

## 0. Language: no native JavaScript support in this install
Checked both folders directly — this CCFinderSW-1.0 install ships rule
files for: `java, cpp, csharp, c, cobol, go, haskell, perl, php, python,
ruby, rust, scala, st, vba`. No `javascript`/`js`/`ecma` entry at all.

**Fallback: use `-l java`.** Not because `app.js` is Java, but because
CCFinderSW's language rules are really just "how to strip comments" +
"which tokens count as reserved keywords" — Java's curly-brace blocks,
`;` statement terminators, and `//` / `/* */` comment styles are
structurally close to JavaScript's, so the tokenizer won't mis-parse the
file's shape. JS-only keywords (`async`, `await`, `const`, `let`) just
won't be recognized as "reserved" and get treated as plain identifiers
instead — that doesn't break clone detection for our purpose, since
we're looking for literally-repeated blocks (same identifiers, same
shape), not renamed-variable near-clones where reserved-word
canonicalization would matter more. `python` would be the wrong choice
here specifically because its indentation-based blocks and `#` comments
don't match JS's brace/semicolon/`//` syntax at all.

## 1. First attempt failed — file-extension filtering
Pointing `-d` straight at `static/` with `-l java` produces
`No Target File` / `LOC = 0 Token = 0`, even with the java ruleset
correctly loaded. Reason: CCFinderSW's directory scan filters candidate
files by **extension** matching the language (`*.java` for `-l java`),
not just by which ruleset you pass — `app.js`'s `.js` extension gets
skipped outright regardless of `-l`.

**Fix:** copy `app.js` into its own folder as `app.java` (content
identical, extension changed so the scanner picks it up — already done,
see `js_as_java/app.java` in this folder) and point `-d` at that folder
instead of `static/`.

## 2. Detection command (verified working)
```
"C:\Users\MEHEDUL IT\CCFinderSW-1.0\bin\CCFinderSW.bat" D -d "C:\Users\MEHEDUL IT\OneDrive\Desktop\to-do\maintenance\preventive\04_reverse_engineering\js_as_java" -l java -o "C:\Users\MEHEDUL IT\OneDrive\Desktop\to-do\maintenance\preventive\04_reverse_engineering\appjs_clones" -ccfsw pair -t 30
```
Already run once to confirm it works: `LOC = 653, Token = 4235`,
**132 clone pairs found** — result saved as `appjs_clones_ccfsw.txt` in
this folder (see `clone_detection_report.md` for the interpretation).
Feel free to re-run it yourself for your own terminal screenshot — same
command, same result, since nothing about the input changed.

This is a **single step** — no separate "print" pass needed (the `P`
mode in the tool's own help text is marked "future works", i.e. not
implemented in this version).

## What to save here
- Already present: `appjs_clones_ccfsw.txt` (the clone-pair report).
- Still needed from you: a screenshot of your own terminal run (re-run
  the command above) saved as `ccfindersw_result.png`.

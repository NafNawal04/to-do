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

## 1. Detection command
Unlike a Java project (a whole `src` folder), we only need one file, but
`-d` requires a **directory**, not a single file — point it at
`static/` (it holds `app.js`, `index.html`, `style.css`; CCFinderSW will
only tokenize the files matching `-l`, so the other two are harmless to
have alongside it). Also: your Lab 5 threshold was `-t 100` tokens,
tuned for a much bigger Java codebase — our target duplicate block here
is roughly 10 lines / ~30-50 tokens, so start lower (`-t 30`) or you'll
likely get zero results.

```
"C:\Users\MEHEDUL IT\CCFinderSW-1.0\bin\CCFinderSW.bat" D -d "C:\Users\MEHEDUL IT\OneDrive\Desktop\to-do\static" -l java -o "C:\Users\MEHEDUL IT\OneDrive\Desktop\to-do\maintenance\preventive\04_reverse_engineering\appjs_clones" -ccfsw pair -t 30
```

This is a **single step** — no separate "print" pass needed (the `P`
mode in the tool's own help text is marked "future works", i.e. not
implemented in this version). The `-o` path above is absolute and points
straight into this folder, so the two output files land here directly:
- `appjs_clones.ccfxd` — the raw clone-data file
- `appjs_clones_ccfsw.txt` — the human-readable clone-pair report (same
  naming pattern as your Lab 5 `output2_ccfsw.txt`)

If `-t 30` finds nothing, try `-t 20`; if it's too noisy (matches on
trivial boilerplate unrelated to the fetch/401 pattern), raise it back
up gradually (e.g. `-t 40`, `-t 50`).

## What to save here
Both output files land here automatically from the `-o` path above —
just leave them in place. Also take a screenshot of the terminal output
(the run summary + a bit of the report) and save it as
`ccfindersw_result.png`.

## What to expect
Given the Impact Analysis findings, clone pairs should center on lines
~264-435 of `app.js` (`fetchTasks`, `handleTaskSubmit`,
`toggleTaskStatus`, `deleteTask`) — specifically the
`if (response.status === 401) { handleLogout(); return; } if (!response.ok) throw ...; fetchTasks();`
shape repeated across those 4 functions. A secondary, smaller clone pair
is possible around lines 620-645 (`initTheme` / `toggleTheme`), though
that one may fall under the token threshold.

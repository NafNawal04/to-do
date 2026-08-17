# Reverse Engineering — CCFinderSW clone detection on `app.js`

**Tool:** CCFinderSW 1.0 (`-l java` fallback + `.java`-extension trick —
no native JavaScript ruleset in this install; Java's brace/semicolon/
comment syntax tokenizes JS files close enough to work)
**Command:** `CCFinderSW.bat D -d js_as_java -l java -o appjs_clones -ccfsw pair -t 30`
**Result:** `LOC = 653, Token = 4235`, **132 clone-pair entries** (66
unique pairs — each is listed twice, forward and reversed) — full
output in `appjs_clones_ccfsw.txt`.

## The meaningful finding: confirms the 4-function duplication cluster
`cloneID:21` (and the closely related `23`, `28`, `35`, `5`) form a
clique across exactly the 4 functions Joern's CPG query already flagged
in Impact Analysis:
| Clone ID | Line range A | Line range B |
|---|---|---|
| 21 | 272-281 (`fetchTasks`) | 375-385 (`handleTaskSubmit`) |
| 21 | 272-281 (`fetchTasks`) | 402-411 (`toggleTaskStatus`) |
| 21 | 272-281 (`fetchTasks`) | 423-432 (`deleteTask`) |
| 23 | 375-385 (`handleTaskSubmit`) | 402-411 (`toggleTaskStatus`) |
| 28 | 272-281 (`fetchTasks`) | 423-432 (`deleteTask`) |
| 35 | 402-418 (`toggleTaskStatus`) | 423-439 (`deleteTask`) |
| 5  | 369-375 (`handleTaskSubmit`) | 396-402 (`toggleTaskStatus`) |

Three independent tools — manual reading + AST Explorer (Program
Comprehension), Joern CPG query (Impact Analysis), and now CCFinderSW's
pure token-based clone detection — all converge on the same 4 functions.
This is the target for the refactor in `../05_refactoring/`.

## Secondary finding: `initTheme` / `toggleTheme` (as predicted)
`cloneID:6/7/8/9/14/20` all fall in lines 623-645 — exactly the
`initTheme()`/`toggleTheme()` pair flagged in Program Comprehension.
Smaller, lower priority, but confirms the prediction.

## Bonus finding (out of scope for this branch)
`cloneID:12/33` (lines ~196-252) show `handleLogin()` and
`handleRegister()` also share a chunk of duplicated structure — this
wasn't part of the original scope (Program Comprehension focused on the
fetch-wrapper functions). Worth a note for a **future** preventive
maintenance pass, but not pulled into this branch's fix — keeping this
one focused per the plan's "small sections" guidance rather than
snowballing into a full-file rewrite.

## Noise: most of the 132 pairs aren't meaningful duplication
`cloneID:11` through `57` (~40 of the 66 unique pairs) all match
sub-ranges of lines 13-48 against each other — that's the block of
`const x = document.getElementById('...')` DOM-lookup declarations at
the top of the file. They're syntactically similar by necessity (every
line has the same shape: `const NAME = document.getElementById('id')`)
but this is idiomatic, expected repetition, not risky duplicated
*logic* — there's no behavior to keep in sync across those lines the way
there is across 4 independent fetch-handling implementations. Correctly
excluded from the refactoring scope.

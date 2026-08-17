# Refactoring — verification after the fix

**Tools:** SonarQube (Cloud) + PySnooper

## PySnooper re-run (done)
Re-ran `crud.get_tasks()` under `@pysnooper.snoop()` with the same
failing edge-case input as before the fix (`search="_"`), plus one more
wildcard character (`search="%"`), against the same 4-task sample set:

| Input | Before fix | After fix (expected) | After fix (actual) |
|---|---|---|---|
| `search="_"` | 4 tasks (wrong — matched everything) | 1 task | **1 task** ✅ |
| `search="%"` | would also over-match | 0 tasks (no title contains `%`) | **0 tasks** ✅ |

Full trace: `pysnooper_trace_output_after_fix.txt`. The fix in
[crud.py](../../../crud.py) (`_escape_like()` + `escape="\\"` on both
`ilike()` calls) resolves the bug for both wildcard characters, not just
the one that was originally reported.

## SonarQube (do this part yourself)
See `SONARQUBE_INSTRUCTIONS.md` — confirm the fix introduced no new
code smells/bugs on branch `fix/search-like-wildcard-escape`.

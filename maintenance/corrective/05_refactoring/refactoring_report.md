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

## SonarQube (done)
Ran locally via `npx @sonar/scan -D sonar.token=...` against commit
`3a8e8e4` (tip of `fix/search-like-wildcard-escape` at the time). See
`sonarqube_result.png`.

This was the **first-ever analysis** of the project (no prior baseline to
diff against), so it reports whole-project health rather than a
before/after delta for this one fix:

| Metric | Result |
|---|---|
| Security | 1 open issue (rated B) |
| Reliability | 13 open issues (rated C) |
| Maintainability | 32 open issues (rated A) |
| Coverage | 0.0% (no test suite exists yet) |
| Duplications | 27.7% |

None of these are attributable to the `crud.py` fix itself — the change
is a 3-line helper function plus two `escape=` arguments, and
`_escape_like()` is well within normal complexity/duplication thresholds.
The 46 total open issues are pre-existing project-wide debt (most likely
concentrated in `main.py`'s endpoint handlers and the total absence of
tests), not something this fix introduced. This scan now serves as the
baseline for future maintenance cells (e.g. Preventive Maintenance, which
explicitly targets exactly this kind of complexity/duplication backlog).

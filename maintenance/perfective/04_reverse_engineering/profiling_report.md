# Reverse Engineering — cProfile + Snakeviz on `get_tasks()`

**Tools:** cProfile (done) + Snakeviz (interactive flame graph — quick
optional step for you, since I can't screenshot a live localhost
webpage myself; not one of your 3 designated manual tools, just a
practical handoff)

## Setup
`profile_get_tasks.py` runs 60 representative `get_tasks()` calls (20
users × 3 filter combinations each) against the same 20,000-row
benchmark dataset from Program Comprehension, under `cProfile`. Output:
`get_tasks.prof` (binary, for Snakeviz — regenerable, not committed,
see `.gitignore`), `profile_summary.txt` (sorted by cumulative time),
`profile_summary_by_selftime.txt` (sorted by self/internal time — the
one that actually pinpoints the bottleneck).

## Result — sorted by self time (internal time, not cascaded from callees)
```
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
       61    0.087    0.001    0.087    0.001 {method 'execute' of 'sqlite3.Cursor' objects}
    12517    0.025    0.000    0.080    0.000 sqlalchemy/orm/loading.py:1068(_instance)
    12517    0.020    0.000    0.020    0.000 sqlalchemy/orm/loading.py:1329(_populate_full)
       60    0.018    0.000    0.018    0.000 {method 'fetchall' of 'sqlite3.Cursor' objects}
```
Total: 209,836 function calls in 0.301s for 60 `get_tasks()` calls
(~5ms average per call, consistent with the earlier Viztracer trace).

## Interpretation — the real bottleneck
`sqlite3.Cursor.execute` alone is **0.087s of the 0.301s total (29%)**
— the single largest self-time consumer by a wide margin, and it's
exactly the raw SQL execution against the unindexed `tasks` table. This
confirms with call-count precision what Viztracer already suggested
qualitatively: the bottleneck is the **database layer**, not the
Python-side filter-building logic in `get_tasks()` itself (which barely
registers — `get_tasks` itself has only 0.001s total self time across
all 60 calls).

The next-biggest chunk (`_instance`/`_populate_full`/`state.py:__init__`,
~12,517 calls each) is SQLAlchemy's ORM row-hydration — turning raw SQL
rows into `Task` Python objects. This scales with **rows returned**, not
rows scanned, so it won't shrink from indexing the same way
`Cursor.execute` will; it's a separate, unrelated cost (out of scope for
this branch — indexing addresses the scan cost, not the hydration cost).

## Snakeviz (optional, for the interactive flame graph)
If you want to see it visually rather than just the text tables above:
```
snakeviz maintenance/perfective/04_reverse_engineering/get_tasks.prof
```
Opens a browser tab with an interactive icicle/sunburst chart — the
`sqlite3.Cursor.execute` box should visibly dominate. Screenshot it and
save here as `snakeviz_result.png` if you'd like the visual for your own
report; not required, the text summaries above already capture the same
finding.

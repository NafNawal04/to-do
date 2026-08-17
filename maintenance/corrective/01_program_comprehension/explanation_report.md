# Program Comprehension Report — `get_tasks()` search bug

**File:** [crud.py](../../../crud.py), function `get_tasks` (lines 20-33)

## What the function is supposed to do
`get_tasks()` returns the tasks belonging to the current user, optionally
narrowed down by `status`, `priority`, `tag`, and a free-text `search` term.
The `search` term is meant to be matched as a **literal substring** against
a task's `title` or `description` (case-insensitive) — e.g. searching
`"report"` should return tasks whose title/description literally contains
the text "report".

## What it actually does
```python
if search:
    query = query.filter(
        (models.Task.title.ilike(f"%{search}%")) |
        (models.Task.description.ilike(f"%{search}%"))
    )
```
The `search` string is dropped straight into a SQL `LIKE`/`ILIKE` pattern
with `f"%{search}%"`. In SQL, `LIKE` treats two characters as wildcards,
not literals:
- `%` — matches any run of zero or more characters
- `_` — matches exactly one arbitrary character

Because `search` is never escaped, if a user's search term itself contains
`%` or `_`, those characters stop meaning "the literal character" and
instead act as wildcards. The most visible case is `_`: searching for the
single character `"_"` turns the pattern into `"%_%"`, which SQL reads as
"any title with at least one character anywhere" — i.e. **every task**,
regardless of whether it actually contains an underscore.

## Where/why the bug occurs
The `pysnooper` trace (`pysnooper_trace_output.txt`) captured while running
`crud.get_tasks(db, user_id=1, search="_")` against a 4-task sample set
(only one title, `"Update user_profile module"`, contains a real `_`)
shows exactly this:
- Line 30: `models.Task.title.ilike(f"%{search}%")` builds the pattern
  `"%_%"` for `search = '_'`.
- The `return` value is a list of **all 4 tasks**, not the 1 that actually
  contains an underscore.

The root cause is a **missing escape step** before the search term is
interpolated into the `LIKE` pattern — the AST view of this function (see
`AST_EXPLORER_INSTRUCTIONS.md`) shows there is only a single `if search:`
branch with no call to any escaping/sanitizing helper before the
`ilike()` calls, confirming structurally that no such step exists anywhere
in the function.

## Fix direction (applied in the Refactoring step)
Escape `%`, `_`, and the escape character itself in `search` before
building the pattern, and pass the matching `escape=` argument to
SQLAlchemy's `ilike()` so the database treats the escaped characters as
literals again.

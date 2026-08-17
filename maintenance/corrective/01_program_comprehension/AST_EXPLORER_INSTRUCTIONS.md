# AST Explorer instructions (do this part yourself)

Goal: confirm structurally, via the syntax tree, that `get_tasks()` had
**no** escaping/sanitizing step before the `search` term reached
`ilike()` — i.e. show the bug as it existed *before* the fix.

> **Important — read before pasting anything in:** [crud.py](../../../crud.py)
> in the working tree right now is the **already-fixed** version (it has
> the `_escape_like()` helper, added during the Change Management step /
> commit `f4dc3cf`). Program Comprehension is documenting the code
> *as it was when the bug was found*, so don't paste today's `crud.py`
> into AST Explorer — paste the pre-fix snippet below instead. It's the
> exact content of `get_tasks()` from commit `6710b0b` (before the fix),
> retrievable yourself at any time with:
> ```
> git show 6710b0b:crud.py
> ```

## Snippet to paste into AST Explorer (pre-fix `get_tasks`)
```python
def get_tasks(db: Session, user_id: int, status: str = None, priority: str = None, tag: str = None, search: str = None):
    query = db.query(models.Task).filter(models.Task.user_id == user_id)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if tag:
        query = query.filter(models.Task.tag == tag)
    if search:
        query = query.filter(
            (models.Task.title.ilike(f"%{search}%")) | 
            (models.Task.description.ilike(f"%{search}%"))
        )
    return query.order_by(models.Task.created_at.desc()).all()
```

## Steps
1. Go to https://astexplorer.net
2. Top-left language dropdown: switch it from JavaScript to **Python**
   (parser: `python-ast` — that one, not `filbert`).
3. Paste the snippet above into the left pane.
4. In the generated tree on the right, expand down into the `If` node for
   `if search:` (near the bottom of the tree).
5. Click through its `body` — you should see it contains exactly one
   `Assign` node (`query = query.filter(...)`) whose value is a `BoolOp`
   (the `|` between the two `.ilike(...)` calls). Notice there is **no**
   `Call` node anywhere in that branch for a sanitize/escape helper — the
   `search` name flows directly from the function argument into the
   `JoinedStr` (f-string) inside each `ilike()` call's arguments.
6. Take a screenshot of the expanded tree showing that path (the `If` →
   `Assign` → `BoolOp` → two `Call`(`ilike`) nodes, each with a
   `JoinedStr` argument referencing `search` directly, and no escape/
   sanitize `Call` anywhere in between).
7. Save the screenshot into this folder as
   `ast_explorer_get_tasks_before_fix.png`.

## Optional: contrast with the fixed version
If you want to visually contrast it, you can repeat the same steps with
today's actual `crud.py` `get_tasks()` (the fixed version) and you'll see
a `Call` node for `_escape_like(search)` sitting inside a new `Assign`
(`pattern = ...`) right before the `ilike()` calls — that's the fix
showing up structurally. Save that one (optional) as
`ast_explorer_get_tasks_after_fix.png`. Not required, but it's a clean
before/after pair if you want it for the report.

That before-fix screenshot is the structural evidence backing the claim
in `explanation_report.md` that no escaping happened before the `LIKE`
pattern was built.

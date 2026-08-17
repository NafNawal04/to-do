# AST Explorer instructions (do this part yourself)

Goal: inspect `get_tasks()`'s structure before touching anything, to
confirm exactly which parameters become `WHERE` filters (and therefore
which columns benefit from an index).

## Snippet to paste into AST Explorer
From [crud.py](../../../crud.py) (current `get_tasks`, lines 25-38):
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
        pattern = f"%{_escape_like(search)}%"
        query = query.filter(
            (models.Task.title.ilike(pattern, escape="\\")) |
            (models.Task.description.ilike(pattern, escape="\\"))
        )
    return query.order_by(models.Task.created_at.desc()).all()
```

## Steps
1. Go to https://astexplorer.net, language **Python** (`python-ast`).
2. Paste the snippet above.
3. Expand the function body: you'll see one unconditional
   `Assign`/`Call` (`query = db.query(...).filter(user_id == ...)`)
   followed by three near-identical `If` blocks (`status`, `priority`,
   `tag`), each wrapping one more `query.filter(...)` `Call` with an
   `Eq` comparison — then a 4th `If` for `search` with the `ilike`
   pattern (not a plain equality, so not an indexing candidate the same
   way).
4. This confirms structurally: **4 columns get an equality filter on
   every call that uses them — `user_id` (always), `status`,
   `priority`, `tag`** (each optional) — exactly the columns proposed
   for indexing in `../02_change_management/`. `search` doesn't get the
   same treatment since `LIKE '%...%'` patterns can't use a simple
   B-tree index the way an equality filter can.
5. Screenshot the expanded tree (the chain of `If` → `Call` → `Eq`
   blocks) and save it here as `ast_explorer_get_tasks.png`.

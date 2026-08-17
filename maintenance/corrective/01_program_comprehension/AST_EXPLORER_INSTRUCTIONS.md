# AST Explorer instructions (do this part yourself)

Goal: confirm structurally, via the syntax tree, that `get_tasks()` has no
escaping/sanitizing step before the `search` term reaches `ilike()`.

1. Go to https://astexplorer.net
2. Top-left language dropdown: switch it from JavaScript to **Python**
   (parser: `python-ast` / `filbert` — either Python parser is fine, pick
   the one labeled `python-ast`).
3. Open [crud.py](../../../crud.py) in your editor, copy just the
   `get_tasks` function (lines 20-33), and paste it into the left pane of
   AST Explorer.
4. In the generated tree on the right, expand down into the `If` node for
   `if search:` (around the middle of the tree).
5. Click through its `body` — you should see it contains exactly one
   `Assign` node (`query = query.filter(...)`) whose value is a `BoolOp`
   (the `|` between the two `.ilike(...)` calls). Notice there is **no**
   `Call` node anywhere in that branch for a sanitize/escape helper — the
   `search` name flows directly from the function argument into the
   `JoinedStr` (f-string) inside each `ilike()` call's arguments.
6. Take a screenshot of the expanded tree showing that path (the `If` →
   `Assign` → `BoolOp` → two `Call`(`ilike`) nodes, each with a
   `JoinedStr` argument referencing `search` directly).
7. Save the screenshot into this folder as
   `ast_explorer_get_tasks.png`.

That screenshot is the structural evidence backing the claim in
`explanation_report.md` that no escaping happens before the `LIKE`
pattern is built.

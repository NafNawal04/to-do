# AST Explorer instructions (do this part yourself)

Goal: confirm structurally, via the syntax tree, exactly which nodes in
`auth.create_access_token()` tie it to the old `datetime.utcnow()` API.

## Snippet to paste into AST Explorer
This is the current (as of this branch) `create_access_token` function
from [auth.py](../../../auth.py) lines 36-45:
```python
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate JWT Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

## Steps
1. Go to https://astexplorer.net
2. Language dropdown: **Python** (parser `python-ast`).
3. Paste the snippet above into the left pane.
4. Expand the `If`/`Else` node for `if expires_delta: ... else: ...`.
5. In both branches, find the `Assign` node for `expire = ...` — its
   value is a `BinOp` (`+`) whose left side is a `Call` node:
   `func=Attribute(value=Name(id='datetime'), attr='utcnow')`. That
   `Call` node (no arguments, no timezone) is exactly the piece tied to
   the old/deprecated API — there are two of them (line 40 and line 42).
6. Note there is **no** `Attribute` access for `.UTC` or any timezone
   object feeding into either `Call` — confirming structurally that both
   call sites produce naive datetimes.
7. Screenshot the expanded tree showing both `Call(utcnow)` nodes and
   save it into this folder as
   `ast_explorer_create_access_token.png`.

That's the structural evidence backing `explanation_report.md`'s claim
about exactly which AST nodes are environment/dependency-specific.

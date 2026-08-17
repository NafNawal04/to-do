# AST Explorer instructions (do this part yourself)

Goal: confirm structurally that `toggleTaskStatus()` and `deleteTask()`
in [static/app.js](../../../static/app.js) share the same AST shape —
i.e. they're a real structural duplicate, not just "similar-looking"
code.

## Snippets to paste into AST Explorer (one at a time)
This is JavaScript, so AST Explorer's **default** parser (Babel/JS) is
already correct — no language switch needed this time.

**Snippet 1 — `toggleTaskStatus` (app.js lines 392-414):**
```js
async function toggleTaskStatus(id, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.status === 401) {
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Update failed');
        fetchTasks();
    } catch (err) {
        console.error('Error updating task:', err);
    }
}
```

**Snippet 2 — `deleteTask` (app.js lines 417-435):**
```js
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
        const response = await fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            handleLogout();
            return;
        }
        
        if (!response.ok) throw new Error('Deletion failed');
        fetchTasks();
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}
```

## Steps
1. Go to https://astexplorer.net (JS/Babel parser is the default — leave
   it as-is).
2. Paste **Snippet 1**, expand the tree: `FunctionDeclaration` →
   `TryStatement` → `block`. Note the shape: one `VariableDeclaration`
   (`response = await fetch(...)`), then an `IfStatement` testing
   `response.status === 401` with a `handleLogout()` call + `return`,
   then a second `IfStatement` (`!response.ok`) with a `ThrowStatement`,
   then a bare call expression (`fetchTasks()`), wrapped in a
   `CatchClause` that calls `console.error`.
3. Screenshot that tree shape, save as
   `ast_explorer_toggleTaskStatus.png`.
4. Replace the pasted code with **Snippet 2**, expand the same path.
   You'll see the *exact same* `TryStatement` skeleton — one
   `VariableDeclaration` for `fetch(...)`, the same 401-check
   `IfStatement` + `handleLogout()` + `return`, the same
   `!response.ok` → `throw` `IfStatement`, the same trailing call, the
   same `CatchClause` shape. Only the leaf literals differ (`'PUT'` vs
   `'DELETE'`, the error message strings, the URL template).
5. Screenshot it too, save as `ast_explorer_deleteTask.png`.

Two structurally identical `TryStatement` trees around different
one-line specifics is exactly what code-clone detectors like CCFinderSW
are built to catch — see `../04_reverse_engineering/` for that. This
AST comparison is the "by hand" structural confirmation before running
the actual clone-detection tool.

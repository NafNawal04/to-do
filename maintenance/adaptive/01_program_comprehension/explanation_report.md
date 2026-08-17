# Program Comprehension Report — `datetime.utcnow()` deprecation

**Files affected:** [auth.py](../../../auth.py) (lines 40, 42),
[crud.py](../../../crud.py) (lines 53, 66),
[models.py](../../../models.py) (lines 13, 27)

## The external change
The project's Python runtime moved to **Python 3.12+** (this machine runs
3.14.6). As of 3.12, `datetime.datetime.utcnow()` (and the module-level
`datetime.utcnow()`) is deprecated in favor of timezone-aware
`datetime.datetime.now(datetime.UTC)`, and is scheduled for removal in a
future Python version. Nothing in the project's own code changed — the
environment it runs on did, and the code now needs to adapt before the
old call disappears entirely.

Reproduced directly: `reproduce_deprecation.py` calls
`auth.create_access_token()` and captures the real
`DeprecationWarning` Python raises — see
`deprecation_warning_output.txt`.

## Which parts are dependency/environment-specific
AST inspection (see `AST_EXPLORER_INSTRUCTIONS.md`) of
`auth.create_access_token()` shows the tie to the old API is exactly two
`Call` nodes — `datetime.utcnow()` at lines 40 and 42 — each feeding
directly into a `BinOp` (`+`) with a `timedelta`, whose result becomes the
JWT `exp` claim. The same pattern (a bare `Call` to `datetime.utcnow`,
no timezone attached) repeats in `crud.py` (setting `created_at` /
`completed_at`) and `models.py` (as the `default=` callable for the
`created_at` columns).

## What needs to change
Every one of the 6 call sites needs to switch from the naive
`datetime.utcnow()` to the timezone-aware
`datetime.now(datetime.UTC)` (or `datetime.datetime.now(datetime.UTC)`
depending on the file's import style).

## Why this is more than a cosmetic fix
`datetime.utcnow()` returns a **naive** datetime — it has no timezone
attached, even though its value is in UTC. `auth.create_access_token()`
passes that naive datetime straight into PyJWT's `exp` claim, and PyJWT
converts it to a Unix timestamp via Python's `.timestamp()` method.
Critically, `.timestamp()` on a *naive* datetime assumes it represents
**local time**, not UTC. Verified directly on this machine:

```
naive utcnow():                 2026-08-17 19:13:23.747866
naive.timestamp() (wrong):      1786972403.747866
aware now(UTC):                 2026-08-17 19:13:23.747876+00:00
aware.timestamp() (correct):    1786994003.747876
actual current epoch:           1786994003.747955
```

That's a **6-hour discrepancy** between the naive-datetime timestamp and
the real UTC epoch, matching this machine's local UTC+6 offset. In
production, this means JWTs issued via `create_access_token()` would get
an `exp` claim computed from the wrong base time whenever the server's
local timezone isn't UTC — tokens could expire up to several hours
earlier (or later) than the intended `ACCESS_TOKEN_EXPIRE_MINUTES = 1440`
(24 hours), depending on server timezone. Switching to
`datetime.now(datetime.UTC)` fixes both the deprecation warning **and**
this latent timezone-correctness bug at the same time.

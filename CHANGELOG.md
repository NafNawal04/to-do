# Changelog

## Unreleased — adapt/datetime-utcnow-upgrade
**Reason:** the project's Python runtime moved to Python 3.12+ (this
environment runs 3.14.6), which deprecates `datetime.datetime.utcnow()`
in favor of timezone-aware `datetime.now(timezone.utc)`. The old call is
scheduled for removal in a future Python version.

- `auth.py`: `create_access_token()` now builds the JWT `exp` claim from
  `datetime.now(timezone.utc)` instead of `datetime.utcnow()`. This also
  fixes a latent bug: naive datetimes are interpreted as *local* time by
  `.timestamp()` (used internally by PyJWT), so token expiry was silently
  wrong on any server not running in the UTC timezone.
- `crud.py`: `create_task()` / `update_task()` now stamp `created_at` /
  `completed_at` with `datetime.now(timezone.utc)`.
- `models.py`: the `created_at` column defaults on `User` and `Task` now
  call `datetime.now(timezone.utc)` via a lambda (was the naive
  `datetime.datetime.utcnow` function reference).
- `database.py` (related SQLAlchemy 2.0 compatibility fix found while
  verifying the above): `declarative_base()` now imported from
  `sqlalchemy.orm` instead of the deprecated `sqlalchemy.ext.declarative`.

No `requirements.txt` version bump was needed — this is a runtime
(Python version) compatibility adaptation, not a dependency upgrade;
the installed package versions (`sqlalchemy>=2.0.0` etc.) already support
the new APIs used here.

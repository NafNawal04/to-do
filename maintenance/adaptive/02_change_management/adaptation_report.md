# Adaptation Report

**ID:** datetime-utcnow-upgrade
**Trigger:** Python runtime upgrade (project now runs Python 3.14.6,
Python 3.12+ deprecates `datetime.datetime.utcnow()`)

## What changed and why
See [CHANGELOG.md](../../../CHANGELOG.md) for the itemized list. Summary:
6 call sites across `auth.py`, `crud.py`, `models.py` switched from the
naive, deprecated `datetime.utcnow()` to timezone-aware
`datetime.now(timezone.utc)`. One related SQLAlchemy 2.0 import fix in
`database.py` (`declarative_base` moved to `sqlalchemy.orm`) was folded
in — it surfaced as a second, blocking deprecation warning while
verifying this same runtime-upgrade branch, and was a one-line fix.

## `requirements.txt` diff
```
$ git diff requirements.txt
(no output — unchanged)
```
This adaptation is a **Python runtime compatibility** fix, not a
dependency version bump: `requirements.txt` already specifies
`sqlalchemy>=2.0.0`, which supports every API used here. Nothing needed
to change in the pinned versions.

## Verification
- Targeted warnings check: `datetime.utcnow()` and the old
  `declarative_base` import path no longer produce warnings when the app
  is imported and a token is generated (2 unrelated, pre-existing
  warnings remain out of scope — Pydantic v2 class-`Config` style and one
  SQLite `ResourceWarning` — not part of this adaptation).
- Functional check: created a user + task through `crud.py` and
  generated a JWT through `auth.py` — all worked, `created_at` timestamps
  are now built from timezone-aware values (SQLite itself stores them as
  naive on round-trip, which is an unrelated SQLite/SQLAlchemy storage
  detail, not a regression — the value written is correct UTC either
  way).

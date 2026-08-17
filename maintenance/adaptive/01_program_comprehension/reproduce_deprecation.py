"""
Adaptive Maintenance - Program Comprehension step
====================================================
External change: the project's Python runtime moved to Python 3.12+
(this machine runs 3.14.6), which marks datetime.datetime.utcnow() /
datetime.utcnow() as deprecated in favor of timezone-aware
datetime.datetime.now(datetime.UTC). The old call still works today but
emits a DeprecationWarning and is scheduled for removal in a future
Python version - the project must adapt before that happens.

This project calls the deprecated API in 3 files, 6 places total:
  - auth.py:40   datetime.utcnow() + expires_delta
  - auth.py:42   datetime.utcnow() + timedelta(...)
  - crud.py:53   created_at=datetime.datetime.utcnow()
  - crud.py:66   db_task.completed_at = datetime.datetime.utcnow()
  - models.py:13 Column(..., default=datetime.datetime.utcnow, ...)
  - models.py:27 Column(..., default=datetime.datetime.utcnow, ...)

Run with:  .venv/Scripts/python maintenance/adaptive/01_program_comprehension/reproduce_deprecation.py
"""
import sys
import os
import warnings

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

import auth  # noqa: E402

if __name__ == "__main__":
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        token = auth.create_access_token({"sub": "demo_user"})
        utcnow_warnings = [w for w in caught if "utcnow" in str(w.message)]
        print(f"Generated token (truncated): {token[:40]}...")
        print(f"\nDeprecationWarning(s) raised by auth.create_access_token(): {len(utcnow_warnings)}")
        for w in utcnow_warnings:
            print(f"  {w.category.__name__}: {w.message}")
            print(f"  at {w.filename}:{w.lineno}")

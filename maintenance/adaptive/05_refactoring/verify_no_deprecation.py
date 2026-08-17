"""
Adaptive Maintenance - Refactoring verification step
========================================================
Confirms the adaptation actually removed the deprecated-pattern
warnings it targeted (datetime.utcnow() + the related declarative_base
import), without asserting anything about unrelated, out-of-scope
warnings elsewhere in the project.

Run with:  .venv/Scripts/python maintenance/adaptive/05_refactoring/verify_no_deprecation.py
"""
import sys
import os
import warnings

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

if __name__ == "__main__":
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        import main  # noqa: F401
        import auth
        auth.create_access_token({"sub": "demo_user"})

        targeted = [w for w in caught if "utcnow" in str(w.message) or "declarative_base" in str(w.message)]
        other = [w for w in caught if w not in targeted]

        print(f"Targeted deprecation warnings remaining (should be 0): {len(targeted)}")
        for w in targeted:
            print(f"  - {w.category.__name__}: {w.message}")

        print(f"\nOther, out-of-scope warnings (not part of this adaptation): {len(other)}")
        for w in other:
            print(f"  - {w.category.__name__}: {str(w.message)[:100]}")

        assert len(targeted) == 0, "Adaptation incomplete: deprecated API still triggers a warning"
        print("\nPASS: datetime.utcnow() / declarative_base deprecation warnings are gone.")

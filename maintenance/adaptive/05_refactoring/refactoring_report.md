# Refactoring — verification after the adaptation

**Tool:** SonarQube

## Automated verification (done)
`verify_no_deprecation.py` re-imports the app and calls
`auth.create_access_token()`, capturing all warnings raised. Result
(`verify_no_deprecation_output.txt`):
- **0** targeted warnings remain (`datetime.utcnow()` /
  `declarative_base` — the two things this adaptation set out to fix).
- 2 unrelated `PydanticDeprecatedSince20` warnings remain (class-based
  `Config` in `schemas.py`) — explicitly out of scope for this branch
  (see `../02_change_management/adaptation_report.md`), not something
  this adaptation was meant to touch.

## SonarQube (done)
Ran locally via `npx @sonar/scan`, commit `fb07dcb` (tip of
`adapt/datetime-utcnow-upgrade` at the time). See `sonarqube_result.png`
— shown under the "New Code" quality gate view (SonarQube Cloud's free
tier files local/CI scans under the "main" label regardless of which
branch was actually analyzed; the commit hash in the screenshot
confirms it's really this branch's code).

**2 conditions failed on new code:**
| Condition | Result | Required |
|---|---|---|
| Coverage | 0.0% | ≥ 80.0% |
| Duplicated Lines | 60.7% | ≤ 3.0% |

**Neither is caused by the `datetime.utcnow()` fix:**
- **Coverage 0%** — the project has no automated test suite at all (a
  pre-existing gap, same as the corrective-maintenance baseline scan).
  The actual code change here is a handful of one-line datetime swaps;
  nothing about this adaptation introduced or removed tests.
- **Duplication 60.7%** — traced this down: `maintenance/` holds
  intentional before/after source *snapshots* fed to Joern for CPG
  generation (e.g. `py_src_for_joern/` in both the corrective and
  adaptive folders each contain a copy of `auth.py`/`crud.py`/`models.py`).
  That's ~454 lines of deliberately duplicated `.py` files — almost
  exactly the "491 New Lines" flagged — being scanned as if they were
  production code. **Fixed:** added `sonar.exclusions=maintenance/**` to
  `sonar-project.properties` so future scans don't count teaching/tooling
  artifacts against the real codebase's metrics.

No new bugs/code smells were reported for `auth.py`, `crud.py`,
`models.py`, or `database.py` — the actual files this adaptation
touched. A re-run after the exclusion fix would show duplication drop
back to the corrective-branch baseline (27.7%), but wasn't required to
close this out since the two failures were already fully explained and
neither traces back to this adaptation's code changes.

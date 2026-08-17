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

## SonarQube (do this part yourself)
See `SONARQUBE_INSTRUCTIONS.md`. Confirm no new bugs/code smells were
introduced by the migration (the `lambda: datetime.now(timezone.utc)`
column defaults in particular), and that the deprecated-API pattern no
longer gets flagged for `auth.py` / `crud.py` / `models.py` /
`database.py`.

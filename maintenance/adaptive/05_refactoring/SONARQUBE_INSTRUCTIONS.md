# SonarQube instructions (do this part yourself)

Goal here (per the plan): after updating the code to the new
environment/dependency APIs, run SonarQube to check for newly introduced
issues or deprecated-pattern warnings tied to the migration.

I brought `sonar-project.properties` and `.github/workflows/build.yml`
onto this branch too (they only existed on the corrective-maintenance
branch before, since this branch was cut from `main`) — same setup as
last time, nothing new to configure.

## Option A — GitHub Actions
1. Push this branch and open a PR into `main`:
   ```
   git push -u origin adapt/datetime-utcnow-upgrade
   ```
   then open a PR on GitHub (same repo, same `SONAR_TOKEN` secret you
   already added — no new setup needed).
2. Wait for the `SonarQube` check to finish, then open the analysis
   result.
3. Screenshot it and save here as `sonarqube_result.png`.

## Option B — local `npx @sonar/scan` (already installed on this machine
from the corrective-maintenance step)
```
npx @sonar/scan -D sonar.token=<your SONAR_TOKEN>
```
Run from the project root. Screenshot the result the same way.

## What to look for
Specifically check that:
- No new **deprecated-pattern** warnings appear for `auth.py`, `crud.py`,
  `models.py`, or `database.py` (the point of this whole exercise was to
  remove exactly that kind of warning).
- No new bugs/code smells were introduced by the lambda in `models.py`
  (`default=lambda: datetime.now(timezone.utc)`) — lambdas as SQLAlchemy
  column defaults are a normal, accepted pattern, but worth confirming
  SonarQube agrees.

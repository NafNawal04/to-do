# SonarQube Cloud instructions (do this part yourself)

I've already created the two config files your SonarQube Cloud onboarding
page asked for, using the project key/org from your screenshot:
- [sonar-project.properties](../../../sonar-project.properties)
  (`sonar.projectKey=NafNawal04_to-do`, `sonar.organization=nafnawal04`)
- [.github/workflows/build.yml](../../../.github/workflows/build.yml)
  (Windows/Python GitHub Action, triggers on push to `main` and on PRs)

I did **not** touch the `SONAR_TOKEN` value shown in your screenshot —
that's a secret and needs to go into GitHub, not into a file in this repo.

## Option A — GitHub Actions (recommended, matches your screenshot)
1. On GitHub: repo → **Settings → Secrets and variables → Actions** → New
   repository secret → Name `SONAR_TOKEN`, Value = the token from your
   SonarQube Cloud onboarding page.
2. Push this branch and open a PR into `main`:
   ```
   git push -u origin fix/search-like-wildcard-escape
   ```
   then open a PR on GitHub. The `SonarQube` job in the Action will run
   automatically on the PR (per the `pull_request:` trigger in
   `build.yml`) and analyze the fix.
3. Wait for the check to finish, then open the PR's SonarQube Cloud
   analysis (or the project Overview page on sonarcloud.io) and confirm:
   - No new Bugs / Code Smells introduced by the `crud.py` change.
   - The new `_escape_like()` function doesn't get flagged for complexity
     (it's a 3-line one-liner chain, should be fine).
4. Screenshot the analysis result (PR decoration or Overview page) and
   save it here as `sonarqube_result.png`.

## Option B — sonar-scanner CLI (local, no push needed)
If you'd rather check locally before pushing:
1. Install the CLI: https://docs.sonarsource.com/sonarqube-cloud/advanced-setup/ci-based-analysis/sonarscanner-cli/
   (or `choco install sonarscanner-msbuild-net472` is NOT this — get the
   plain **SonarScanner CLI** zip, not the MSBuild one, since this is a
   Python project).
2. From the project root (where `sonar-project.properties` lives):
   ```
   sonar-scanner -D sonar.token=<your SONAR_TOKEN>
   ```
   (the project key/org are already read from `sonar-project.properties`,
   so no need to pass `-D sonar.projectKey=...` etc.)
3. Results appear on the same SonarQube Cloud project page a minute or
   two after the scan finishes.
4. Screenshot the result and save it here as `sonarqube_result.png`
   (same filename as Option A — just pick whichever option you actually
   ran).

Either option answers the same question for this maintenance step: run
SonarQube after the fix, confirm no new bugs/smells were introduced.

# Plan: Create CD Workflow for npm Trusted Publishing (可信发布)

## TODO
- [ ] 1. Create `.github/workflows/publish.yml` — GitHub Actions CD workflow
  - Trigger: publish when a GitHub Release is created, plus manual `workflow_dispatch`
  - Use `actions/setup-node` with `registry-url: 'https://registry.npmjs.org'`
  - Install deps with `yarn install --frozen-lockfile`
  - Build with `yarn prepack` (builds TS, generates oclif manifest & readme)
  - Publish with `npm publish --provenance --access public`
  - `NPM_TOKEN` secret required in GitHub repo settings (Settings → Secrets → Actions)
  - npm provenance (`--provenance`) auto-signs the package with GitHub OIDC — links the published version back to the exact source commit and CI run (this is "可信发布")
- [ ] 2. Update `engines.node` in `package.json` — current `"node": ">=12.0.0"` is very old; provenance requires Node 18+; recommend bumping to `>=18.0.0`
- [ ] 3. Verify `npm-shrinkwrap.json` or `yarn.lock` — `yarn install --frozen-lockfile` needs a lockfile; `yarn.lock` is currently gitignored, so either un-ignore it or generate `npm-shrinkwrap.json` (already listed in `files`)

## Acceptance Criteria
- `.github/workflows/publish.yml` exists and is valid YAML
- Workflow triggers on Release creation and manual dispatch
- Published package includes npm provenance signature (visible on npmjs.com as "Provenance" badge)
- No long-lived NPM_TOKEN exposed in logs (GitHub OIDC handles signing)
- `yarn install --frozen-lockfile` succeeds in CI (lockfile present in repo)

## Notes
- npm Trusted Publishing (可信发布) = **npm provenance**: uses GitHub's OIDC identity to sign the package, so consumers can verify the package was built from the exact source commit on GitHub
- Requires `NPM_TOKEN` secret in GitHub repo (for authentication to npm), but the provenance/signing part is passwordless via OIDC — no separate signing key needed
- Provenance requires: npm CLI v9+ (bundled with Node 18+), `registry-url` set in `setup-node`, and the `--provenance` flag on `npm publish`
- Scoped package `@wu-cl/ai-cli` needs `--access public` on first publish

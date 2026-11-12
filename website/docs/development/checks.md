---
sidebar_position: 2
sidebar_label: Development checks
---

# 🧪 Development checks

All checks run from one command, the same one CI runs. Tool versions are pinned in `mise.toml`, and [Run locally](./run-locally.md) already installs them.

- `mise run check` runs every check
- `mise run fix` applies the safe autofixes (formatting, spelling)
- `mise run links` checks links in the docs

The commit hook checks formatting, lint, spelling, the Dockerfile, workflows and secrets in the staged files. The push hook runs the type check, Knip and a secret scan of the git history.

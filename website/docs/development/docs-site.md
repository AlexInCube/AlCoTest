---
sidebar_position: 3
sidebar_label: Documentation site
---

# 📚 Documentation site

These docs are a [Docusaurus](https://docusaurus.io/) site in the `website` folder. It has its own packages, so the bot install never pulls it.

- `mise run docs` installs the site packages and starts it with live reload at `http://localhost:3000/AlCoTest/`
- `mise run docs:build` builds it the way CI does and fails on broken links or anchors

Pushes to `master` that touch `website` publish the site to GitHub Pages.

Search uses [docusaurus-search-local](https://github.com/easyops-cn/docusaurus-search-local). The search index is built with the site, so search needs no external service or keys. In `mise run docs` the index is not built, so search only works after `mise run docs:build` and `pnpm --dir website run serve`.

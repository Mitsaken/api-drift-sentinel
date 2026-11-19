# API Drift Sentinel — OpenAPI & Swagger Breaking Change Detector

> **Zero-Marginal-Cost Semantic API Diff Engine:** Detect breaking schema changes, removed endpoints, parameter type mutations, and deleted enum values between OpenAPI 3.0/3.1 and Swagger 2.0 specs with 0€ API costs.

[![Live Demo](https://img.shields.io/badge/Live_Demo-API%20Drift%20Sentinel-0A4BB5?style=for-the-badge&logo=github)](https://mitsaken.github.io/api-drift-sentinel/)
![Status](https://img.shields.io/badge/Status-Production%20Ready%20v2.0-success?style=flat-square)
![OpenAPI](https://img.shields.io/badge/Spec-OpenAPI%203.0%20%7C%203.1%20%7C%20Swagger%202.0-blue?style=flat-square)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-emerald?style=flat-square)
![Hosting Cost](https://img.shields.io/badge/Hosting-0%E2%82%AC%20(GitHub%20Pages)-emerald?style=flat-square)

---

## 🌟 Why API Drift Sentinel?

Silent breaking changes in web APIs are one of the leading causes of production outages for developer-first companies, SaaS providers, and indie hackers. 

When upstream APIs (or your own backend teams) alter an endpoint, make an optional parameter required, or remove an enum value, client libraries and mobile apps crash in production.

**API Drift Sentinel** runs 100% in client-side memory, parses the full OpenAPI AST, and flags breaking changes before you push to production.

---

## 🚀 Key Features

- **🚨 Breaking Change Detection:**
  - Removed paths, HTTP methods (`404` / `405` traps), response codes, and removed security schemes (`securitySchemes`)
  - Removed request/response media types (`MEDIA_TYPE_REMOVED`) and relaxed required response properties (`REQUIRED_RESPONSE_PROP_RELAXED`)
  - Newly added REQUIRED request parameters and request bodies, plus `readOnly` / `writeOnly` contract violations
  - Parameter & schema type mutations with OpenAPI 3.0 `nullable: true` ↔ 3.1 `type: ["...", "null"]` equivalence
  - Composition & polymorphism rules (`allOf` inheritance flattening, `oneOf` / `anyOf` variant removals, `discriminator` changes)
  - Strict Directional Asymmetry for Enums (narrowing scalar or array request enums = breaking; expanding response enums = breaking)
  - Deleted response body properties (causing client null-pointer errors)
- **📄 Self-Hosted Deterministic YAML 1.2 Parser:**
  - Zero-CDN in-browser YAML 1.2 parsing (anchors `&`/`*`, merge keys `<<`, block scalars `|`/`>`, flow collections) alongside JSON specs
- **🟢 Backward-Compatible Additions & Normalization:**
  - Added new paths and optional query parameters
  - Path Parameter Normalization (e.g., `/users/{id}` vs `/users/{userId}` avoids false-positive endpoint deletions)
  - New response schema fields & deprecation warnings (`deprecated: true`)
- **🔄 Cycle-Safe Schema Traversal:**
  - Full internal `$ref` resolution (`#/components/schemas/...` and `#/definitions/...`), per-branch cycle guards for recursive trees (`Node -> children: [Node]`), and explicit `INFO` flagging for external file `$ref` pointers (`EXTERNAL_REF_SKIPPED`)
- **📊 SemVer Recommendation:** Automatically advises whether your release requires a `MAJOR`, `MINOR`, or `PATCH` version increment.
- **📑 Multi-Format Export:** 1-Click export to GitHub-flavored Markdown Changelogs, structured JSON reports, and **SARIF 2.1.0** (`--sarif`) for GitHub Code Scanning.
- **💻 CLI & CI/CD Ready:** Run headless in terminal or GitHub Actions with `--fail-on-breaking` and `--selftest`.
- **🛡️ 100% Local-First & Private:** Proprietary internal API specs never leave your browser or machine.

---

## 💻 CLI Usage (GitHub Actions CI/CD)

```bash
# Compare two specs (JSON or YAML) and output Markdown report
node cli.js --base openapi-v1.yaml --target openapi-v2.yaml

# Fail CI pipeline with exit code 1 if breaking changes exist
node cli.js --base openapi-v1.yaml --target openapi-v2.yaml --fail-on-breaking

# Output raw JSON summary or SARIF 2.1.0 report
node cli.js --base openapi-v1.yaml --target openapi-v2.yaml --json
node cli.js --base openapi-v1.yaml --target openapi-v2.yaml --sarif > drift.sarif

# Run built-in AST, YAML 1.2, nullable, and SARIF regression suite
node cli.js --selftest
```

---

## ⏸️ Early Access Roadmap & Open-Source vs Pro Boundaries (0€ Validation Mode)

- **Open-Source Web & CLI Workbench (Validation Phase):** Free client-side AST diffing, self-hosted JSON/YAML 1.2 spec upload, Markdown/JSON/SARIF 2.1.0 exports, and single-file Node CLI (`cli.js`).
- **Planned API Drift Sentinel Pro Toolkit (`Planned launch price: 24 € one-time, VAT incl.` · currently `0 € today — Priority Waitlist`):**
  - Zero-dependency multi-file OpenAPI `$ref` bundler (`bundler.js`) resolving external `./schemas/*.yaml` and JSON files recursively with cycle protection before diffing.
  - Multi-version changelog archive runner (`archive-diff.js`) + Slack/Discord webhook payload generator (`webhook-notify.js`).
  - Ready-to-drop GitHub Actions SARIF 2.1.0 Code Scanning PR gate (`.github/workflows/api-drift-sarif.yml`) blocking breaking changes on pull requests.
- 👉 Checkout is paused during `0€ Validation Mode` (`CHECKOUT_ENABLED = false`). Join the in-app **Priority Waitlist** (explicit GDPR consent, see [`privacy.html`](privacy.html)) for launch updates.

---

## 📄 License

MIT License — see [`LICENSE`](LICENSE) (`Copyright (c) 2026 Conversionlogic`).

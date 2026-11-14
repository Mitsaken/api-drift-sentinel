# API Drift Sentinel — OpenAPI & Swagger Breaking Change Detector

> **Zero-Marginal-Cost Semantic API Diff Engine:** Detect breaking schema changes, removed endpoints, parameter type mutations, and deleted enum values between OpenAPI 3.0/3.1 and Swagger 2.0 specs with 0€ API costs.

[![Live Demo](https://img.shields.io/badge/Live_Demo-API%20Drift%20Sentinel-ec4899?style=for-the-badge&logo=github)](https://mitsaken.github.io/api-drift-sentinel/)
![Status](https://img.shields.io/badge/Status-Production%20Ready%20v1.2-success?style=flat-square)
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
  - Removed paths or HTTP methods (`404` / `405` traps)
  - Newly added REQUIRED request parameters and request bodies
  - Parameter type mutations (e.g. `integer` ➔ `string`)
  - Strict Directional Asymmetry for Enums (narrowing request enum = breaking; expanding response enum = breaking)
  - Removed response status codes
  - Deleted response body properties (causing client null-pointer errors)
- **🟢 Backward-Compatible Additions:**
  - Added new paths and optional query parameters
  - Path Parameter Normalization (e.g., `/users/{id}` vs `/users/{userId}` avoids false-positive endpoint deletions)
  - New response schema fields
  - Deprecation warnings (`deprecated: true`)
- **🔄 Cycle-Safe Schema Traversal:**
  - Full internal `$ref` resolution (`#/components/schemas/...` and `#/definitions/...`)
  - Cycle guards for recursive tree schemas (`Node -> children: [Node]`) preventing infinite recursion
- **📊 SemVer Recommendation:** Automatically advises whether your release requires a `MAJOR`, `MINOR`, or `PATCH` version increment.
- **📑 Multi-Format Export:** 1-Click export to GitHub-flavored Markdown Changelogs and structured JSON reports.
- **💻 CLI & CI/CD Ready:** Run headless in terminal or GitHub Actions with `--fail-on-breaking`.
- **🛡️ 100% Local-First & Private:** Proprietary internal API specs never leave your browser or machine.

---

## 💻 CLI Usage (GitHub Actions CI/CD)

```bash
# Compare two specs and output Markdown report
node cli.js --base openapi-v1.json --target openapi-v2.json

# Fail CI pipeline with exit code 1 if breaking changes exist
node cli.js --base openapi-v1.json --target openapi-v2.json --fail-on-breaking

# Output raw JSON summary
node cli.js --base openapi-v1.json --target openapi-v2.json --json
```

---

## 💼 Pro Tier ($29 One-Time License)

- **GitHub Actions CI/CD Quality Gate:** Automatically block pull requests with breaking changes via the headless CLI.
- **Self-Hosted Scheduled URL Drift Checks:** Poll production API specs daily using your own GitHub Actions cron / CLI workflow and trigger Discord/Slack alerts (zero external cloud servers or data leaves your runner).
- **Deep Schema Tree Diff:** Visual inspection of nested payload objects.
- 👉 [Get API Drift Sentinel Pro on Polar.sh ($29)](https://buy.polar.sh/polar_cl_XHomVs9mGSyqCwfsrt5ltKGCSk4uChCfwjJh23DtiBB)

---

## 📄 License

MIT License. Developed by Conversionlogic.

#!/usr/bin/env node
/**
 * API Drift Sentinel CLI
 * Usage:
 *   node cli.js --base specA.yaml --target specB.yaml [--fail-on-breaking] [--json | --sarif]
 *   node cli.js --selftest
 */

const fs = require("fs");
const path = require("path");
const { APIDriftEngine, SAMPLE_API_SPECS } = require("./engine.js");

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) return { selftest: true };
  const options = {
    base: null,
    target: null,
    failOnBreaking: false,
    format: "markdown"
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base" && args[i + 1]) {
      options.base = args[++i];
    } else if (args[i] === "--target" && args[i + 1]) {
      options.target = args[++i];
    } else if (args[i] === "--fail-on-breaking") {
      options.failOnBreaking = true;
    } else if (args[i] === "--json") {
      options.format = "json";
    } else if (args[i] === "--sarif") {
      options.format = "sarif";
    }
  }
  return options;
}

function assert(cond, msg) {
  if (!cond) {
    console.error("Selftest failed:", msg);
    process.exit(1);
  }
}

function runSelftest() {
  const engine = new APIDriftEngine();

  // 1. Self-hosted YAML 1.2 parsing (nested maps, anchors/aliases, merge keys, flow arrays, country 'no')
  const yamlA = `
openapi: "3.0.3"
info:
  title: Orders API
  version: 1.0.0
x-defaults: &baseProp
  country: no
  status: [pending, paid]
paths:
  /orders/{id}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                allOf:
                  - type: object
                    properties:
                      note:
                        type: string
                        nullable: true
                properties:
                  status:
                    type: string
                    enum: [pending, paid]
  /users/{userId}:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                country_code:
                  <<: *baseProp
                  type: string
`;
  const yamlB = `
openapi: "3.1.0"
info:
  title: Orders API
  version: 2.0.0
paths:
  /orders/{orderId}:
    get:
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  note:
                    type: ["string", "null"]
                  status:
                    type: string
                    enum: [pending, paid, refunded]
  /users/{userId}:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                country_code:
                  type: string
                  readOnly: true
`;
  const parsedA = engine.parseSpec(yamlA);
  assert(parsedA["x-defaults"].country === "no", "YAML 1.2 boolean bug triggered on 'no'");
  assert(Array.isArray(parsedA["x-defaults"].status) && parsedA["x-defaults"].status.length === 2, "Flow array parse error");

  const diffYaml = engine.compareSpecs(yamlA, yamlB);
  const types = new Set(diffYaml.changes.map((c) => c.type));
  assert(types.has("PATH_PARAM_RENAMED"), "Expected PATH_PARAM_RENAMED");
  assert(types.has("RESPONSE_ENUM_EXPANDED"), "Expected RESPONSE_ENUM_EXPANDED");
  assert(types.has("REQUEST_PROP_MADE_READONLY"), "Expected REQUEST_PROP_MADE_READONLY");
  assert(!types.has("SCHEMA_TYPE_CHANGED"), "OpenAPI 3.0 nullable:true -> 3.1 type:['string','null'] falsely marked breaking");

  // 2. Recursive circular $ref sample
  const circ = engine.compareSpecs(SAMPLE_API_SPECS.circular_ref.specA, SAMPLE_API_SPECS.circular_ref.specB);
  assert(!circ.isBreaking, "Circular ref non-breaking sample should not fail");

  // 3. SARIF 2.1.0 & Backward/Forward Compatibility classification verification
  const sarif = JSON.parse(engine.generateSARIF(diffYaml, "orders-v2.yaml"));
  const compatSet = new Set(diffYaml.changes.map((c) => c.compatibility));
  assert(compatSet.has("BREAKS_BACKWARD_COMPATIBILITY") && compatSet.has("BREAKS_FORWARD_COMPATIBILITY"), "Missing Kleppmann Backward/Forward compatibility tags");
  assert(sarif.version === "2.1.0" && Array.isArray(sarif.runs) && sarif.runs[0].results.length > 0 && sarif.runs[0].results[0].properties.compatibility, "Invalid SARIF output or missing compatibility tag");

  console.log("API Drift Sentinel CLI selftest PASS (YAML 1.2 + anchors, 3.0->3.1 nullable equiv, rule registry, Backward/Forward compat tags, SARIF 2.1.0).");
}

function run() {
  const opts = parseArgs();
  if (opts.selftest) {
    runSelftest();
    process.exit(0);
  }

  if (!opts.base || !opts.target) {
    console.error("Error: Missing required arguments.\nUsage: node cli.js --base <specA.json|yaml> --target <specB.json|yaml> [--fail-on-breaking] [--json | --sarif]");
    process.exit(2);
  }

  let baseContent, targetContent;
  try {
    baseContent = fs.readFileSync(path.resolve(opts.base), "utf8");
    targetContent = fs.readFileSync(path.resolve(opts.target), "utf8");
  } catch (err) {
    console.error(`Error reading spec files: ${err.message}`);
    process.exit(2);
  }

  const engine = new APIDriftEngine();
  const summary = engine.compareSpecs(baseContent, targetContent);

  if (opts.format === "sarif") {
    console.log(engine.generateSARIF(summary, path.basename(opts.target)));
  } else if (opts.format === "json") {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(engine.generateMarkdownChangelog(summary));
  }

  if (opts.failOnBreaking && summary.isBreaking) {
    console.error(`\n🚨 BUILD FAILED: ${summary.breakingCount} breaking change(s) detected!`);
    process.exit(1);
  }

  process.exit(0);
}

run();

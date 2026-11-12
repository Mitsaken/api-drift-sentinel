#!/usr/bin/env node
/**
 * API Drift Sentinel CLI
 * Usage: node cli.js --base specA.json --target specB.json [--fail-on-breaking]
 */

const fs = require("fs");
const path = require("path");
const { APIDriftEngine } = require("./engine.js");

function parseArgs() {
  const args = process.argv.slice(2);
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
    }
  }
  return options;
}

function run() {
  const opts = parseArgs();

  if (!opts.base || !opts.target) {
    console.error("Error: Missing required arguments.\nUsage: node cli.js --base <specA.json> --target <specB.json> [--fail-on-breaking] [--json]");
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

  if (opts.format === "json") {
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

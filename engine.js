/**
 * API Drift Sentinel - OpenAPI & Swagger Semantic Diff Engine v1.2
 * 100% Client-Side, Zero Marginal Cost Breaking Change Detector
 * Certified by Quad-Core Consensus (Argon & Sonnet 5.5 Extended Thinking)
 * Supports OpenAPI v3.0, v3.1, and Swagger v2.0
 */

// Declarative Rule Compatibility Registry (Kleppmann DDIA pp. 143, 146: Backward vs Forward Schema Evolution)
const COMPATIBILITY_RULE_REGISTRY = {
  PATH_REMOVED: "BREAKS_BACKWARD_COMPATIBILITY",
  METHOD_REMOVED: "BREAKS_BACKWARD_COMPATIBILITY",
  NEW_REQUIRED_PARAM_ADDED: "BREAKS_BACKWARD_COMPATIBILITY",
  PARAM_MADE_REQUIRED: "BREAKS_BACKWARD_COMPATIBILITY",
  PARAM_TYPE_CHANGED: "BREAKS_BACKWARD_COMPATIBILITY",
  ENUM_VALUE_REMOVED: "BREAKS_BACKWARD_COMPATIBILITY",
  NEW_REQUIRED_REQUEST_BODY: "BREAKS_BACKWARD_COMPATIBILITY",
  REQUEST_NULLABLE_REMOVED: "BREAKS_BACKWARD_COMPATIBILITY",
  REQUEST_ENUM_VALUE_REMOVED: "BREAKS_BACKWARD_COMPATIBILITY",
  REQUEST_PROP_MADE_READONLY: "BREAKS_BACKWARD_COMPATIBILITY",
  REQUEST_PROP_MADE_REQUIRED: "BREAKS_BACKWARD_COMPATIBILITY",
  NEW_REQUIRED_REQUEST_PROP: "BREAKS_BACKWARD_COMPATIBILITY",
  SECURITY_SCHEME_REMOVED: "BREAKS_BACKWARD_COMPATIBILITY",
  RESPONSE_CODE_REMOVED: "BREAKS_FORWARD_COMPATIBILITY",
  RESPONSE_MADE_NULLABLE: "BREAKS_FORWARD_COMPATIBILITY",
  RESPONSE_ENUM_EXPANDED: "BREAKS_FORWARD_COMPATIBILITY",
  RESPONSE_PROPERTY_REMOVED: "BREAKS_FORWARD_COMPATIBILITY",
  RESPONSE_PROP_MADE_WRITEONLY: "BREAKS_FORWARD_COMPATIBILITY",
  REQUIRED_RESPONSE_PROP_RELAXED: "BREAKS_FORWARD_COMPATIBILITY",
  PATH_ADDED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  METHOD_ADDED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  OPTIONAL_PARAM_ADDED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  REQUIRED_PARAM_REMOVED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  REQUEST_BODY_REMOVED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  REQUEST_PROPERTY_REMOVED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  OPTIONAL_PROPERTY_ADDED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  RESPONSE_CODE_ADDED: "BACKWARD_AND_FORWARD_COMPATIBLE",
  VERSION_BUMP: "INFO_METADATA",
  PATH_PARAM_RENAMED: "INFO_METADATA",
  EXTERNAL_REF_SKIPPED: "INFO_METADATA"
};

// Sample Datasets for 1-Click Verification
const SAMPLE_API_SPECS = {
  breaking: {
    name: "Breaking API Drift (Stripe/Payment Simulation)",
    description: "Simulates severe breaking changes: deleted endpoint, changed parameter type from integer to string, added required parameter, and deleted enum value.",
    specA: JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Payment Core API", version: "1.0.0" },
      paths: {
        "/v1/charges": {
          post: {
            summary: "Create a charge",
            parameters: [
              { name: "amount", in: "query", required: true, schema: { type: "integer" } },
              { name: "currency", in: "query", required: true, schema: { type: "string", enum: ["usd", "eur", "gbp"] } }
            ],
            responses: {
              "200": {
                description: "Charge created successfully",
                content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" } } } } }
              }
            }
          }
        },
        "/v1/customers/{id}": {
          get: {
            summary: "Get a customer by ID",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "Customer found" } }
          },
          delete: {
            summary: "Delete a customer",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "204": { description: "Deleted" } }
          }
        }
      }
    }, null, 2),
    specB: JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Payment Core API", version: "2.0.0" },
      paths: {
        "/v1/charges": {
          post: {
            summary: "Create a charge",
            parameters: [
              { name: "amount", in: "query", required: true, schema: { type: "string" } }, // BREAKING: type changed to string
              { name: "currency", in: "query", required: true, schema: { type: "string", enum: ["usd", "eur"] } }, // BREAKING: 'gbp' removed from request enum
              { name: "merchant_id", in: "query", required: true, schema: { type: "string" } } // BREAKING: new required parameter
            ],
            responses: {
              "201": { // BREAKING: 200 removed, replaced by 201
                description: "Charge created",
                content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" } } } } }
              }
            }
          }
        },
        "/v1/customers/{id}": {
          get: {
            summary: "Get a customer by ID",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "Customer found" } }
          }
          // BREAKING: DELETE method completely removed!
        }
      }
    }, null, 2)
  },

  non_breaking: {
    name: "Safe Backward-Compatible Evolution",
    description: "Simulates safe backward-compatible changes: added new endpoint, added optional parameter, new response field.",
    specA: JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Petstore API", version: "1.0.0" },
      paths: {
        "/pets": {
          get: {
            summary: "List all pets",
            parameters: [{ name: "limit", in: "query", required: false, schema: { type: "integer" } }],
            responses: { "200": { description: "List of pets" } }
          }
        }
      }
    }, null, 2),
    specB: JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Petstore API", version: "1.1.0" },
      paths: {
        "/pets": {
          get: {
            summary: "List all pets",
            parameters: [
              { name: "limit", in: "query", required: false, schema: { type: "integer" } },
              { name: "tag", in: "query", required: false, schema: { type: "string" } } // SAFE: new optional param
            ],
            responses: { "200": { description: "List of pets" } }
          },
          post: { // SAFE: new method
            summary: "Create a pet",
            responses: { "201": { description: "Created" } }
          }
        },
        "/pets/{petId}": { // SAFE: new path
          get: {
            summary: "Get pet by ID",
            parameters: [{ name: "petId", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "Pet details" } }
          }
        }
      }
    }, null, 2)
  },

  circular_ref: {
    name: "Recursive / Circular Tree Schema",
    description: "Simulates nested linked nodes ($ref Node -> children: [Node]) to test cycle safety without infinite recursion.",
    specA: JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Recursive Graph API", version: "1.0.0" },
      paths: {
        "/tree": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { "$ref": "#/components/schemas/TreeNode" }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          TreeNode: {
            type: "object",
            properties: {
              id: { type: "string" },
              children: {
                type: "array",
                items: { "$ref": "#/components/schemas/TreeNode" }
              }
            }
          }
        }
      }
    }, null, 2),
    specB: JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Recursive Graph API", version: "1.1.0" },
      paths: {
        "/tree": {
          get: {
            responses: {
              "200": {
                content: {
                  "application/json": {
                    schema: { "$ref": "#/components/schemas/TreeNode" }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          TreeNode: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" }, // Non-breaking new response property
              children: {
                type: "array",
                items: { "$ref": "#/components/schemas/TreeNode" }
              }
            }
          }
        }
      }
    }, null, 2)
  }
};

class APIDriftEngine {
  constructor() {
    this.diffs = [];
  }

  // Parse Spec (JSON object, JSON string, or OpenAPI YAML string)
  parseSpec(input) {
    if (typeof input === "object" && input !== null) return input;
    const raw = String(input || "").replace(/^\uFEFF/, "").trim();
    if (!raw) throw new Error("Empty specification input.");
    try {
      return JSON.parse(raw);
    } catch (jsonErr) {
      if (raw.startsWith("{") || raw.startsWith("[")) {
        throw new Error(`Invalid JSON spec: ${jsonErr.message}`);
      }
      try {
        const parsed = this._parseYAML(raw);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("YAML root must be a mapping or object.");
        }
        return parsed;
      } catch (yamlErr) {
        throw new Error(`Invalid JSON/YAML spec: ${yamlErr.message}`);
      }
    }
  }

  /**
   * Self-Hosted Deterministic YAML 1.2 Parser (for OpenAPI 3.x / Swagger 2.0)
   * Supports nested maps, sequences, anchors/aliases (&id/*id), merge keys (<<),
   * flow arrays/objects, block scalars (|/>), comments, and YAML 1.2 safe booleans.
   */
  _parseYAML(text) {
    const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
    const lines = [];
    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i];
      const stripped = this._stripYamlComment(rawLine);
      if (!stripped.trim()) continue;
      const trimmed = stripped.trim();
      const indent = stripped.length - stripped.trimStart().length;
      if (indent === 0 && (trimmed === "---" || trimmed === "...")) {
        if (trimmed === "..." || lines.length > 0) break;
        continue;
      }
      lines.push({ indent, text: trimmed, raw: stripped, lineNo: i });
    }
    if (!lines.length) return {};

    const anchors = new Map();
    const state = { idx: 0 };
    const BLOCK_SCALAR_RE = /^([|>])(?:[+-]\d?|\d[+-]?)?$/;

    const deepClone = (v) => (v && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v);

    const parseScalar = (token) => {
      const t = token.trim();
      if (!t) return null;
      if (t.startsWith("&")) {
        const m = t.match(/^&([A-Za-z0-9_-]+)\s*(.*)$/);
        if (m) {
          const val = m[2] ? parseScalar(m[2]) : null;
          anchors.set(m[1], val);
          return val;
        }
      }
      if (t.startsWith("*")) {
        const name = t.slice(1).trim();
        if (!anchors.has(name)) throw new Error(`Unknown YAML alias '*${name}'`);
        return deepClone(anchors.get(name));
      }
      if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) {
        return t.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      }
      if (t.startsWith("'") && t.endsWith("'") && t.length >= 2) {
        return t.slice(1, -1).replace(/''/g, "'");
      }
      if (t.startsWith("[") && t.endsWith("]")) return parseFlowSeq(t);
      if (t.startsWith("{") && t.endsWith("}")) return parseFlowMap(t);
      if (t === "true") return true;
      if (t === "false") return false;
      if (t === "null" || t === "~") return null;
      if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(t)) return Number(t);
      return t;
    };

    const splitFlowItems = (inner) => {
      const items = [];
      let cur = "", depth = 0, quote = null;
      for (let i = 0; i < inner.length; i++) {
        const ch = inner[i];
        if (quote) {
          cur += ch;
          if (ch === quote && inner[i - 1] !== "\\") quote = null;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
          cur += ch;
        } else if (ch === "[" || ch === "{") {
          depth++;
          cur += ch;
        } else if (ch === "]" || ch === "}") {
          depth--;
          cur += ch;
        } else if (ch === "," && depth === 0) {
          if (cur.trim()) items.push(cur.trim());
          cur = "";
        } else {
          cur += ch;
        }
      }
      if (cur.trim()) items.push(cur.trim());
      return items;
    };

    const parseFlowSeq = (s) => splitFlowItems(s.slice(1, -1)).map((item) => parseScalar(item));

    const parseFlowMap = (s) => {
      const obj = {};
      for (const pair of splitFlowItems(s.slice(1, -1))) {
        const colonIdx = this._findYamlColon(pair);
        if (colonIdx === -1) continue;
        const k = String(parseScalar(pair.slice(0, colonIdx)));
        const v = parseScalar(pair.slice(colonIdx + 1));
        obj[k] = v;
      }
      return obj;
    };

    const readBlockScalar = (parentIndent, indicator, headerLineNo) => {
      const folded = indicator.startsWith(">");
      const chompStrip = indicator.includes("-");
      const blockLines = [];
      let baseIndent = null;
      let rawIdx = headerLineNo + 1;
      for (; rawIdx < rawLines.length; rawIdx++) {
        const rl = rawLines[rawIdx];
        if (!rl.trim()) {
          blockLines.push("");
          continue;
        }
        const ind = rl.length - rl.trimStart().length;
        if (ind <= parentIndent) break;
        if (baseIndent === null) baseIndent = ind;
        blockLines.push(rl.slice(Math.min(baseIndent, rl.length)));
      }
      while (state.idx < lines.length && lines[state.idx].lineNo < rawIdx) {
        state.idx++;
      }
      while (blockLines.length && blockLines[blockLines.length - 1] === "") {
        blockLines.pop();
      }
      let out = folded ? blockLines.map((s) => s.trim()).join(" ") : blockLines.join("\n");
      if (!chompStrip && out.length > 0 && !folded) out += "\n";
      return out;
    };

    const applyMerge = (target, src) => {
      const list = Array.isArray(src) ? src : [src];
      for (const item of list) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          for (const [mk, mv] of Object.entries(item)) {
            if (!(mk in target)) target[mk] = deepClone(mv);
          }
        }
      }
    };

    const parseBlock = (minIndent) => {
      if (state.idx >= lines.length) return {};
      const first = lines[state.idx];
      if (first.indent < minIndent) return null;

      if (first.text === "-" || first.text.startsWith("- ")) {
        const arr = [];
        const seqIndent = first.indent;
        while (state.idx < lines.length) {
          const cur = lines[state.idx];
          if (cur.indent < seqIndent || (cur.indent === seqIndent && !(cur.text === "-" || cur.text.startsWith("- ")))) break;
          if (cur.indent > seqIndent) {
            state.idx++;
            continue;
          }
          let rest = cur.text.slice(1).trim();
          let anchorName = null;
          if (rest.startsWith("&")) {
            const am = rest.match(/^&([A-Za-z0-9_-]+)\s*(.*)$/);
            if (am) {
              anchorName = am[1];
              rest = am[2];
            }
          }
          state.idx++;
          let val;
          if (BLOCK_SCALAR_RE.test(rest)) {
            val = readBlockScalar(cur.indent, rest, cur.lineNo);
          } else if (!rest) {
            val = state.idx < lines.length && lines[state.idx].indent > seqIndent ? parseBlock(lines[state.idx].indent) : null;
          } else {
            const ci = this._findYamlColon(rest);
            if (ci !== -1) {
              const inlineItem = parseKeyVal(rest, cur.indent + 2, cur.lineNo);
              if (state.idx < lines.length && lines[state.idx].indent > seqIndent && !(lines[state.idx].indent === seqIndent && lines[state.idx].text.startsWith("- "))) {
                const extra = parseBlock(lines[state.idx].indent);
                if (extra && typeof extra === "object" && !Array.isArray(extra)) Object.assign(inlineItem, extra);
              }
              val = inlineItem;
            } else {
              val = parseScalar(rest);
            }
          }
          if (anchorName) anchors.set(anchorName, val);
          arr.push(val);
        }
        return arr;
      }

      const map = {};
      const mapIndent = first.indent;
      while (state.idx < lines.length) {
        const cur = lines[state.idx];
        if (cur.indent < mapIndent || (cur.indent === mapIndent && (cur.text === "-" || cur.text.startsWith("- ")))) break;
        if (cur.indent > mapIndent) {
          state.idx++;
          continue;
        }
        state.idx++;
        const entry = parseKeyVal(cur.text, mapIndent, cur.lineNo);
        for (const [k, v] of Object.entries(entry)) {
          if (k === "<<") applyMerge(map, v);
          else map[k] = v;
        }
      }
      return map;
    };

    const parseKeyVal = (text, parentIndent, headerLineNo) => {
      const ci = this._findYamlColon(text);
      if (ci === -1) return {};
      let keyRaw = text.slice(0, ci).trim();
      let rest = text.slice(ci + 1).trim();
      if ((keyRaw.startsWith('"') && keyRaw.endsWith('"')) || (keyRaw.startsWith("'") && keyRaw.endsWith("'"))) {
        keyRaw = keyRaw.slice(1, -1);
      }
      let anchorName = null;
      if (rest.startsWith("&")) {
        const am = rest.match(/^&([A-Za-z0-9_-]+)\s*(.*)$/);
        if (am) {
          anchorName = am[1];
          rest = am[2];
        }
      }
      let val;
      if (BLOCK_SCALAR_RE.test(rest)) {
        val = readBlockScalar(parentIndent, rest, headerLineNo);
      } else if (!rest) {
        if (state.idx < lines.length && (lines[state.idx].indent > parentIndent || (lines[state.idx].indent === parentIndent && (lines[state.idx].text === "-" || lines[state.idx].text.startsWith("- "))))) {
          val = parseBlock(lines[state.idx].indent);
        } else {
          val = null;
        }
      } else {
        val = parseScalar(rest);
      }
      if (anchorName) anchors.set(anchorName, val);
      return { [keyRaw]: val };
    };

    return parseBlock(lines[0].indent);
  }

  _stripYamlComment(line) {
    let quote = null;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (quote) {
        if (ch === quote && line[i - 1] !== "\\") quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
        return line.slice(0, i);
      }
    }
    return line;
  }

  _findYamlColon(str) {
    let quote = null;
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (quote) {
        if (ch === quote && str[i - 1] !== "\\") quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === "[" || ch === "{") {
        depth++;
      } else if (ch === "]" || ch === "}") {
        depth--;
      } else if (ch === ":" && depth === 0 && (i + 1 === str.length || /\s/.test(str[i + 1]))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Helper: Normalize path parameters (e.g. /users/{id} -> /users/{param})
   * Eliminates false positives when a path parameter is renamed across versions.
   */
  _normalizePath(pathStr) {
    return pathStr.replace(/\{[^}]+\}/g, "{param}");
  }

  /**
   * Compare Spec A (Base / v1) against Spec B (Updated / v2)
   */
  compareSpecs(specA_raw, specB_raw) {
    const specA = this.parseSpec(specA_raw);
    const specB = this.parseSpec(specB_raw);
    const changes = [];

    const pathsA = specA.paths || {};
    const pathsB = specB.paths || {};

    // Build normalized path map for B to guard against parameter renames
    const normMapB = new Map();
    for (const rawB of Object.keys(pathsB)) {
      normMapB.set(this._normalizePath(rawB), { rawPath: rawB, item: pathsB[rawB] });
    }

    // 1. Check for removed or modified paths
    for (const [pathKeyA, pathItemA] of Object.entries(pathsA)) {
      const normA = this._normalizePath(pathKeyA);
      const matchB = normMapB.get(normA);

      if (!matchB) {
        changes.push({
          type: "PATH_REMOVED",
          severity: "BREAKING",
          path: pathKeyA,
          message: `Endpoint '${pathKeyA}' was completely removed from the API spec.`,
          details: "Client applications requesting this endpoint will receive HTTP 404 Not Found."
        });
        continue;
      }

      const pathKeyB = matchB.rawPath;
      const pathItemB = matchB.item;

      // Note if path parameter was renamed
      if (pathKeyA !== pathKeyB) {
        changes.push({
          type: "PATH_PARAM_RENAMED",
          severity: "INFO",
          path: `${pathKeyA} -> ${pathKeyB}`,
          message: `Path parameter renamed from '${pathKeyA}' to '${pathKeyB}'.`,
          details: "Normalized paths match. Generated client SDKs may need recompilation."
        });
      }

      const httpMethods = ["get", "post", "put", "delete", "patch", "options", "head"];

      for (const method of httpMethods) {
        const opA = pathItemA[method];
        const opB = pathItemB[method];

        if (opA && !opB) {
          changes.push({
            type: "METHOD_REMOVED",
            severity: "BREAKING",
            path: `${method.toUpperCase()} ${pathKeyA}`,
            message: `HTTP method ${method.toUpperCase()} removed from '${pathKeyA}'.`,
            details: `Existing callers relying on ${method.toUpperCase()} will fail with HTTP 405 Method Not Allowed.`
          });
        } else if (!opA && opB) {
          changes.push({
            type: "METHOD_ADDED",
            severity: "NON_BREAKING",
            path: `${method.toUpperCase()} ${pathKeyB}`,
            message: `New HTTP method ${method.toUpperCase()} added to '${pathKeyB}'.`,
            details: "Backward-compatible feature addition."
          });
        } else if (opA && opB) {
          // Compare Operation Details (Parameters, RequestBody, Responses)
          this._compareParameters(opA, opB, `${method.toUpperCase()} ${pathKeyA}`, changes, specA, specB);
          this._compareRequestBodies(opA, opB, `${method.toUpperCase()} ${pathKeyA}`, changes, specA, specB);
          this._compareResponses(opA, opB, `${method.toUpperCase()} ${pathKeyA}`, changes, specA, specB);
        }
      }
    }

    // 2. Check for newly added paths
    const normMapA = new Map();
    for (const rawA of Object.keys(pathsA)) {
      normMapA.set(this._normalizePath(rawA), rawA);
    }

    for (const pathKeyB of Object.keys(pathsB)) {
      const normB = this._normalizePath(pathKeyB);
      if (!normMapA.has(normB)) {
        changes.push({
          type: "PATH_ADDED",
          severity: "NON_BREAKING",
          path: pathKeyB,
          message: `New endpoint '${pathKeyB}' added.`,
          details: "Safe backward-compatible API expansion."
        });
      }
    }

    // 3. Metadata & Security Scheme Changes
    const secA = (specA.components && specA.components.securitySchemes) || specA.securityDefinitions || {};
    const secB = (specB.components && specB.components.securitySchemes) || specB.securityDefinitions || {};
    for (const schemeName of Object.keys(secA)) {
      if (!secB[schemeName]) {
        changes.push({
          type: "SECURITY_SCHEME_REMOVED",
          severity: "BREAKING",
          path: `securitySchemes.${schemeName}`,
          message: `Security scheme '${schemeName}' was removed from the specification.`,
          details: "Clients authenticating via this scheme may no longer be accepted."
        });
      }
    }

    const titleA = (specA.info && specA.info.title) || "API";
    const titleB = (specB.info && specB.info.title) || "API";
    const verA = (specA.info && specA.info.version) || "1.0.0";
    const verB = (specB.info && specB.info.version) || "1.0.0";

    if (verA !== verB) {
      changes.push({
        type: "VERSION_BUMP",
        severity: "INFO",
        path: "info.version",
        message: `API Version changed from '${verA}' to '${verB}'.`,
        details: "Semantic version update."
      });
    }

    this.diffs = changes;
    return this._computeSummary(changes, { titleA, titleB, verA, verB });
  }

  _compareParameters(opA, opB, endpoint, changes, rootA = {}, rootB = {}) {
    const resolveParams = (rawList, rootSpec) => (rawList || []).map((p) => {
      if (p && p.$ref) {
        const res = this._resolveRef(p.$ref, rootSpec, new Set());
        if (res && !res._circularRef && !res._externalRef) return res;
      }
      return p;
    }).filter((p) => p && p.name && p.in);

    const paramsA = resolveParams(opA.parameters, rootA);
    const paramsB = resolveParams(opB.parameters, rootB);

    const mapA = new Map(paramsA.map(p => [`${p.in}:${p.name}`, p]));
    const mapB = new Map(paramsB.map(p => [`${p.in}:${p.name}`, p]));

    // Check removed params or type/required mutations
    for (const [key, pA] of mapA) {
      const pB = mapB.get(key);
      if (!pB) {
        if (pA.required) {
          changes.push({
            type: "REQUIRED_PARAM_REMOVED",
            severity: "NON_BREAKING", // Relaxing requirement is non-breaking for existing callers
            path: `${endpoint} -> parameter '${pA.name}' (${pA.in})`,
            message: `Required parameter '${pA.name}' (${pA.in}) was removed.`,
            details: "Client requests sending this parameter might still be accepted or safely ignored."
          });
        }
      } else {
        // Parameter exists in both: check if made required
        if (!pA.required && pB.required) {
          changes.push({
            type: "PARAM_MADE_REQUIRED",
            severity: "BREAKING",
            path: `${endpoint} -> parameter '${pA.name}' (${pA.in})`,
            message: `Existing parameter '${pA.name}' was made REQUIRED.`,
            details: "Existing clients not sending this parameter will immediately receive HTTP 400 Bad Request."
          });
        }

        // Check Type changes (normalize 3.0 nullable / 3.1 type arrays and Swagger 2.0 type)
        const pSchemaA = pA.schema || (pA.type ? { type: pA.type } : null);
        const pSchemaB = pB.schema || (pB.type ? { type: pB.type } : null);
        const pNormA = pSchemaA ? this._normalizeSchemaType(pSchemaA) : { baseType: "any", isNullable: false };
        const pNormB = pSchemaB ? this._normalizeSchemaType(pSchemaB) : { baseType: "any", isNullable: false };
        if (pNormA.baseType !== pNormB.baseType) {
          changes.push({
            type: "PARAM_TYPE_CHANGED",
            severity: "BREAKING",
            path: `${endpoint} -> parameter '${pA.name}'`,
            message: `Parameter type changed from '${pNormA.baseType}' to '${pNormB.baseType}'.`,
            details: "Type mismatch will cause validation errors in client libraries."
          });
        }

        // Directional Asymmetry for Enums in Request parameters (scalar or array items):
        const enumA = (pSchemaA && (pSchemaA.enum || (pSchemaA.items && pSchemaA.items.enum))) || [];
        const enumB = (pSchemaB && (pSchemaB.enum || (pSchemaB.items && pSchemaB.items.enum))) || [];
        if (enumA.length > 0 && enumB.length > 0) {
          const removedEnums = enumA.filter(v => !enumB.includes(v));
          if (removedEnums.length > 0) {
            changes.push({
              type: "ENUM_VALUE_REMOVED",
              severity: "BREAKING",
              path: `${endpoint} -> parameter '${pA.name}' enum`,
              message: `Enum value(s) [${removedEnums.join(", ")}] removed from parameter '${pA.name}'.`,
              details: "Clients supplying these enum values will now trigger 400 validation failures."
            });
          }
        }
      }
    }

    // Check newly added parameters that are REQUIRED
    for (const [key, pB] of mapB) {
      if (!mapA.has(key)) {
        if (pB.required) {
          changes.push({
            type: "NEW_REQUIRED_PARAM_ADDED",
            severity: "BREAKING",
            path: `${endpoint} -> parameter '${pB.name}' (${pB.in})`,
            message: `New REQUIRED parameter '${pB.name}' (${pB.in}) was added.`,
            details: "Existing API consumers not providing this new parameter will break."
          });
        } else {
          changes.push({
            type: "OPTIONAL_PARAM_ADDED",
            severity: "NON_BREAKING",
            path: `${endpoint} -> parameter '${pB.name}' (${pB.in})`,
            message: `New optional parameter '${pB.name}' added.`,
            details: "Safe backward-compatible enhancement."
          });
        }
      }
    }
  }

  _resolveRef(ref, rootSpec, visited = new Set()) {
    if (!ref || typeof ref !== "string") return null;
    if (visited.has(ref)) {
      // Cycle Guard: return reference marker to prevent stack overflow
      return { _circularRef: ref };
    }
    visited.add(ref);

    if (ref.startsWith("http://") || ref.startsWith("https://") || !ref.startsWith("#/")) {
      return { _externalRef: ref };
    }

    const parts = ref.replace("#/", "").split("/").map(p => p.replace(/~1/g, "/").replace(/~0/g, "~"));
    let cur = rootSpec;
    for (const part of parts) {
      if (cur && typeof cur === "object") {
        cur = cur[part];
      } else {
        return null;
      }
    }
    return cur;
  }

  _compareRequestBodies(opA, opB, endpoint, changes, rootA, rootB) {
    const rbA = opA.requestBody || this._extractSwaggerBody(opA);
    const rbB = opB.requestBody || this._extractSwaggerBody(opB);

    if (!rbA && rbB && rbB.required) {
      changes.push({
        type: "NEW_REQUIRED_REQUEST_BODY",
        severity: "BREAKING",
        path: `${endpoint} -> requestBody`,
        message: "New REQUIRED request body added to endpoint.",
        details: "Existing clients omitting the request body will fail validation."
      });
      return;
    }

    if (rbA && !rbB && rbA.required) {
      changes.push({
        type: "REQUEST_BODY_REMOVED",
        severity: "NON_BREAKING",
        path: `${endpoint} -> requestBody`,
        message: "Request body was made optional or removed.",
        details: "Relaxed input constraint."
      });
      return;
    }

    if (rbA && rbB) {
      if (rbA.content && rbB.content) {
        for (const mt of Object.keys(rbA.content)) {
          if (!rbB.content[mt]) {
            changes.push({
              type: "MEDIA_TYPE_REMOVED",
              severity: "BREAKING",
              path: `${endpoint} -> requestBody.content['${mt}']`,
              message: `Accepted request media type '${mt}' was removed.`,
              details: "Clients sending payloads with this Content-Type will receive HTTP 415."
            });
          }
        }
      }
      const schemaA = this._extractBodySchema(rbA);
      const schemaB = this._extractBodySchema(rbB);
      if (schemaA && schemaB) {
        this._compareSchemas(schemaA, schemaB, `${endpoint} -> requestBody.schema`, changes, true, rootA, rootB, new Set());
      }
    }
  }

  _normalizeSchemaType(schema) {
    if (!schema) return { baseType: "object", isNullable: false };
    let raw = schema.type;
    let isNullable = Boolean(schema.nullable);
    if (Array.isArray(raw)) {
      const nonNull = raw.filter((t) => t !== "null");
      if (nonNull.length < raw.length) isNullable = true;
      raw = nonNull.slice().sort().join("|") || "any";
    }
    const baseType = raw || (schema.properties ? "object" : (schema.items ? "array" : "object"));
    return { baseType, isNullable };
  }

  _flattenSchema(schema, rootSpec, visited = new Set(), depth = 0) {
    if (!schema || depth > 12) return schema;
    let cur = schema;
    if (cur.$ref) {
      const resolved = this._resolveRef(cur.$ref, rootSpec, new Set(visited));
      if (!resolved || resolved._circularRef || resolved._externalRef) return cur;
      cur = resolved;
    }
    if (Array.isArray(cur.allOf)) {
      const merged = {
        ...cur,
        properties: { ...(cur.properties || {}) },
        required: Array.isArray(cur.required) ? [...cur.required] : []
      };
      for (const sub of cur.allOf) {
        const flatSub = this._flattenSchema(sub, rootSpec, visited, depth + 1);
        if (flatSub && typeof flatSub === "object") {
          if (!merged.type && flatSub.type) merged.type = flatSub.type;
          if (flatSub.nullable) merged.nullable = true;
          if (flatSub.properties) Object.assign(merged.properties, flatSub.properties);
          if (Array.isArray(flatSub.required)) {
            for (const r of flatSub.required) {
              if (!merged.required.includes(r)) merged.required.push(r);
            }
          }
        }
      }
      return merged;
    }
    return cur;
  }

  _extractSwaggerBody(op) {
    const params = op.parameters || [];
    const bodyParam = params.find(p => p.in === "body");
    if (!bodyParam) return null;
    return {
      required: Boolean(bodyParam.required),
      schema: bodyParam.schema
    };
  }

  _extractBodySchema(rb) {
    if (rb.schema) return rb.schema; // Swagger 2.0
    if (rb.content && rb.content["application/json"] && rb.content["application/json"].schema) {
      return rb.content["application/json"].schema; // OpenAPI 3.x
    }
    return null;
  }

  _compareSchemas(schemaA, schemaB, location, changes, isRequest = false, rootA = {}, rootB = {}, visited = new Set(), depth = 0) {
    if (depth > 30) return; // Hard recursion depth guard

    // Isolate cycle tracking per recursion branch so sibling refs never suppress each other
    const branchVisited = new Set(visited);
    const refA = (schemaA && schemaA.$ref) || null;
    const refB = (schemaB && schemaB.$ref) || null;
    if (refA || refB) {
      const refPairKey = `${refA || 'inline'}<=>${refB || 'inline'}`;
      if (branchVisited.has(refPairKey)) {
        return; // Cycle broken safely
      }
      branchVisited.add(refPairKey);
    }

    // Resolve $ref independently per spec (prevents rootA ref string colliding with rootB lookup)
    if (schemaA && schemaA.$ref) {
      const res = this._resolveRef(schemaA.$ref, rootA, new Set());
      if (res && res._circularRef) return;
      if (res && res._externalRef) {
        changes.push({
          type: "EXTERNAL_REF_SKIPPED",
          severity: "INFO",
          path: location,
          message: `External $ref pointer '${res._externalRef}' skipped in single-file mode.`,
          details: "Browser workbench evaluates self-contained specs; use local CLI for multi-file schema resolution."
        });
        return;
      }
      schemaA = res || schemaA;
    }

    if (schemaB && schemaB.$ref) {
      const res = this._resolveRef(schemaB.$ref, rootB, new Set());
      if (res && res._circularRef) return;
      if (res && res._externalRef) {
        changes.push({
          type: "EXTERNAL_REF_SKIPPED",
          severity: "INFO",
          path: location,
          message: `External $ref pointer '${res._externalRef}' skipped in single-file mode.`,
          details: "Browser workbench evaluates self-contained specs; use local CLI for multi-file schema resolution."
        });
        return;
      }
      schemaB = res || schemaB;
    }

    if (!schemaA || !schemaB) return;

    // Flatten allOf inheritance safely before checking properties
    schemaA = this._flattenSchema(schemaA, rootA, new Set());
    schemaB = this._flattenSchema(schemaB, rootB, new Set());

    // Declarative schema-rule dispatch table (Fowler Replace Conditional with Polymorphism / Rule Registry)
    const schemaRuleHandlers = [
      () => this._ruleCheckComposition(schemaA, schemaB, location, changes, isRequest),
      () => this._ruleCheckScalarTypeAndNullable(schemaA, schemaB, location, changes, isRequest),
      () => this._ruleCheckEnums(schemaA, schemaB, location, changes, isRequest)
    ];
    for (const runRule of schemaRuleHandlers) {
      if (runRule() === "STOP_SUBTREE") return;
    }

    // Object properties comparison
    const effTypeA = this._normalizeSchemaType(schemaA).baseType;
    if (effTypeA === "object" && (schemaA.properties || schemaB.properties)) {
      const propsA = schemaA.properties || {};
      const propsB = schemaB.properties || {};
      const reqA = new Set(schemaA.required || []);
      const reqB = new Set(schemaB.required || []);

      for (const [propName, propSchemaA] of Object.entries(propsA)) {
        if (!propsB[propName]) {
          if (!isRequest) {
            changes.push({
              type: "RESPONSE_PROPERTY_REMOVED",
              severity: "BREAKING",
              path: `${location}.${propName}`,
              message: `Property '${propName}' was removed from response body schema.`,
              details: "Clients relying on this response property will experience null reference errors."
            });
          } else {
            changes.push({
              type: "REQUEST_PROPERTY_REMOVED",
              severity: "NON_BREAKING",
              path: `${location}.${propName}`,
              message: `Property '${propName}' removed from request body.`,
              details: "Input requirement relaxed; existing client payloads still accepted."
            });
          }
        } else {
          const propSchemaB = propsB[propName];
          if (isRequest && !propSchemaA.readOnly && propSchemaB.readOnly) {
            changes.push({
              type: "REQUEST_PROP_MADE_READONLY",
              severity: "BREAKING",
              path: `${location}.${propName}`,
              message: `Writable request property '${propName}' was marked readOnly.`,
              details: "Clients submitting this field in requests may be rejected."
            });
          }
          if (!isRequest && !propSchemaA.writeOnly && propSchemaB.writeOnly) {
            changes.push({
              type: "RESPONSE_PROP_MADE_WRITEONLY",
              severity: "BREAKING",
              path: `${location}.${propName}`,
              message: `Response property '${propName}' was marked writeOnly.`,
              details: "Server will omit this field from responses, breaking existing readers."
            });
          }

          this._compareSchemas(propSchemaA, propSchemaB, `${location}.${propName}`, changes, isRequest, rootA, rootB, branchVisited, depth + 1);
          if (isRequest && !reqA.has(propName) && reqB.has(propName)) {
            changes.push({
              type: "REQUEST_PROP_MADE_REQUIRED",
              severity: "BREAKING",
              path: `${location}.${propName}`,
              message: `Property '${propName}' in request body was made REQUIRED.`,
              details: "Existing API callers not supplying this property will fail validation."
            });
          } else if (!isRequest && reqA.has(propName) && !reqB.has(propName)) {
            changes.push({
              type: "REQUIRED_RESPONSE_PROP_RELAXED",
              severity: "BREAKING",
              path: `${location}.${propName}`,
              message: `Required response property '${propName}' became optional.`,
              details: "Strict client SDKs expecting a guaranteed non-optional field may fail null-safety checks."
            });
          }
        }
      }

      for (const [propName, propSchemaB] of Object.entries(propsB)) {
        if (!propsA[propName]) {
          if (isRequest && reqB.has(propName)) {
            changes.push({
              type: "NEW_REQUIRED_REQUEST_PROP",
              severity: "BREAKING",
              path: `${location}.${propName}`,
              message: `New REQUIRED property '${propName}' added to request body.`,
              details: "Clients not sending this new required property will fail validation."
            });
          } else {
            changes.push({
              type: "OPTIONAL_PROPERTY_ADDED",
              severity: "NON_BREAKING",
              path: `${location}.${propName}`,
              message: `New property '${propName}' added to schema.`,
              details: "Backward-compatible schema expansion."
            });
          }
        }
      }
    }

    if (effTypeA === "array" && schemaA.items && schemaB.items) {
      this._compareSchemas(schemaA.items, schemaB.items, `${location}[]`, changes, isRequest, rootA, rootB, branchVisited, depth + 1);
    }
  }

  _compareResponses(opA, opB, endpoint, changes, rootA, rootB) {
    const resA = opA.responses || {};
    const resB = opB.responses || {};

    for (const code of Object.keys(resA)) {
      if (!resB[code]) {
        changes.push({
          type: "RESPONSE_CODE_REMOVED",
          severity: "BREAKING",
          path: `${endpoint} -> response ${code}`,
          message: `Expected response status code '${code}' was removed or replaced.`,
          details: "Client SDKs expecting this status code will fail."
        });
      } else {
        if (resA[code].content && resB[code].content) {
          for (const mt of Object.keys(resA[code].content)) {
            if (!resB[code].content[mt]) {
              changes.push({
                type: "MEDIA_TYPE_REMOVED",
                severity: "BREAKING",
                path: `${endpoint} -> response ${code}.content['${mt}']`,
                message: `Response media type '${mt}' removed from status ${code}.`,
                details: "Clients negotiating this Accept Content-Type will break."
              });
            }
          }
        }
        const schemaA = (resA[code].content && resA[code].content["application/json"] && resA[code].content["application/json"].schema) || null;
        const schemaB = (resB[code].content && resB[code].content["application/json"] && resB[code].content["application/json"].schema) || null;
        if (schemaA && schemaB) {
          this._compareSchemas(schemaA, schemaB, `${endpoint} -> response ${code}.schema`, changes, false, rootA, rootB);
        }
      }
    }

    for (const code of Object.keys(resB)) {
      if (!resA[code]) {
        changes.push({
          type: "RESPONSE_CODE_ADDED",
          severity: "NON_BREAKING",
          path: `${endpoint} -> response ${code}`,
          message: `New response status code '${code}' added.`,
          details: "Informational response addition."
        });
      }
    }
  }

  _ruleCheckComposition(schemaA, schemaB, location, changes, isRequest) {
    const dirCompat = isRequest ? "BREAKS_BACKWARD_COMPATIBILITY" : "BREAKS_FORWARD_COMPATIBILITY";
    for (const polyKey of ["oneOf", "anyOf"]) {
      const listA = Array.isArray(schemaA[polyKey]) ? schemaA[polyKey] : null;
      const listB = Array.isArray(schemaB[polyKey]) ? schemaB[polyKey] : null;
      if (listA && listB) {
        const tagOf = (s) => (s && s.$ref) || (s && s.type) || JSON.stringify(s);
        const setB = new Set(listB.map(tagOf));
        const removedVars = listA.map(tagOf).filter((t) => !setB.has(t));
        if (removedVars.length > 0) {
          changes.push({
            type: "COMPOSITION_VARIANT_REMOVED",
            severity: "BREAKING",
            compatibility: dirCompat,
            path: `${location}.${polyKey}`,
            message: `${polyKey} variant(s) [${removedVars.join(", ")}] removed from schema.`,
            details: "Clients relying on removed polymorphic union members will break."
          });
        }
      }
    }
    if (schemaA.discriminator?.propertyName && schemaB.discriminator?.propertyName &&
        schemaA.discriminator.propertyName !== schemaB.discriminator.propertyName) {
      changes.push({
        type: "DISCRIMINATOR_CHANGED",
        severity: "BREAKING",
        compatibility: dirCompat,
        path: `${location}.discriminator`,
        message: `Discriminator changed from '${schemaA.discriminator.propertyName}' to '${schemaB.discriminator.propertyName}'.`,
        details: "Polymorphic client deserialization routing will break."
      });
    }
    return "CONTINUE";
  }

  _ruleCheckScalarTypeAndNullable(schemaA, schemaB, location, changes, isRequest) {
    if ((schemaA.oneOf || schemaA.anyOf) || (schemaB.oneOf || schemaB.anyOf)) return "CONTINUE";
    const normA = this._normalizeSchemaType(schemaA);
    const normB = this._normalizeSchemaType(schemaB);

    if (normA.baseType !== normB.baseType) {
      changes.push({
        type: "SCHEMA_TYPE_CHANGED",
        severity: "BREAKING",
        compatibility: isRequest ? "BREAKS_BACKWARD_COMPATIBILITY" : "BREAKS_FORWARD_COMPATIBILITY",
        path: location,
        message: `Schema type changed from '${normA.baseType}' to '${normB.baseType}'.`,
        details: "Client deserialization will fail due to unexpected type mutation."
      });
      return "STOP_SUBTREE";
    }
    if (!isRequest && !normA.isNullable && normB.isNullable) {
      changes.push({
        type: "RESPONSE_MADE_NULLABLE",
        severity: "BREAKING",
        compatibility: "BREAKS_FORWARD_COMPATIBILITY",
        path: location,
        message: "Non-nullable response field became nullable in v2.",
        details: "Client deserializers expecting non-null value may raise null-reference exceptions."
      });
    } else if (isRequest && normA.isNullable && !normB.isNullable) {
      changes.push({
        type: "REQUEST_NULLABLE_REMOVED",
        severity: "BREAKING",
        compatibility: "BREAKS_BACKWARD_COMPATIBILITY",
        path: location,
        message: "Nullable request field no longer accepts null in v2.",
        details: "Existing clients explicitly passing null will fail server validation."
      });
    }
    return "CONTINUE";
  }

  _ruleCheckEnums(schemaA, schemaB, location, changes, isRequest) {
    const enumA = schemaA.enum || [];
    const enumB = schemaB.enum || [];
    if (enumA.length > 0 && enumB.length > 0) {
      if (isRequest) {
        const removed = enumA.filter(v => !enumB.includes(v));
        if (removed.length > 0) {
          changes.push({
            type: "REQUEST_ENUM_VALUE_REMOVED",
            severity: "BREAKING",
            compatibility: "BREAKS_BACKWARD_COMPATIBILITY",
            path: `${location}.enum`,
            message: `Enum value(s) [${removed.join(", ")}] removed from request payload.`,
            details: "Client sending old enum values will be rejected."
          });
        }
      } else {
        const added = enumB.filter(v => !enumA.includes(v));
        if (added.length > 0) {
          changes.push({
            type: "RESPONSE_ENUM_EXPANDED",
            severity: "BREAKING",
            compatibility: "BREAKS_FORWARD_COMPATIBILITY",
            path: `${location}.enum`,
            message: `New enum value(s) [${added.join(", ")}] added to response payload.`,
            details: "Strict client enums with exhaustive switches may fail upon receiving an unknown variant."
          });
        }
      }
    }
    return "CONTINUE";
  }

  _computeSummary(changes, meta) {
    const annotated = changes.map((c) => {
      if (c.compatibility) return c;
      let comp = COMPATIBILITY_RULE_REGISTRY[c.type];
      if (!comp && c.type === "MEDIA_TYPE_REMOVED") {
        comp = String(c.path || "").includes("requestBody") ? "BREAKS_BACKWARD_COMPATIBILITY" : "BREAKS_FORWARD_COMPATIBILITY";
      }
      return { ...c, compatibility: comp || "INFO_METADATA" };
    });

    const breaking = annotated.filter(c => c.severity === "BREAKING");
    const nonBreaking = annotated.filter(c => c.severity === "NON_BREAKING");
    const info = annotated.filter(c => c.severity === "INFO");

    // Stability Score: Start at 100, deduct 20 per breaking change, 2 per non-breaking
    let score = 100 - (breaking.length * 20) - (nonBreaking.length * 2);
    score = Math.max(0, Math.min(100, score));

    return {
      meta,
      score,
      isBreaking: breaking.length > 0,
      breakingCount: breaking.length,
      nonBreakingCount: nonBreaking.length,
      infoCount: info.length,
      totalChanges: annotated.length,
      changes: annotated
    };
  }

  // Generate GitHub Markdown Changelog
  generateMarkdownChangelog(summary) {
    const dateStr = new Date().toISOString().split("T")[0];
    let md = `# API Drift & Breaking Change Report\n\n`;
    md += `> **API Target:** ${summary.meta.titleA} (${summary.meta.verA} ➔ ${summary.meta.verB})  \n`;
    md += `> **Audit Date:** ${dateStr}  \n`;
    md += `> **Compatibility Verdict:** ${summary.isBreaking ? "🚨 **BREAKING CHANGES DETECTED (Build Failure)**" : "🟢 **BACKWARD COMPATIBLE**"}  \n`;
    md += `> **Stability Score:** **${summary.score} / 100**  \n\n`;

    md += `## 📊 Summary of Drift\n\n`;
    md += `| Category | Count | Status |\n`;
    md += `|:---|:---:|:---|\n`;
    md += `| 🚨 **Breaking Changes** | ${summary.breakingCount} | ${summary.breakingCount > 0 ? "Requires Major SemVer Bump" : "Clean"} |\n`;
    md += `| ⚠️ **Non-Breaking Changes** | ${summary.nonBreakingCount} | Backward Compatible |\n`;
    md += `| ℹ️ **Informational Updates** | ${summary.infoCount} | Metadata |\n\n`;

    if (summary.breakingCount > 0) {
      md += `## 🚨 Critical Breaking Changes (Action Required)\n\n`;
      summary.changes.filter(c => c.severity === "BREAKING").forEach((c, i) => {
        md += `### ${i + 1}. \`${c.path}\`\n`;
        md += `- **Rule / Compatibility:** \`${c.type}\` · \`${c.compatibility || "BREAKING"}\`\n`;
        md += `- **Issue:** ${c.message}\n`;
        md += `- **Impact:** ${c.details}\n\n`;
      });
    }

    if (summary.nonBreakingCount > 0) {
      md += `## ⚠️ Non-Breaking Additions\n\n`;
      summary.changes.filter(c => c.severity === "NON_BREAKING").forEach((c, i) => {
        md += `- **\`${c.path}\`**: ${c.message}\n`;
      });
      md += `\n`;
    }

    md += `---\n*Generated automatically by API Drift Sentinel (Local-First OpenAPI Diff Engine).*`;
    return md;
  }

  // Generate SARIF v2.1.0 report for GitHub Code Scanning & CI/CD Security/Contract Gates
  generateSARIF(summary, targetUri = "openapi-v2.json") {
    const levelMap = { BREAKING: "error", NON_BREAKING: "warning", INFO: "note" };
    const rulesMap = new Map();
    const results = (summary.changes || []).map((c) => {
      if (!rulesMap.has(c.type)) {
        rulesMap.set(c.type, {
          id: c.type,
          name: c.type,
          shortDescription: { text: c.message || c.type },
          fullDescription: { text: c.details || c.message || c.type },
          defaultConfiguration: { level: levelMap[c.severity] || "note" }
        });
      }
      return {
        ruleId: c.type,
        level: levelMap[c.severity] || "note",
        message: { text: `[${c.path}] (${c.compatibility || "INFO"}) ${c.message} — ${c.details}` },
        properties: { compatibility: c.compatibility || "INFO_METADATA" },
        locations: [
          {
            physicalLocation: {
              artifactLocation: { uri: targetUri },
              region: { startLine: 1 }
            },
            logicalLocations: [{ fullyQualifiedName: c.path, kind: "member" }]
          }
        ]
      };
    });

    return JSON.stringify({
      $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "API Drift Sentinel",
              version: "1.3.0",
              informationUri: "https://mitsaken.github.io/api-drift-sentinel/",
              rules: Array.from(rulesMap.values())
            }
          },
          results
        }
      ]
    }, null, 2);
  }
}

// Global instance & exports
if (typeof window !== "undefined") {
  window.apiDriftEngine = new APIDriftEngine();
  window.SAMPLE_API_SPECS = SAMPLE_API_SPECS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { APIDriftEngine, SAMPLE_API_SPECS };
}

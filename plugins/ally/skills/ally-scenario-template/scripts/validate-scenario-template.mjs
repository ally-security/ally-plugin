#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  buildSelfTestScenario,
  validateQuestScenario,
} from "../../ally-quest-scenario/scripts/validate-quest-scenario.mjs";

const MAX_BYTES = 1024 * 1024;
const GENRES = ["Technical", "Operational", "Comms Crisis", "Executive"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const ROOT_KEYS = [
  "schema_version",
  "ownership_scope",
  "customer_organization_id",
  "evidence_notes",
  "content",
];
const CONTENT_KEYS = [
  "difficulty",
  "inspired_by_real_breach",
  "real_breach_impacted_entities",
  "real_breach_references",
  "real_breach_summary",
  "rehearsal_topics",
  "representative_scenario_id",
  "scenarios",
];

function report() {
  return { errors: [], warnings: [] };
}

function addError(result, path, message) {
  result.errors.push(`${path}: ${message}`);
}

function addWarning(result, path, message) {
  result.warnings.push(`${path}: ${message}`);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkObject(value, path, allowedKeys, requiredKeys, result) {
  if (!isRecord(value)) {
    addError(result, path, "must be an object");
    return null;
  }
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) addError(result, `${path}.${key}`, "unknown property");
  }
  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) addError(result, `${path}.${key}`, "is required");
  }
  return value;
}

function requiredString(value, path, result, options = {}) {
  if (typeof value !== "string") {
    addError(result, path, "must be a string");
    return "";
  }
  if (options.allowBlank !== true && value.trim().length === 0) addError(result, path, "must not be blank");
  if (typeof options.maxLength === "number" && value.length > options.maxLength) {
    addError(result, path, `must not exceed ${options.maxLength} characters`);
  }
  return value;
}

function arrayValue(value, path, result) {
  if (!Array.isArray(value)) {
    addError(result, path, "must be an array");
    return [];
  }
  return value;
}

function validateUniqueTextList(value, path, result, maximum, maxLength = 500) {
  const items = arrayValue(value, path, result);
  if (items.length > maximum) addError(result, path, `must contain at most ${maximum} items`);
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const text = requiredString(item, `${path}[${index}]`, result, { maxLength });
    const normalized = text.trim().toLocaleLowerCase();
    if (normalized && seen.has(normalized)) addError(result, `${path}[${index}]`, "duplicates another list item");
    seen.add(normalized);
  }
  return items;
}

function validateUrl(value, path, result) {
  const text = requiredString(value, path, result);
  if (!text) return;
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported protocol");
  } catch {
    addError(result, path, "must be an absolute HTTP(S) URL");
  }
}

function validateEntities(value, path, result) {
  const entities = arrayValue(value, path, result);
  if (entities.length > 25) addError(result, path, "must contain at most 25 entities");
  const names = new Set();
  for (const [index, item] of entities.entries()) {
    const itemPath = `${path}[${index}]`;
    const entity = checkObject(item, itemPath, ["name", "url"], ["name"], result);
    if (!entity) continue;
    const name = requiredString(entity.name, `${itemPath}.name`, result, { maxLength: 200 });
    const normalized = name.trim().toLocaleLowerCase();
    if (normalized && names.has(normalized)) addError(result, `${itemPath}.name`, "duplicates another impacted entity");
    names.add(normalized);
    if (Object.hasOwn(entity, "url")) validateUrl(entity.url, `${itemPath}.url`, result);
  }
  return entities;
}

function validateReferences(value, path, result) {
  const references = arrayValue(value, path, result);
  if (references.length > 10) addError(result, path, "must contain at most 10 references");
  const urls = new Set();
  for (const [index, item] of references.entries()) {
    const itemPath = `${path}[${index}]`;
    const reference = checkObject(item, itemPath, ["title", "url"], ["title", "url"], result);
    if (!reference) continue;
    requiredString(reference.title, `${itemPath}.title`, result, { maxLength: 200 });
    validateUrl(reference.url, `${itemPath}.url`, result);
    if (typeof reference.url === "string" && urls.has(reference.url)) addError(result, `${itemPath}.url`, "duplicates another reference URL");
    urls.add(reference.url);
  }
  return references;
}

function mergeReport(target, source) {
  target.errors.push(...source.errors);
  target.warnings.push(...source.warnings);
}

export function validateScenarioTemplate(input) {
  const result = report();
  const document = checkObject(input, "$", ROOT_KEYS, ROOT_KEYS, result);
  if (!document) return result;

  if (document.schema_version !== "v2") addError(result, "$.schema_version", "must be v2");
  if (document.ownership_scope !== "GLOBAL") addError(result, "$.ownership_scope", "must be GLOBAL for current MCP authoring");
  if (document.customer_organization_id !== null) addError(result, "$.customer_organization_id", "must be null for a global template");
  const evidenceNotes = requiredString(document.evidence_notes, "$.evidence_notes", result, { allowBlank: true, maxLength: 200000 });

  const content = checkObject(document.content, "$.content", CONTENT_KEYS, CONTENT_KEYS, result);
  if (!content) return result;
  if (!DIFFICULTIES.includes(content.difficulty)) addError(result, "$.content.difficulty", "must be Easy, Medium, or Hard");
  if (typeof content.inspired_by_real_breach !== "boolean") addError(result, "$.content.inspired_by_real_breach", "must be boolean");
  const entities = validateEntities(content.real_breach_impacted_entities, "$.content.real_breach_impacted_entities", result);
  const references = validateReferences(content.real_breach_references, "$.content.real_breach_references", result);
  const summary = requiredString(content.real_breach_summary, "$.content.real_breach_summary", result, { allowBlank: true, maxLength: 1500 });
  const rehearsalTopics = validateUniqueTextList(content.rehearsal_topics, "$.content.rehearsal_topics", result, 12, 240);
  const representativeId = requiredString(content.representative_scenario_id, "$.content.representative_scenario_id", result);

  if (content.inspired_by_real_breach === true) {
    if (!summary.trim()) addError(result, "$.content.real_breach_summary", "is required for a real-breach template");
    if (references.length === 0) addError(result, "$.content.real_breach_references", "requires at least one reference");
    if (!evidenceNotes.trim()) addError(result, "$.evidence_notes", "is required for a real-breach template");
    if (entities.length < 1 || entities.length > 10) addWarning(result, "$.content.real_breach_impacted_entities", "credible known-breach templates normally contain one to ten documented entities");
    if (references.length < 2 || references.length > 5) addWarning(result, "$.content.real_breach_references", "credible known-breach templates should contain two to five selected references");
    const sentenceMatches = summary.match(/[.!?](?:["')\]]+)?(?=\s|$)/gu);
    const sentenceCount = sentenceMatches ? sentenceMatches.length : 0;
    if (sentenceCount < 2 || sentenceCount > 4) addWarning(result, "$.content.real_breach_summary", "should contain two to four factual sentences");
  } else if (content.inspired_by_real_breach === false) {
    if (entities.length) addError(result, "$.content.real_breach_impacted_entities", "must be empty when inspired_by_real_breach is false");
    if (references.length) addError(result, "$.content.real_breach_references", "must be empty when inspired_by_real_breach is false");
    if (summary.trim()) addError(result, "$.content.real_breach_summary", "must be empty when inspired_by_real_breach is false");
  }
  if (rehearsalTopics.length < 3 || rehearsalTopics.length > 6) addWarning(result, "$.content.rehearsal_topics", "should contain three to six capability-focused topics");

  const scenarios = arrayValue(content.scenarios, "$.content.scenarios", result);
  if (scenarios.length < 1 || scenarios.length > 24) addError(result, "$.content.scenarios", "must contain one to 24 scenarios");
  const ids = new Set();
  const variants = new Set();
  for (const [index, scenario] of scenarios.entries()) {
    const scenarioPath = `$.content.scenarios[${index}]`;
    mergeReport(result, validateQuestScenario(scenario, { path: scenarioPath }));
    if (!isRecord(scenario)) continue;
    const id = typeof scenario.id === "string" ? scenario.id : "";
    const normalizedId = id.toLocaleLowerCase();
    if (normalizedId && ids.has(normalizedId)) addError(result, `${scenarioPath}.id`, "duplicates another scenario ID");
    ids.add(normalizedId);
    if (!GENRES.includes(scenario.genre_tag)) addError(result, `${scenarioPath}.genre_tag`, `must be one of: ${GENRES.join(", ")}`);
    if (!Number.isInteger(scenario.duration_minutes) || scenario.duration_minutes < 10 || scenario.duration_minutes > 240) {
      addError(result, `${scenarioPath}.duration_minutes`, "must be an integer from 10 through 240");
    }
    const variant = `${scenario.genre_tag}|${scenario.duration_minutes}`.toLocaleLowerCase();
    if (variants.has(variant)) addError(result, scenarioPath, "duplicates another genre_tag + duration_minutes variant");
    variants.add(variant);
    if (Array.isArray(scenario.injects) && scenario.injects.length > 24) {
      addError(result, `${scenarioPath}.injects`, "must contain at most 24 injects");
    }
    if (Object.hasOwn(scenario, "reference_time")) {
      const referenceTime = typeof scenario.reference_time === "string" ? scenario.reference_time : "";
      if (!/(?:[zZ]|[+-]\d{2}:\d{2})$/u.test(referenceTime) || Number.isNaN(Date.parse(referenceTime))) {
        addError(result, `${scenarioPath}.reference_time`, "must be an ISO datetime with a UTC or numeric offset");
      }
    }
    validateMediaTimeline(scenario, scenarioPath, result);
  }
  if (!scenarios.some((scenario) => isRecord(scenario) && scenario.id === representativeId)) {
    addError(result, "$.content.representative_scenario_id", "must match a scenario ID");
  }
  return result;
}

function validateMediaTimeline(scenario, scenarioPath, result) {
  const duration = Number.isInteger(scenario.duration_minutes) ? scenario.duration_minutes : null;
  if (duration === null) return;
  const groups = [
    [scenario.background_media_attachments, `${scenarioPath}.background_media_attachments`],
    ...(
      Array.isArray(scenario.injects)
        ? scenario.injects.map((inject, index) => [
            isRecord(inject) ? inject.media_attachments : [],
            `${scenarioPath}.injects[${index}].media_attachments`,
          ])
        : []
    ),
  ];
  for (const [mediaItems, mediaPath] of groups) {
    if (!Array.isArray(mediaItems)) continue;
    for (const [mediaIndex, media] of mediaItems.entries()) {
      if (!isRecord(media) || !["slack_thread", "iphone_msg"].includes(media.kind) || !Array.isArray(media.messages)) continue;
      for (const [messageIndex, message] of media.messages.entries()) {
        if (!isRecord(message) || typeof message.timedelta !== "string") continue;
        const match = /^T\+(\d+) min$/u.exec(message.timedelta);
        if (match && Number(match[1]) > duration) {
          addError(
            result,
            `${mediaPath}[${mediaIndex}].messages[${messageIndex}].timedelta`,
            "must not exceed scenario duration",
          );
        }
      }
    }
  }
}

async function loadDocument(path) {
  const source = await readFile(path, "utf8");
  if (Buffer.byteLength(source, "utf8") > MAX_BYTES) throw new Error("scenario-template document exceeds 1 MiB");
  try {
    return { source, value: JSON.parse(source) };
  } catch (jsonError) {
    try {
      const yaml = await import("yaml");
      const document = yaml.parseDocument(source, {
        customTags: [],
        merge: false,
        prettyErrors: true,
        strict: true,
        uniqueKeys: true,
        version: "1.2",
      });
      if (document.errors.length || document.warnings.length) {
        throw new Error([...document.errors, ...document.warnings].map((issue) => issue.message).join("; "));
      }
      const explicitVersion = document.directives.yaml.version;
      if (explicitVersion !== null && explicitVersion !== "1.2") {
        throw new Error("only YAML 1.2 documents are supported");
      }
      const disallowed = [];
      yaml.visit(document, {
        Alias() {
          disallowed.push("YAML aliases are not allowed");
        },
        Node(_key, node) {
          if (node.tag) disallowed.push("explicit YAML tags are not allowed");
          if ("anchor" in node && node.anchor) disallowed.push("YAML anchors are not allowed");
        },
        Pair(_key, pair) {
          if (yaml.isPair(pair) && yaml.isScalar(pair.key) && pair.key.value === "<<") {
            disallowed.push("YAML merge keys are not allowed");
          }
        },
      });
      if (disallowed.length) throw new Error([...new Set(disallowed)].join("; "));
      return { source, value: document.toJS({ maxAliasCount: 0 }) };
    } catch (yamlError) {
      const jsonMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
      const yamlMessage = yamlError instanceof Error ? yamlError.message : String(yamlError);
      throw new Error(
        `document is not JSON (${jsonMessage}) and YAML parsing is unavailable or failed (${yamlMessage}). ` +
        "Save the document as JSON (valid YAML 1.2) or install the yaml Node package locally.",
      );
    }
  }
}

function buildSelfTestTemplate() {
  const scenario = buildSelfTestScenario();
  return {
    schema_version: "v2",
    ownership_scope: "GLOBAL",
    customer_organization_id: null,
    evidence_notes: "",
    content: {
      difficulty: "Medium",
      inspired_by_real_breach: false,
      real_breach_impacted_entities: [],
      real_breach_references: [],
      real_breach_summary: "",
      rehearsal_topics: [
        "Practice incident declaration under uncertainty",
        "Coordinate containment and continuity decisions",
        "Rehearse stakeholder communications",
      ],
      representative_scenario_id: scenario.id,
      scenarios: [scenario],
    },
  };
}

function printReport(result, label, warningsAsErrors) {
  if (result.warnings.length) {
    console.warn(`Warnings (${result.warnings.length}):`);
    for (const warning of result.warnings) console.warn(`- ${warning}`);
  }
  if (result.errors.length) {
    console.error(`Errors (${result.errors.length}):`);
    for (const error of result.errors) console.error(`- ${error}`);
  }
  const failed = result.errors.length > 0 || (warningsAsErrors && result.warnings.length > 0);
  if (!failed) console.log(`Valid Ally scenario template: ${label}`);
  return !failed;
}

async function selfTest() {
  const valid = validateScenarioTemplate(buildSelfTestTemplate());
  if (valid.errors.length || valid.warnings.length) {
    throw new Error(`valid self-test fixture failed: ${JSON.stringify(valid, null, 2)}`);
  }
  const broken = buildSelfTestTemplate();
  broken.customer_organization_id = "org_example";
  const invalid = validateScenarioTemplate(broken);
  if (!invalid.errors.some((error) => error.includes("must be null"))) {
    throw new Error(`invalid self-test fixture was accepted: ${JSON.stringify(invalid, null, 2)}`);
  }
  console.log("Scenario-template validator self-test passed");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    await selfTest();
    return;
  }
  const path = args.find((arg) => !arg.startsWith("--"));
  if (!path) {
    console.error("Usage: validate-scenario-template.mjs <template.json|template.yaml> [--warnings-as-errors]");
    process.exitCode = 2;
    return;
  }
  let input;
  try {
    input = (await loadDocument(path)).value;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
    return;
  }
  const valid = printReport(validateScenarioTemplate(input), path, args.includes("--warnings-as-errors"));
  if (!valid) process.exitCode = 1;
}

const executedPath = process.argv[1];
if (executedPath && import.meta.url === pathToFileURL(executedPath).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

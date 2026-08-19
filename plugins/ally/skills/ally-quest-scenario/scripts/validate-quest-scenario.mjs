#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

const IMPACT_CATEGORIES = [
  "Brand Damage",
  "Business Disruption",
  "Financial Impact",
  "Dwell Time",
  "Data Exposure Risk",
];

const SCENARIO_KEYS = [
  "attack_narrative",
  "background",
  "background_media_attachments",
  "category_tags",
  "description",
  "duration_minutes",
  "genre_tag",
  "id",
  "injects",
  "injects_count",
  "is_recommended",
  "objectives",
  "reference_time",
  "regulatory_drivers",
  "relevant_industries",
  "roles",
  "roles_count",
  "subtitle",
  "summary",
  "title",
  "ttps",
];

const REQUIRED_SCENARIO_KEYS = SCENARIO_KEYS.filter(
  (key) => !["background", "is_recommended", "reference_time"].includes(key),
);

const INJECT_KEYS = [
  "description",
  "difficulty",
  "expected_action",
  "facilitator_guide",
  "id",
  "key_indicator",
  "media_attachments",
  "mitre_attack_ttps",
  "polls",
  "situation",
  "timedelta",
  "timedelta_situation",
  "title",
];

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
const MITRE_PATTERN = /^T\d{4}(?:\.\d{3})?$/;
const TIMEDELTA_PATTERN = /^T\+(\d+) min$/;
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

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
    if (!allowed.has(key)) {
      addError(result, `${path}.${key}`, "unknown property");
    }
  }
  for (const key of requiredKeys) {
    if (!Object.hasOwn(value, key)) {
      addError(result, `${path}.${key}`, "is required");
    }
  }
  return value;
}

function requiredString(value, path, result, options = {}) {
  if (typeof value !== "string") {
    addError(result, path, "must be a string");
    return "";
  }
  if (options.allowBlank !== true && value.trim().length === 0) {
    addError(result, path, "must not be blank");
  }
  if (typeof options.maxLength === "number" && value.length > options.maxLength) {
    addError(result, path, `must not exceed ${options.maxLength} characters`);
  }
  return value;
}

function integer(value, path, result, minimum = null, maximum = null) {
  if (!Number.isInteger(value)) {
    addError(result, path, "must be an integer");
    return null;
  }
  if (minimum !== null && value < minimum) {
    addError(result, path, `must be at least ${minimum}`);
  }
  if (maximum !== null && value > maximum) {
    addError(result, path, `must be at most ${maximum}`);
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

function stringList(value, path, result, options = {}) {
  const items = arrayValue(value, path, result);
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const text = requiredString(item, `${path}[${index}]`, result, {
      maxLength: options.maxLength,
    });
    const normalized = text.trim().toLocaleLowerCase();
    if (normalized && seen.has(normalized)) {
      addError(result, `${path}[${index}]`, "duplicates another list item");
    }
    seen.add(normalized);
  }
  if (typeof options.minimum === "number" && items.length < options.minimum) {
    addError(result, path, `must contain at least ${options.minimum} items`);
  }
  if (typeof options.maximum === "number" && items.length > options.maximum) {
    addError(result, path, `must contain at most ${options.maximum} items`);
  } else if (typeof options.maximum !== "number" && items.length > 100) {
    addError(result, path, "must contain at most 100 items");
  }
  return items;
}

function wordCount(value) {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

function sentenceCount(value) {
  const matches = value.trim().match(/[.!?](?:["')\]]+)?(?=\s|$)/gu);
  return matches ? matches.length : 0;
}

function validateIdentifier(value, path, result) {
  const text = requiredString(value, path, result, { maxLength: 200 });
  if (text && !IDENTIFIER_PATTERN.test(text)) {
    addError(
      result,
      path,
      "must begin with a letter or number and use only letters, numbers, underscores, or hyphens",
    );
  }
  return text;
}

function validateTechniqueList(value, path, result) {
  const techniques = stringList(value, path, result);
  for (const [index, technique] of techniques.entries()) {
    if (!MITRE_PATTERN.test(technique)) {
      addError(result, `${path}[${index}]`, "must match T#### or T####.###");
    }
  }
  return techniques;
}

function validateTimedelta(value, path, result) {
  const text = requiredString(value, path, result);
  const match = TIMEDELTA_PATTERN.exec(text);
  if (!match) {
    addError(result, path, "must use T+N min");
    return null;
  }
  return Number(match[1]);
}

function validateReaction(value, path, result) {
  const reaction = checkObject(value, path, ["count", "emoji"], ["emoji"], result);
  if (!reaction) {
    return;
  }
  if (Object.hasOwn(reaction, "count")) {
    integer(reaction.count, `${path}.count`, result, 1, 999);
  }
  requiredString(reaction.emoji, `${path}.emoji`, result);
}

function validateMedia(value, path, result) {
  if (!isRecord(value)) {
    addError(result, path, "must be a media object");
    return;
  }
  const kind = requiredString(value.kind, `${path}.kind`, result);
  if (kind === "email") {
    const media = checkObject(
      value,
      path,
      ["body", "from_address", "kind", "subject", "to_addresses"],
      ["body", "from_address", "kind", "subject", "to_addresses"],
      result,
    );
    if (!media) return;
    const from = requiredString(media.from_address, `${path}.from_address`, result);
    const recipients = stringList(media.to_addresses, `${path}.to_addresses`, result, { minimum: 1, maximum: 50 });
    requiredString(media.subject, `${path}.subject`, result);
    requiredString(media.body, `${path}.body`, result);
    for (const address of [from, ...recipients]) {
      if (address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(address)) {
        addError(result, path, `invalid email address ${JSON.stringify(address)}`);
      } else if (address && !address.toLocaleLowerCase().endsWith("@example.test")) {
        addWarning(result, path, "synthetic email should use the reserved example.test domain");
      }
    }
    return;
  }
  if (kind === "log") {
    const media = checkObject(value, path, ["content", "kind", "title"], ["content", "kind"], result);
    if (!media) return;
    requiredString(media.content, `${path}.content`, result);
    if (Object.hasOwn(media, "title") && media.title !== null) {
      requiredString(media.title, `${path}.title`, result);
    }
    return;
  }
  if (kind === "slack_thread") {
    const media = checkObject(value, path, ["channel", "kind", "messages"], ["kind", "messages"], result);
    if (!media) return;
    if (Object.hasOwn(media, "channel") && media.channel !== null) {
      requiredString(media.channel, `${path}.channel`, result);
    }
    const messages = arrayValue(media.messages, `${path}.messages`, result);
    if (messages.length === 0) addError(result, `${path}.messages`, "must not be empty");
    if (messages.length > 100) addError(result, `${path}.messages`, "must contain at most 100 messages");
    for (const [index, item] of messages.entries()) {
      const messagePath = `${path}.messages[${index}]`;
      const message = checkObject(
        item,
        messagePath,
        ["author", "emoji", "reactions", "text", "timedelta"],
        ["author", "reactions", "text", "timedelta"],
        result,
      );
      if (!message) continue;
      requiredString(message.author, `${messagePath}.author`, result);
      requiredString(message.text, `${messagePath}.text`, result);
      validateTimedelta(message.timedelta, `${messagePath}.timedelta`, result);
      if (Object.hasOwn(message, "emoji") && message.emoji !== null) {
        requiredString(message.emoji, `${messagePath}.emoji`, result);
      }
      const reactions = arrayValue(message.reactions, `${messagePath}.reactions`, result);
      if (reactions.length > 100) addError(result, `${messagePath}.reactions`, "must contain at most 100 reactions");
      for (const [reactionIndex, reaction] of reactions.entries()) {
        validateReaction(reaction, `${messagePath}.reactions[${reactionIndex}]`, result);
      }
    }
    return;
  }
  if (kind === "iphone_msg") {
    const media = checkObject(value, path, ["kind", "messages"], ["kind", "messages"], result);
    if (!media) return;
    const messages = arrayValue(media.messages, `${path}.messages`, result);
    if (messages.length === 0) addError(result, `${path}.messages`, "must not be empty");
    if (messages.length > 100) addError(result, `${path}.messages`, "must contain at most 100 messages");
    for (const [index, item] of messages.entries()) {
      const messagePath = `${path}.messages[${index}]`;
      const message = checkObject(item, messagePath, ["sender", "text", "timedelta"], ["sender", "text", "timedelta"], result);
      if (!message) continue;
      requiredString(message.sender, `${messagePath}.sender`, result);
      requiredString(message.text, `${messagePath}.text`, result);
      validateTimedelta(message.timedelta, `${messagePath}.timedelta`, result);
    }
    return;
  }
  if (["user_uploaded_image", "user_uploaded_pdf", "user_uploaded_video"].includes(kind)) {
    const media = checkObject(
      value,
      path,
      ["content_type", "filename", "kind", "s3_key", "view_url"],
      ["kind", "s3_key"],
      result,
    );
    if (!media) return;
    requiredString(media.s3_key, `${path}.s3_key`, result);
    for (const key of ["content_type", "filename", "view_url"]) {
      if (Object.hasOwn(media, key) && media[key] !== null) {
        const text = requiredString(media[key], `${path}.${key}`, result);
        if (key === "view_url" && text) {
          try {
            new URL(text);
          } catch {
            addError(result, `${path}.view_url`, "must be an absolute URL");
          }
        }
      }
    }
    addWarning(result, path, "preserve uploaded media references; never invent an s3_key");
    return;
  }
  if (kind === "youtube") {
    const media = checkObject(value, path, ["kind", "title", "video_id"], ["kind", "video_id"], result);
    if (!media) return;
    const id = requiredString(media.video_id, `${path}.video_id`, result);
    if (id && !YOUTUBE_ID_PATTERN.test(id)) {
      addError(result, `${path}.video_id`, "must be an 11-character YouTube video ID");
    }
    if (Object.hasOwn(media, "title") && media.title !== null) {
      requiredString(media.title, `${path}.title`, result);
    }
    return;
  }
  addError(result, `${path}.kind`, `unsupported media kind ${JSON.stringify(kind)}`);
}

function validateImpact(value, path, result) {
  const impact = checkObject(value, path, ["category", "color", "value"], ["category", "value"], result);
  if (!impact) return null;
  const category = requiredString(impact.category, `${path}.category`, result);
  if (!IMPACT_CATEGORIES.includes(category)) {
    addError(result, `${path}.category`, "is not an Ally impact category");
  }
  const impactValue = integer(impact.value, `${path}.value`, result, -100, 100);
  if (Object.hasOwn(impact, "color") && impact.color !== null) {
    requiredString(impact.color, `${path}.color`, result);
  }
  return { category, value: impactValue };
}

function validatePoll(value, path, result) {
  const poll = checkObject(value, path, ["id", "options", "question"], ["id", "options", "question"], result);
  if (!poll) return null;
  const id = validateIdentifier(poll.id, `${path}.id`, result);
  const question = requiredString(poll.question, `${path}.question`, result, { maxLength: 500 });
  if (wordCount(question) > 20) {
    addWarning(result, `${path}.question`, "should normally be 20 words or fewer");
  }
  const options = arrayValue(poll.options, `${path}.options`, result);
  const optionIds = options.map((option) => (isRecord(option) ? option.id : null));
  if (options.length !== 3 || optionIds[0] !== "A" || optionIds[1] !== "B" || optionIds[2] !== "C") {
    addError(result, `${path}.options`, "must contain ordered options A, B, C");
  }
  for (const [index, item] of options.entries()) {
    const optionPath = `${path}.options[${index}]`;
    const option = checkObject(
      item,
      optionPath,
      ["biggest_impact", "description", "id", "impacts", "title"],
      ["biggest_impact", "description", "id", "impacts", "title"],
      result,
    );
    if (!option) continue;
    requiredString(option.id, `${optionPath}.id`, result);
    const title = requiredString(option.title, `${optionPath}.title`, result);
    const description = requiredString(option.description, `${optionPath}.description`, result);
    if (wordCount(title) < 2 || wordCount(title) > 6) {
      addWarning(result, `${optionPath}.title`, "should contain two to six words");
    }
    if (wordCount(description) > 30) {
      addError(result, `${optionPath}.description`, "must not exceed 30 words");
    } else if (wordCount(description) > 18) {
      addWarning(result, `${optionPath}.description`, "should normally be 18 words or fewer");
    }
    const impacts = arrayValue(option.impacts, `${optionPath}.impacts`, result)
      .map((impact, impactIndex) => validateImpact(impact, `${optionPath}.impacts[${impactIndex}]`, result))
      .filter(Boolean);
    const categories = impacts.map((impact) => impact.category);
    if (
      impacts.length !== IMPACT_CATEGORIES.length ||
      new Set(categories).size !== IMPACT_CATEGORIES.length ||
      IMPACT_CATEGORIES.some((category) => !categories.includes(category))
    ) {
      addError(result, `${optionPath}.impacts`, "must contain each Ally impact category exactly once");
    }
    if (impacts.length > 0 && impacts.every((impact) => impact.value === 0)) {
      addError(result, `${optionPath}.impacts`, "must not be all zero");
    }
    const biggest = checkObject(
      option.biggest_impact,
      `${optionPath}.biggest_impact`,
      ["category", "value"],
      ["category", "value"],
      result,
    );
    if (biggest) {
      const category = requiredString(biggest.category, `${optionPath}.biggest_impact.category`, result);
      const value = integer(biggest.value, `${optionPath}.biggest_impact.value`, result, -100, 100);
      const matching = impacts.find((impact) => impact.category === category);
      const maximum = impacts.length ? Math.max(...impacts.map((impact) => impact.value)) : null;
      if (!matching || matching.value !== value || value !== maximum) {
        addError(result, `${optionPath}.biggest_impact`, "must match a highest-valued impact");
      }
    }
  }
  return { id, options };
}

function validateFacilitatorGuide(value, path, expectedAction, result) {
  const guide = checkObject(
    value,
    path,
    ["discussion_questions", "learning_objectives", "what_to_listen_for"],
    ["discussion_questions", "learning_objectives", "what_to_listen_for"],
    result,
  );
  if (!guide) return;
  const questions = stringList(guide.discussion_questions, `${path}.discussion_questions`, result);
  const objectives = stringList(guide.learning_objectives, `${path}.learning_objectives`, result);
  const listenFor = stringList(guide.what_to_listen_for, `${path}.what_to_listen_for`, result);
  if (questions.length !== 3) addError(result, `${path}.discussion_questions`, "must contain exactly three items");
  if (objectives.length !== 2) addError(result, `${path}.learning_objectives`, "must contain exactly two items");
  if (listenFor.length < 3 || listenFor[0] !== expectedAction) {
    addError(result, `${path}.what_to_listen_for`, "must begin with the exact expected_action and contain at least three items");
  }
}

function validateInject(value, path, result) {
  const inject = checkObject(
    value,
    path,
    INJECT_KEYS,
    INJECT_KEYS.filter((key) => key !== "timedelta_situation"),
    result,
  );
  if (!inject) return null;
  const id = validateIdentifier(inject.id, `${path}.id`, result);
  const title = requiredString(inject.title, `${path}.title`, result, { maxLength: 500 });
  const situation = requiredString(inject.situation, `${path}.situation`, result, { maxLength: 20000 });
  const description = requiredString(inject.description, `${path}.description`, result, { maxLength: 20000 });
  const expectedAction = requiredString(inject.expected_action, `${path}.expected_action`, result, { maxLength: 20000 });
  if (wordCount(title) > 7) addWarning(result, `${path}.title`, "should be seven words or fewer");
  if (sentenceCount(situation) !== 1) addWarning(result, `${path}.situation`, "should contain one sentence");
  const descriptionSentences = sentenceCount(description);
  if (descriptionSentences < 1 || descriptionSentences > 5) {
    addWarning(result, `${path}.description`, "should contain one to five concise sentences");
  }
  if (!["Easy", "Medium", "Hard"].includes(inject.difficulty)) {
    addError(result, `${path}.difficulty`, "must be Easy, Medium, or Hard");
  }
  const minute = validateTimedelta(inject.timedelta, `${path}.timedelta`, result);
  if (Object.hasOwn(inject, "timedelta_situation")) {
    requiredString(inject.timedelta_situation, `${path}.timedelta_situation`, result);
  }
  const indicators = stringList(inject.key_indicator, `${path}.key_indicator`, result);
  if (indicators.length < 1 || indicators.length > 2) {
    addError(result, `${path}.key_indicator`, "must contain one or two indicators");
  }
  const techniques = validateTechniqueList(inject.mitre_attack_ttps, `${path}.mitre_attack_ttps`, result);
  if (techniques.length > 3) addError(result, `${path}.mitre_attack_ttps`, "must contain at most three techniques");
  const media = arrayValue(inject.media_attachments, `${path}.media_attachments`, result);
  if (media.length !== 1) addError(result, `${path}.media_attachments`, "must contain exactly one artifact");
  for (const [index, item] of media.entries()) validateMedia(item, `${path}.media_attachments[${index}]`, result);
  const polls = arrayValue(inject.polls, `${path}.polls`, result);
  if (polls.length !== 1) addError(result, `${path}.polls`, "must contain exactly one decision poll");
  const validatedPolls = polls.map((poll, index) => validatePoll(poll, `${path}.polls[${index}]`, result));
  validateFacilitatorGuide(inject.facilitator_guide, `${path}.facilitator_guide`, expectedAction, result);
  return { id, minute, polls: validatedPolls.filter(Boolean), techniques };
}

export function validateQuestScenario(input, options = {}) {
  const result = report();
  const path = typeof options.path === "string" ? options.path : "$";
  const scenario = checkObject(input, path, SCENARIO_KEYS, REQUIRED_SCENARIO_KEYS, result);
  if (!scenario) return result;

  const scenarioId = validateIdentifier(scenario.id, `${path}.id`, result);
  for (const key of ["attack_narrative", "description", "genre_tag", "subtitle", "summary", "title"]) {
    requiredString(scenario[key], `${path}.${key}`, result, { maxLength: key === "title" ? 200 : 20000 });
  }
  if (Object.hasOwn(scenario, "background") && scenario.background !== null) {
    requiredString(scenario.background, `${path}.background`, result, { allowBlank: true, maxLength: 20000 });
    if (scenario.background.trim()) addWarning(result, `${path}.background`, "generator-aligned scenarios leave background empty");
  }
  if (Object.hasOwn(scenario, "is_recommended") && scenario.is_recommended !== null && typeof scenario.is_recommended !== "boolean") {
    addError(result, `${path}.is_recommended`, "must be boolean or null");
  }
  if (Object.hasOwn(scenario, "reference_time")) requiredString(scenario.reference_time, `${path}.reference_time`, result);

  const duration = integer(scenario.duration_minutes, `${path}.duration_minutes`, result, 1);
  const injectCount = integer(scenario.injects_count, `${path}.injects_count`, result, 0);
  const rolesCount = integer(scenario.roles_count, `${path}.roles_count`, result, 0);
  const categoryTags = stringList(scenario.category_tags, `${path}.category_tags`, result);
  const objectives = stringList(scenario.objectives, `${path}.objectives`, result);
  stringList(scenario.regulatory_drivers, `${path}.regulatory_drivers`, result);
  const industries = stringList(scenario.relevant_industries, `${path}.relevant_industries`, result);
  const roles = stringList(scenario.roles, `${path}.roles`, result);
  const scenarioTechniques = validateTechniqueList(scenario.ttps, `${path}.ttps`, result);
  const backgroundMedia = arrayValue(scenario.background_media_attachments, `${path}.background_media_attachments`, result);
  if (backgroundMedia.length > 1) addError(result, `${path}.background_media_attachments`, "must contain at most one artifact");
  for (const [index, item] of backgroundMedia.entries()) validateMedia(item, `${path}.background_media_attachments[${index}]`, result);

  const injects = arrayValue(scenario.injects, `${path}.injects`, result);
  if (injectCount !== null && injectCount !== injects.length) addError(result, `${path}.injects_count`, "must equal injects.length");
  if (rolesCount !== null && rolesCount !== roles.length) addError(result, `${path}.roles_count`, "must equal roles.length");
  if (injects.length < 4 || injects.length > 8) addWarning(result, `${path}.injects`, "credible tabletop scenarios usually contain four to eight injects");
  if (duration !== null && (duration < 45 || duration > 120)) addWarning(result, `${path}.duration_minutes`, "facilitated exercises usually run 45-120 minutes");
  if (objectives.length < 3 || objectives.length > 5) addWarning(result, `${path}.objectives`, "should usually contain three to five objectives");
  if (roles.length < 4 || roles.length > 10) addWarning(result, `${path}.roles`, "should usually contain four to ten roles");
  if (industries.length < 1 || industries.length > 3) addWarning(result, `${path}.relevant_industries`, "should usually contain one to three industries");
  if (categoryTags.length === 0) addWarning(result, `${path}.category_tags`, "should identify at least one useful category");
  const attackSentences = sentenceCount(scenario.attack_narrative);
  if (attackSentences < 2 || attackSentences > 6) addWarning(result, `${path}.attack_narrative`, "should contain two to six sentences");

  const injectIds = new Set();
  const pollIds = new Set();
  const injectTechniqueSet = new Set();
  let previousMinute = -1;
  const worstTotals = new Map(IMPACT_CATEGORIES.map((category) => [category, 0]));
  for (const [index, item] of injects.entries()) {
    const injectPath = `${path}.injects[${index}]`;
    const validated = validateInject(item, injectPath, result);
    if (!validated) continue;
    const normalizedId = validated.id.toLocaleLowerCase();
    if (injectIds.has(normalizedId)) addError(result, `${injectPath}.id`, "duplicates another inject ID");
    injectIds.add(normalizedId);
    if (validated.minute !== null) {
      if (index === 0 && validated.minute !== 0) addError(result, `${injectPath}.timedelta`, "the first inject must begin at T+0 min");
      if (validated.minute <= previousMinute) addError(result, `${injectPath}.timedelta`, "must increase strictly");
      if (duration !== null && validated.minute > duration) addError(result, `${injectPath}.timedelta`, "must not exceed scenario duration");
      previousMinute = validated.minute;
    }
    for (const technique of validated.techniques) injectTechniqueSet.add(technique);
    for (const poll of validated.polls) {
      const normalizedPollId = poll.id.toLocaleLowerCase();
      if (pollIds.has(normalizedPollId)) addError(result, `${injectPath}.polls[0].id`, "duplicates another poll ID");
      pollIds.add(normalizedPollId);
      for (const category of IMPACT_CATEGORIES) {
        const values = poll.options.map((option) => {
          if (!isRecord(option) || !Array.isArray(option.impacts)) return 0;
          const impact = option.impacts.find((candidate) => isRecord(candidate) && candidate.category === category);
          return isRecord(impact) && Number.isInteger(impact.value) ? impact.value : 0;
        });
        const current = worstTotals.get(category);
        worstTotals.set(category, current + Math.max(...values));
      }
    }
  }
  for (const technique of scenarioTechniques) {
    if (!injectTechniqueSet.has(technique)) addError(result, `${path}.ttps`, `${technique} is not used by any inject`);
  }
  for (const [category, total] of worstTotals.entries()) {
    if (injects.length > 0 && (total < 60 || total > 130)) {
      addWarning(result, `${path}.injects`, `${category} cumulative worst-option impact is ${total}; target 60-130`);
    }
  }
  if (!scenarioId) addError(result, `${path}.id`, "is required");
  return result;
}

function impacts(value) {
  return IMPACT_CATEGORIES.map((category) => ({ category, value }));
}

function option(id, value) {
  return {
    biggest_impact: { category: "Brand Damage", value },
    description: `Authorize response path ${id} with documented safeguards.`,
    id,
    impacts: impacts(value),
    title: `Response Path ${id}`,
  };
}

export function buildSelfTestScenario() {
  const injects = Array.from({ length: 4 }, (_, index) => {
    const number = index + 1;
    const expectedAction = "Assign an owner and approve the next response step.";
    return {
      description: "The response team confirms suspicious identity activity. The affected service scope remains uncertain.",
      difficulty: number === 1 ? "Easy" : number === 4 ? "Hard" : "Medium",
      expected_action: expectedAction,
      facilitator_guide: {
        discussion_questions: [
          "What evidence changes the response posture?",
          "Who owns the decision?",
          "Which stakeholder needs an update?",
        ],
        learning_objectives: [
          "Practice evidence-based escalation.",
          "Clarify cross-functional ownership.",
        ],
        what_to_listen_for: [
          expectedAction,
          "A named decision owner.",
          "A defined update cadence.",
        ],
      },
      id: `scenario_example_inject_${number}`,
      key_indicator: ["Unexpected identity activity"],
      media_attachments: [{ content: "Synthetic identity alert for the exercise.", kind: "log", title: "Identity alert" }],
      mitre_attack_ttps: ["T1078"],
      polls: [{
        id: `scenario_example_inject_${number}_poll_1`,
        options: [option("A", 10), option("B", 15), option("C", 20)],
        question: "Which response path should the team authorize?",
      }],
      situation: "Suspicious use of a valid account is confirmed.",
      timedelta: `T+${index * 15} min`,
      title: `Identity Signal ${number}`,
    };
  });
  return {
    attack_narrative: "An attacker obtains a valid account. The account provides access to a critical service. Suspicious activity creates containment and stakeholder pressure.",
    background: "",
    background_media_attachments: [],
    category_tags: ["Identity compromise"],
    description: "A valid account is abused to access a critical service. The team must balance containment, continuity, and communications.",
    duration_minutes: 75,
    genre_tag: "Operational",
    id: "scenario_example",
    injects,
    injects_count: injects.length,
    is_recommended: false,
    objectives: [
      "Validate incident escalation.",
      "Coordinate containment and continuity.",
      "Practice stakeholder communication.",
    ],
    regulatory_drivers: [],
    relevant_industries: ["Technology"],
    roles: ["Incident Commander", "Security Operations Lead", "Legal Counsel", "Communications Lead"],
    roles_count: 4,
    subtitle: "Valid account compromise",
    summary: "A valid account compromise creates technical and stakeholder pressure.",
    title: "Operation Example Signal",
    ttps: ["T1078"],
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
  if (!failed) console.log(`Valid Ally Quest scenario: ${label}`);
  return !failed;
}

async function selfTest() {
  const valid = validateQuestScenario(buildSelfTestScenario());
  if (valid.errors.length || valid.warnings.length) {
    throw new Error(`valid self-test fixture failed: ${JSON.stringify(valid, null, 2)}`);
  }
  const broken = buildSelfTestScenario();
  broken.injects_count = 99;
  const invalid = validateQuestScenario(broken);
  if (!invalid.errors.some((error) => error.includes("must equal injects.length"))) {
    throw new Error(`invalid self-test fixture was accepted: ${JSON.stringify(invalid, null, 2)}`);
  }
  console.log("Quest scenario validator self-test passed");
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    await selfTest();
    return;
  }
  const path = args.find((arg) => !arg.startsWith("--"));
  if (!path) {
    console.error("Usage: validate-quest-scenario.mjs <scenario.json> [--warnings-as-errors]");
    process.exitCode = 2;
    return;
  }
  let input;
  try {
    input = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to read Quest scenario JSON: ${message}`);
    process.exitCode = 2;
    return;
  }
  const valid = printReport(validateQuestScenario(input), path, args.includes("--warnings-as-errors"));
  if (!valid) process.exitCode = 1;
}

const executedPath = process.argv[1];
if (executedPath && import.meta.url === pathToFileURL(executedPath).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

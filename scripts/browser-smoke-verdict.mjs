import { createHash } from "node:crypto";
export function normalizeBodyText(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizedBodyTextHash(text) {
  return createHash("sha256").update(normalizeBodyText(text)).digest("hex");
}

const IDENTITY_PREFIX_LEN = 64;

export function bodyTextPrefix(text) {
  return normalizeBodyText(text).slice(0, IDENTITY_PREFIX_LEN);
}
export function parseSmokeArgs(argv, env = {}) {
  const positional = [];
  let baseline = env.BROWSER_SMOKE_BASELINE || "";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--baseline") {
      const value = argv[++i];
      if (!value || value.startsWith("--")) return { error: "--baseline requires a path to a prior verdict JSON" };
      baseline = value;
    } else if (arg.startsWith("--baseline=")) {
      const value = arg.slice("--baseline=".length);
      if (!value) return { error: "--baseline requires a path to a prior verdict JSON" };
      baseline = value;
    } else if (arg.startsWith("--")) {
      return { error: `unknown flag: ${arg}` };
    } else {
      positional.push(arg);
    }
  }
  if (positional.length > 2) {
    return { error: "expected at most two positional arguments: URL and screenshot path" };
  }
  return {
    url: positional[0] || "http://127.0.0.1:8080/",
    outPng: positional[1] || "/workspace/screenshots/app-builder-preview.png",
    baseline,
  };
}
export function derivedPaths(outPng) {
  const base = outPng.replace(/\.png$/i, "");
  return { mobilePng: `${base}-mobile.png`, verdictJson: `${base}.json` };
}

const TRIVIAL_LEN_DELTA = 20;
const TRIVIAL_LEN_RATIO = 0.1;
const COLLAPSE_RATIO = 0.5;
export function compareToBaseline(current, baseline) {
  if (current?.viewports == null) {
    return { divergesFromBaseline: true, reasons: ["current verdict has no viewport data"] };
  }
  if (typeof current.viewports !== "object" || Array.isArray(current.viewports)) {
    return { divergesFromBaseline: true, reasons: ["current verdict has malformed viewport data"] };
  }
  const entries = Object.entries(current.viewports);
  if (entries.length === 0) {
    return {
      divergesFromBaseline: true,
      reasons: ["current verdict has no viewport data"],
    };
  }
  const reasons = [];
  if ((baseline?.viewports != null && typeof baseline?.viewports !== "object") || Array.isArray(baseline?.viewports)) {
    return { divergesFromBaseline: true, reasons: ["baseline verdict has malformed viewport data"] };
  }
  const baseViewports = baseline?.viewports ?? {};
  for (const name of Object.keys(baseViewports)) {
    if (!Object.hasOwn(current.viewports, name)) {
      reasons.push(`${name}: viewport missing from current verdict`);
    }
  }
  for (const [name, cur] of entries) {
    if (cur === null || typeof cur !== "object" || Array.isArray(cur)) {
      reasons.push(`${name}: malformed current viewport data`);
      continue;
    }
    // Validate current evidence even when this viewport has no baseline.
    if (!Number.isInteger(cur.status) || cur.status < 200 || cur.status >= 400) {
      reasons.push(`${name}: unhealthy HTTP status ${cur.status}`);
    }
    if (!Number.isSafeInteger(cur.bodyTextLen) || cur.bodyTextLen < 0) {
      reasons.push(`${name}: malformed current body text length`);
    }
    for (const field of ["consoleErrors", "pageErrors"]) {
      if (!Array.isArray(cur[field]) || !cur[field].every((entry) => typeof entry === "string")) {
        reasons.push(`${name}: malformed current ${field} collection`);
      }
    }
    const base = Object.hasOwn(baseViewports, name) ? baseViewports[name] : undefined;
    if (base == null) {
      reasons.push(`${name}: no baseline data for this viewport`);
      continue;
    }
    if (typeof base !== "object" || Array.isArray(base)) {
      reasons.push(`${name}: malformed baseline viewport data`);
      continue;
    }
    if (cur.status !== base.status) {
      reasons.push(`${name}: HTTP status changed ${base.status} -> ${cur.status}`);
    }
    if (base.title !== undefined && cur.title !== undefined && cur.title !== base.title) {
      reasons.push(`${name}: title changed ("${base.title}" -> "${cur.title}")`);
    }
    if (base.hasCanvas && !cur.hasCanvas) {
      reasons.push(`${name}: canvas disappeared`);
    }
    if (cur.horizontalOverflow && !base.horizontalOverflow) {
      reasons.push(`${name}: horizontal overflow appeared`);
    }
    for (const field of ["consoleErrors", "pageErrors"]) {
      if (!Array.isArray(base[field]) || !base[field].every((entry) => typeof entry === "string")) {
        reasons.push(`${name}: malformed baseline ${field} collection`);
      }
    }
    const validErrorCollections = ["consoleErrors", "pageErrors"].every((field) =>
      Array.isArray(cur[field]) && cur[field].every((entry) => typeof entry === "string") &&
      Array.isArray(base[field]) && base[field].every((entry) => typeof entry === "string")
    );
    if (validErrorCollections) {
      const baseErrs = base.consoleErrors.length + base.pageErrors.length;
      const curErrs = cur.consoleErrors.length + cur.pageErrors.length;
      if (curErrs > 0 && baseErrs === 0) {
        reasons.push(`${name}: console/page errors appeared (${curErrs})`);
      }
    }
    if (!Number.isSafeInteger(cur.bodyTextLen) || cur.bodyTextLen < 0) continue;
    if (!Number.isSafeInteger(base.bodyTextLen) || base.bodyTextLen < 0) {
      reasons.push(`${name}: malformed baseline body text length`);
      continue;
    }
    const baseLen = base.bodyTextLen;
    const curLen = cur.bodyTextLen;
    if (baseLen > 0 && curLen < baseLen * COLLAPSE_RATIO) {
      reasons.push(`${name}: body text collapsed (${baseLen} -> ${curLen} chars)`);
    } else if (cur.bodyTextHash !== base.bodyTextHash) {
      if (Math.abs(curLen - baseLen) > Math.max(TRIVIAL_LEN_DELTA, baseLen * TRIVIAL_LEN_RATIO)) {
        reasons.push(`${name}: body text changed (${baseLen} -> ${curLen} chars, hash mismatch)`);
      } else if (
        base.bodyTextPrefix !== undefined &&
        cur.bodyTextPrefix !== undefined &&
        cur.bodyTextPrefix !== base.bodyTextPrefix
      ) {
        reasons.push(`${name}: body text replaced (similar length, page start changed)`);
      }
    }
  }
  return { divergesFromBaseline: reasons.length > 0, reasons };
}
export function baselineComparison(current, rawText) {
  let baseline;
  try {
    baseline = JSON.parse(rawText);
  } catch {
    return { divergesFromBaseline: true, reasons: ["baseline unreadable: invalid JSON"] };
  }
  if (
    baseline === null ||
    typeof baseline !== "object" ||
    Array.isArray(baseline) ||
    baseline.viewports === null ||
    typeof baseline.viewports !== "object" ||
    Array.isArray(baseline?.viewports) ||
    Object.keys(baseline.viewports).length === 0
  ) {
    return { divergesFromBaseline: true, reasons: ["baseline unreadable: not a verdict object"] };
  }
  return compareToBaseline(current, baseline);
}
export function exitCodeFor(viewports) {
  if (viewports === null || typeof viewports !== "object" || Array.isArray(viewports)) return 1;
  const list = Object.values(viewports);
  if (list.length === 0) return 1;
  if (list.some((v) => !Number.isInteger(v?.status) || v.status < 200 || v.status >= 400)) return 1;
  if (list.some((v) => !Number.isSafeInteger(v.bodyTextLen) || v.bodyTextLen < 0)) return 1;
  if (list.some((v) => !Array.isArray(v.consoleErrors) || !Array.isArray(v.pageErrors) || !v.consoleErrors.every((entry) => typeof entry === "string") || !v.pageErrors.every((entry) => typeof entry === "string"))) return 1;
  if (list.some((v) => v.consoleErrors.length > 0 || v.pageErrors.length > 0)) {
    return 2;
  }
  return 0;
}

export function parseBrowserSmokeTimeout(raw = "45000") {
  const value = String(raw);
  const parsed = Number(value);
  return /^[1-9][0-9]*$/.test(value) && Number.isSafeInteger(parsed) ? parsed : null;
}

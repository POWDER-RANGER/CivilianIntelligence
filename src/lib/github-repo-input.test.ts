import test from "node:test";
import assert from "node:assert/strict";
import { parseRepoInput } from "./github-repo-input";

const expected = { owner: "POWDER-RANGER", repo: "civwatch-watchtower" };

test("accepts every advertised repository form (P1-8)", () => {
  for (const input of [
    "POWDER-RANGER/civwatch-watchtower",
    "github.com/POWDER-RANGER/civwatch-watchtower",
    "https://github.com/POWDER-RANGER/civwatch-watchtower",
    "https://www.github.com/POWDER-RANGER/civwatch-watchtower/",
    "https://github.com/POWDER-RANGER/civwatch-watchtower.git",
    "git@github.com:POWDER-RANGER/civwatch-watchtower.git",
    "https://github.com/POWDER-RANGER/civwatch-watchtower/tree/main/src",
    "  github.com/POWDER-RANGER/civwatch-watchtower?tab=readme  ",
  ]) assert.deepEqual(parseRepoInput(input), expected, input);
});

test("rejects non-repository input", () => {
  for (const input of ["", "POWDER-RANGER", "https://gitlab.com/a/b", "../etc/passwd", "a/..", "owner/re po"]) {
    assert.equal(parseRepoInput(input), null, input);
  }
});

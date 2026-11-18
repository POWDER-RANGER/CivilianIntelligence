import test from "node:test";
import assert from "node:assert/strict";
import { assessDeployDrift } from "./deploy-drift.mjs";
const old = "a".repeat(40), current = "b".repeat(40);
test("matching live deployment", () => assert.equal(assessDeployDrift(current, [{status:"live",commit:{id:current}}]).ok, true));
test("stale live deployment fails closed", () => assert.deepEqual(assessDeployDrift(current, [{status:"live",commit:{id:old}}]), {ok:false,reason:"Render live commit differs from deployment branch",liveSha:old,branchSha:current}));
test("no live deployment fails closed", () => assert.equal(assessDeployDrift(current, []).ok, false));
test("missing commit fails closed", () => assert.equal(assessDeployDrift(current, [{status:"live"}]).ok, false));
test("short SHA rejected", () => assert.throws(() => assessDeployDrift("abc", [])));

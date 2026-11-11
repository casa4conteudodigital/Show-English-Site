import { test } from "node:test";
import assert from "node:assert/strict";
import { safeInternalPath } from "../lib/auth.ts";

test("auth returns to an internal path and preserves query strings", () => {
  assert.equal(safeInternalPath("/salas/123?from=invite"), "/salas/123?from=invite");
});

test("auth rejects external and protocol-relative redirects", () => {
  assert.equal(safeInternalPath("https://attacker.example"), "/salas");
  assert.equal(safeInternalPath("//attacker.example/path"), "/salas");
  assert.equal(safeInternalPath("/\\\\attacker.example"), "/salas");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { questions } from "../lib/faq.ts";
const messages = JSON.parse(readFileSync("lib/messages.json", "utf8"));
test("all five languages cover the same translation keys", () => {
  const keys = Object.keys(messages["pt-BR"]).sort();
  assert.equal(Object.keys(messages).length, 5);
  for (const [locale, dict] of Object.entries(messages)) {
    assert.deepEqual(Object.keys(dict).sort(), keys, locale);
    assert.ok(Object.values(dict).every((s) => s.length > 0));
  }
});
test("every FAQ field is translated", () => {
  for (const question of questions)
    for (const value of Object.values(question))
      for (const [locale, dict] of Object.entries(messages))
        assert.ok(dict[value], `${locale}: ${value}`);
});
test("literal interface translation keys are present", () => {
  const paths = ["components", "app/colaboradores"];
  for (const path of paths)
    for (const file of readdirSync(path).filter((f) => f.endsWith(".tsx"))) {
      const text = readFileSync(`${path}/${file}`, "utf8");
      for (const match of text.matchAll(/\bt\("([^"\n]+)"\)/g)) {
        for (const [locale, dict] of Object.entries(messages))
          assert.ok(dict[match[1]], `${locale}: ${match[1]} in ${file}`);
      }
    }
});

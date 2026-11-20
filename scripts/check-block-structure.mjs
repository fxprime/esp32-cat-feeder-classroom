import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildScopeExample, scopeDetails } from "../public/scripts/block-types.js";

const { lines, ranges } = buildScopeExample();
const required = ["function", "if", "else-if", "else", "switch", "case", "default", "block", "for", "while"];
assert.deepEqual([...ranges.keys()].sort(), required.sort());
const stack = [];
for (const [index, line] of lines.entries()) {
  if (line.edge === "open") {
    stack.push(line.scope);
    assert(line.code.endsWith("{"));
    assert.equal(ranges.get(line.scope).start, index);
  }
  assert.equal(line.scope, stack.at(-1));
  if (line.edge === "close") {
    assert(line.code.trim() === "}");
    assert.equal(ranges.get(line.scope).end, index);
    stack.pop();
  }
}
assert.equal(stack.length, 0);
const contains = (outer, inner) => ranges.get(outer).start < ranges.get(inner).start && ranges.get(outer).end > ranges.get(inner).end;
assert(contains("switch", "case"));
assert(contains("switch", "default"));
assert(contains("block", "for"));
for (const id of required) {
  for (const key of ["label", "input", "output", "example"]) assert(scopeDetails[id][key]);
}
const html = await readFile(new URL("../public/slides/lesson-brace-scope.html", import.meta.url), "utf8");
for (const id of ["scope-code", "scope-input", "scope-output", "scope-example"]) assert(html.includes(`id="${id}"`));
console.log("Scope example passed: 10 highlight ranges, nested scopes, and input/output/examples for every block.");

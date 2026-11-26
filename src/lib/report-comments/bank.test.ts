/** Unit tests for the report-comment bank (issue #40). Run with `npm test`. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BANDS, averagePercent, bandFor, parseScores, suggestComments } from "./bank.ts";

test("bands follow the WAEC-style boundaries", () => {
  assert.equal(bandFor(100), "excellent");
  assert.equal(bandFor(75), "excellent");
  assert.equal(bandFor(74.9), "very-good");
  assert.equal(bandFor(65), "very-good");
  assert.equal(bandFor(64.9), "good");
  assert.equal(bandFor(50), "good");
  assert.equal(bandFor(49.9), "fair");
  assert.equal(bandFor(40), "fair");
  assert.equal(bandFor(39.9), "needs-support");
  assert.equal(bandFor(0), "needs-support");
});

test("parses the teacher's score text and skips junk", () => {
  assert.deepEqual(parseScores("Mathematics:85/100, English: 18/20, nonsense, Art:x/10"), [
    { subject: "Mathematics", score: 85, max: 100 },
    { subject: "English", score: 18, max: 20 },
  ]);
  assert.deepEqual(parseScores(""), []);
});

test("average percentage across differently scaled scores", () => {
  assert.equal(averagePercent([{ score: 85, max: 100 }, { score: 18, max: 20 }]), 87.5);
  assert.equal(averagePercent([{ score: 5, max: 0 }]), null);
  assert.equal(averagePercent([]), null);
  assert.equal(averagePercent([{ score: 120, max: 100 }]), 100); // capped
});

test("every band has suggestions with name and subject filled in", () => {
  for (const { id } of BANDS) {
    const out = suggestComments({ name: "Adaeze Okafor", subject: "Basic Science", band: id });
    assert.ok(out.length >= 3, id);
    for (const c of out) {
      assert.doesNotMatch(c, /[{}]/, `placeholder left in: ${c}`);
      assert.match(c, /Adaeze/);
      assert.doesNotMatch(c, /Okafor/); // first name only
      assert.ok(c.length >= 20, "long enough to approve");
    }
  }
});

test("falls back gracefully on blank name or subject", () => {
  const [c] = suggestComments({ name: "  ", subject: "", band: "good" });
  assert.match(c, /This student/);
  assert.match(c, /this subject/);
});

/** Unit tests for learning-material file rules (issue #4). Run with `npm test`. */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_MATERIAL_BYTES,
  checkMaterialFile,
  isPathInScope,
  isSafeExternalUrl,
  materialStoragePath,
  safeFileName,
  storagePathOf,
} from "./files.ts";

const T = "11111111-1111-1111-1111-111111111111";
const C = "22222222-2222-2222-2222-222222222222";

test("accepts common school file types by extension", () => {
  for (const name of ["Notes.pdf", "a.DOCX", "slides.pptx", "scores.xlsx", "photo.JPG", "lesson.mp3", "clip.mp4"]) {
    assert.equal(checkMaterialFile({ name, size: 1000 }).ok, true, name);
  }
});

test("rejects unsupported types, empty files and files over the limit", () => {
  assert.equal(checkMaterialFile({ name: "virus.exe", size: 10 }).ok, false);
  assert.equal(checkMaterialFile({ name: "page.html", size: 10 }).ok, false);
  assert.equal(checkMaterialFile({ name: "noextension", size: 10 }).ok, false);
  assert.equal(checkMaterialFile({ name: "a.pdf", size: 0 }).ok, false);
  assert.equal(checkMaterialFile({ name: "a.pdf", size: MAX_MATERIAL_BYTES }).ok, true);
  assert.equal(checkMaterialFile({ name: "a.pdf", size: MAX_MATERIAL_BYTES + 1 }).ok, false);
});

test("file names are made safe for storage keys", () => {
  assert.equal(safeFileName("Chapter 5: Algebra (final).pdf"), "Chapter-5-Algebra-final.pdf");
  assert.equal(safeFileName("../../etc/passwd.pdf"), "etc-passwd.pdf");
  assert.equal(safeFileName("Àdùnní notes.docx"), "Adunni-notes.docx");
  assert.equal(safeFileName("???.pdf"), "file.pdf");
  assert.match(safeFileName("x".repeat(300) + ".pdf"), /^x{80}\.pdf$/);
});

test("storage paths live under tenant/class and pass the scope check", () => {
  const p = materialStoragePath(T, C, "My Notes.pdf", "abc123");
  assert.equal(p, `${T}/${C}/abc123-My-Notes.pdf`);
  assert.equal(isPathInScope(p, T, C), true);
  assert.equal(isPathInScope(p, T), true);
});

test("scope check refuses other schools, other classes and traversal", () => {
  const other = "33333333-3333-3333-3333-333333333333";
  assert.equal(isPathInScope(`${other}/${C}/a.pdf`, T), false);
  assert.equal(isPathInScope(`${T}/${other}/a.pdf`, T, C), false);
  assert.equal(isPathInScope(`${T}/${C}/../../${other}/a.pdf`, T, C), false);
  assert.equal(isPathInScope(`/${T}/${C}/a.pdf`, T, C), false);
  assert.equal(isPathInScope(`${T}/${C}/`, T, C), false);
  assert.equal(isPathInScope(`${T}`, T), false);
});

test("stored fileUrl distinguishes uploads from links", () => {
  assert.equal(storagePathOf(`storage:${T}/${C}/a.pdf`), `${T}/${C}/a.pdf`);
  assert.equal(storagePathOf("https://youtube.com/watch?v=x"), null);
});

test("only http(s) links are allowed", () => {
  assert.equal(isSafeExternalUrl("https://www.youtube.com/watch?v=abc"), true);
  assert.equal(isSafeExternalUrl("http://example.com/a.pdf"), true);
  assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
  assert.equal(isSafeExternalUrl("data:text/html,<script>"), false);
  assert.equal(isSafeExternalUrl("not a url"), false);
});

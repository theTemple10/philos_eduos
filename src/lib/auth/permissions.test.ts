/**
 * Permission boundaries (M2, RFC #15). The v2 schema's role CHECK imports
 * SCHOOL_ROLES from permissions.ts, so the two can't drift. These tests are the written-down
 * promise that nobody goes past their authorisation. Run with `npm test`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { PERMISSIONS, ROLE_GRANTS, SCHOOL_ROLES, scopeFor, type Permission, type SchoolRole } from "./permissions.ts";

const can = (role: SchoolRole, p: Permission) => scopeFor(role, p) !== null;

test("every grant names a real permission and a real scope", () => {
  for (const [role, grants] of Object.entries(ROLE_GRANTS)) {
    for (const [p, scope] of Object.entries(grants)) {
      assert.ok((PERMISSIONS as readonly string[]).includes(p), `${role}: unknown permission ${p}`);
      assert.ok(["school", "assigned", "children", "self"].includes(scope as string), `${role}: bad scope ${scope}`);
    }
  }
});

test("school admin holds everything school-wide, but doesn't pay fees as a parent", () => {
  for (const p of PERMISSIONS) {
    assert.equal(scopeFor("school_admin", p), p === "payments:make" ? null : "school", p);
  }
});

test("only the school admin configures the school and appoints staff", () => {
  for (const role of SCHOOL_ROLES) {
    for (const p of ["school:configure", "staff:manage", "sessions:manage", "subjects:manage", "assignments:manage", "audit:read"] as const) {
      assert.equal(can(role, p), role === "school_admin", `${role} / ${p}`);
    }
  }
});

test("money: only admin and bursar manage fees; only parents pay", () => {
  for (const role of SCHOOL_ROLES) {
    assert.equal(can(role, "fees:manage"), role === "school_admin" || role === "bursar", `${role} fees:manage`);
    assert.equal(can(role, "payments:make"), role === "parent", `${role} payments:make`);
  }
  for (const role of ["teacher", "staff", "registrar", "student"] as const) {
    assert.equal(can(role, "payments:read"), false, `${role} must not see payments`);
    assert.equal(can(role, "invoices:read"), false, `${role} must not see invoices`);
  }
});

test("academic records: bursar, registrar and staff can't touch marks", () => {
  for (const role of ["bursar", "registrar", "staff"] as const) {
    for (const p of ["scores:read", "scores:write", "comments:read", "comments:write"] as const) {
      assert.equal(can(role, p), false, `${role} / ${p}`);
    }
  }
});

test("non-teaching staff see no student records", () => {
  for (const p of ["students:read", "attendance:read", "scores:read", "invoices:read"] as const) {
    assert.equal(can("staff", p), false, p);
  }
});

test("teachers are limited to their assigned classes", () => {
  for (const p of PERMISSIONS) {
    const scope = scopeFor("teacher", p);
    if (scope && p !== "announcements:read" && p !== "messages:send") {
      assert.ok(scope === "assigned" || scope === "self", `teacher ${p} is ${scope}`);
    }
  }
  assert.equal(can("teacher", "students:manage"), false);
  assert.equal(can("teacher", "fees:manage"), false);
});

test("parents reach only their children, students only themselves, read-only", () => {
  const writes = PERMISSIONS.filter((p) => /:(write|manage|configure)$/.test(p));
  for (const p of writes) {
    assert.equal(can("parent", p), false, `parent ${p}`);
    assert.equal(can("student", p), false, `student ${p}`);
  }
  for (const p of PERMISSIONS) {
    const ps = scopeFor("parent", p);
    if (ps && p !== "announcements:read" && p !== "messages:send") assert.equal(ps, "children", `parent ${p}`);
    const ss = scopeFor("student", p);
    if (ss && p !== "announcements:read" && p !== "messages:send") assert.equal(ss, "self", `student ${p}`);
  }
});

test("only admin and registrar manage students, guardians and student logins", () => {
  for (const role of SCHOOL_ROLES) {
    for (const p of ["students:manage", "guardians:manage", "credentials:manage"] as const) {
      assert.equal(can(role, p), role === "school_admin" || role === "registrar", `${role} / ${p}`);
    }
  }
});

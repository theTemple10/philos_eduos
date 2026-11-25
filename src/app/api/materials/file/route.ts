import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { students, studyMaterials } from "@/lib/db/schema";
import { requireTenantMember } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MATERIALS_BUCKET,
  isPathInScope,
  isSafeExternalUrl,
  storagePathOf,
} from "@/lib/materials/files";

/**
 * Open a learning material: GET /api/materials/file?id=<materialId> (#4).
 *
 * Files sit in a private bucket. After checking who is asking, we redirect
 * to a signed URL that expires in 5 minutes, so a copied link soon stops
 * working. External links (e.g. YouTube) are redirected to as they are.
 *
 * Who may open a material:
 * - school admins and teachers in the same school;
 * - a student whose class the material belongs to;
 * - a parent with a child in that class.
 * (Finer per-teacher scoping comes with the roles work, #15.)
 */
const SIGNED_URL_SECONDS = 300;

export async function GET(request: Request) {
  try {
    const result = await requireTenantMember();
    if (!result.ok) return result.response;
    const { tenantId, userId, user } = result.data;

    const id = new URL(request.url).searchParams.get("id");
    const notFound = NextResponse.json({ error: "That material could not be found." }, { status: 404 });
    if (!id) return notFound;

    const rows = await db
      .select()
      .from(studyMaterials)
      .where(and(eq(studyMaterials.id, id), eq(studyMaterials.tenantId, tenantId)))
      .limit(1);
    const material = rows[0];
    if (!material) return notFound;

    const isStaff = user.role === "admin" || user.role === "teacher";
    if (!isStaff) {
      const linked = await db
        .select({ classId: students.classId, userId: students.userId, parentId: students.parentId })
        .from(students)
        .where(and(eq(students.tenantId, tenantId), eq(students.classId, material.classId)));
      const allowed = linked.some((s) => s.userId === userId || s.parentId === userId);
      if (!allowed) return notFound;
    }

    const path = storagePathOf(material.fileUrl);
    if (!path) {
      if (!isSafeExternalUrl(material.fileUrl)) return notFound;
      return NextResponse.redirect(material.fileUrl, { status: 302 });
    }
    if (!isPathInScope(path, tenantId, material.classId)) return notFound;

    // Download name: the original name, without our random prefix.
    const downloadName = path.split("/").pop()!.replace(/^[0-9a-f]{16}-/, "");
    const { data, error } = await createAdminClient()
      .storage.from(MATERIALS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_SECONDS, { download: downloadName });
    if (error || !data?.signedUrl) {
      console.error("createSignedUrl failed", path, error);
      return NextResponse.json({ error: "That file isn't available right now." }, { status: 503 });
    }

    const res = NextResponse.redirect(data.signedUrl, { status: 302 });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (err) {
    console.error("GET /api/materials/file", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

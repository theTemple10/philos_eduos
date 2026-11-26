import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { classes, studyMaterials } from "@/lib/db/schema";
import { assertTenantResource, requireTeacherOrAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MATERIALS_BUCKET,
  STORAGE_URL_PREFIX,
  checkMaterialFile,
  isPathInScope,
  materialStoragePath,
} from "@/lib/materials/files";

/**
 * Learning-material uploads (issue #4).
 *
 * Files don't pass through this server: Vercel caps request bodies at
 * about 4.5 MB. Instead:
 *   1. POST here with the file's name, size and class. We check the user,
 *      the class and the file, then return a one-time signed upload URL for
 *      a key inside <tenant>/<class>/.
 *   2. The browser uploads straight to Supabase Storage with that token.
 *      The private bucket also enforces the size limit and MIME list.
 *   3. The browser saves the material (POST /api/materials), which checks
 *      the key's scope and that the file really exists.
 * If step 3 fails, the browser calls DELETE here so no orphan file remains.
 */

export async function POST(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const body = (await request.json().catch(() => ({}))) as {
      classId?: string;
      fileName?: string;
      fileSize?: number;
    };
    const { classId, fileName, fileSize } = body;
    if (!classId || typeof fileName !== "string" || typeof fileSize !== "number") {
      return NextResponse.json({ error: "classId, fileName and fileSize are required." }, { status: 400 });
    }

    const cls = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    const check = assertTenantResource(cls[0], result.data.tenantId, "That class");
    if (check instanceof NextResponse) return check;

    const file = checkMaterialFile({ name: fileName, size: fileSize });
    if (!file.ok) return NextResponse.json({ error: file.error }, { status: 400 });

    const path = materialStoragePath(
      result.data.tenantId,
      classId,
      fileName,
      randomBytes(8).toString("hex"),
    );
    const { data, error } = await createAdminClient()
      .storage.from(MATERIALS_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      console.error("createSignedUploadUrl failed", error);
      return NextResponse.json(
        { error: "File storage isn't available right now. Please try again." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      path: data.path,
      token: data.token,
      contentType: file.mime,
      fileType: file.label,
    });
  } catch (err) {
    console.error("POST /api/materials/upload", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/** Discard an uploaded file that never got saved as a material. */
export async function DELETE(request: Request) {
  try {
    const result = await requireTeacherOrAdmin();
    if (!result.ok) return result.response;

    const path = new URL(request.url).searchParams.get("path") ?? "";
    if (!isPathInScope(path, result.data.tenantId)) {
      return NextResponse.json({ error: "That file could not be found." }, { status: 404 });
    }

    // Never discard a file that a saved material still points to.
    const used = await db
      .select({ id: studyMaterials.id })
      .from(studyMaterials)
      .where(eq(studyMaterials.fileUrl, `${STORAGE_URL_PREFIX}${path}`))
      .limit(1);
    if (used[0]) {
      return NextResponse.json({ error: "That file belongs to a saved material." }, { status: 409 });
    }

    const { error } = await createAdminClient().storage.from(MATERIALS_BUCKET).remove([path]);
    if (error) console.error("discard upload failed", path, error);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/materials/upload", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/**
 * Rules for learning-material files (issue #4).
 *
 * Pure functions only, with no "@/" imports, so they run under `node --test`
 * (files.test.ts) and can be shared by the API routes and the browser.
 */

/** Supabase Storage bucket holding material files. Private: read via signed URLs. */
export const MATERIALS_BUCKET = "materials";

/**
 * Largest file we accept. The free Supabase plan allows up to 50 MB per file
 * and 1 GB in total, so we keep single files modest. Long videos belong on
 * YouTube or Drive as links (#29).
 */
export const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;

/** `fileUrl` values of uploaded files start with this; others are links. */
export const STORAGE_URL_PREFIX = "storage:";

type Kind = { label: string; mime: string };

/** Allowed extensions → the label shown in the UI and the MIME type stored. */
export const ALLOWED_MATERIAL_TYPES: Record<string, Kind> = {
  pdf: { label: "PDF", mime: "application/pdf" },
  doc: { label: "DOC", mime: "application/msword" },
  docx: { label: "DOCX", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ppt: { label: "PPT", mime: "application/vnd.ms-powerpoint" },
  pptx: { label: "PPTX", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  xls: { label: "XLS", mime: "application/vnd.ms-excel" },
  xlsx: { label: "XLSX", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  txt: { label: "TXT", mime: "text/plain" },
  png: { label: "PNG", mime: "image/png" },
  jpg: { label: "JPG", mime: "image/jpeg" },
  jpeg: { label: "JPG", mime: "image/jpeg" },
  webp: { label: "WEBP", mime: "image/webp" },
  mp3: { label: "MP3", mime: "audio/mpeg" },
  m4a: { label: "M4A", mime: "audio/mp4" },
  mp4: { label: "MP4", mime: "video/mp4" },
};

/** For the file picker's `accept` attribute. */
export const MATERIAL_ACCEPT = Object.keys(ALLOWED_MATERIAL_TYPES)
  .map((ext) => `.${ext}`)
  .join(",");

export type UploadCheck =
  | { ok: true; ext: string; label: string; mime: string }
  | { ok: false; error: string };

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/**
 * Check a file before upload. The extension decides the type; we don't
 * trust the browser-reported MIME type. Storage also enforces the size
 * limit and MIME list on the bucket itself.
 */
export function checkMaterialFile(file: { name: string; size: number }): UploadCheck {
  const ext = extensionOf(file.name);
  const kind = ALLOWED_MATERIAL_TYPES[ext];
  if (!kind) {
    return {
      ok: false,
      error: "That file type isn't supported. Upload a PDF, Word, PowerPoint, Excel, text, image, MP3/M4A or MP4 file.",
    };
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return { ok: false, error: "That file is empty." };
  }
  if (file.size > MAX_MATERIAL_BYTES) {
    return {
      ok: false,
      error: `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 25 MB. For long videos, share a YouTube or Drive link instead.`,
    };
  }
  return { ok: true, ext, label: kind.label, mime: kind.mime };
}

/** File name made safe for a storage key: ASCII letters, digits, - _ . only. */
export function safeFileName(name: string): string {
  const ext = extensionOf(name);
  const base = (ext ? name.slice(0, -(ext.length + 1)) : name)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "") // drop accents: "Àdùnní" → "Adunni"
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${base || "file"}${ext ? `.${ext}` : ""}`;
}

/**
 * Storage key for a new upload: `<tenantId>/<classId>/<random>-<name>`.
 * The tenant and class prefix is what the server checks before it saves,
 * serves or deletes a file, so one school can never reach another's files.
 */
export function materialStoragePath(
  tenantId: string,
  classId: string,
  fileName: string,
  random: string,
): string {
  return `${tenantId}/${classId}/${random}-${safeFileName(fileName)}`;
}

/** True if `path` is a file key inside this school's (and class's) folder. */
export function isPathInScope(path: string, tenantId: string, classId?: string): boolean {
  if (!path || path.includes("..") || path.includes("//") || path.startsWith("/")) return false;
  const prefix = classId ? `${tenantId}/${classId}/` : `${tenantId}/`;
  return path.startsWith(prefix) && path.length > prefix.length;
}

/** Storage key from a stored `fileUrl`, or null when it is an external link. */
export function storagePathOf(fileUrl: string): string | null {
  return fileUrl.startsWith(STORAGE_URL_PREFIX) ? fileUrl.slice(STORAGE_URL_PREFIX.length) : null;
}

/** Only http(s) links may be saved, never `javascript:` or `data:` URLs. */
export function isSafeExternalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

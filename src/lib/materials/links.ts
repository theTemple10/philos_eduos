/**
 * Where to open a learning material (#4). Always through our access check,
 * never a raw storage URL; the route redirects to a short-lived signed URL
 * or the external link.
 */
export function materialFileHref(materialId: string): string {
  return `/api/materials/file?id=${encodeURIComponent(materialId)}`;
}

/**
 * Official contact details, shown on public pages (issue #43).
 * Change them here only.
 */
export const CONTACT_EMAIL = "philoseduos@gmail.com";

/** WhatsApp number in international format, digits only (for wa.me links). */
export const WHATSAPP_NUMBER = "2348111312706";

/** The same number, formatted for display. */
export const WHATSAPP_DISPLAY = "+234 811 131 2706";

/** wa.me link that opens a chat with a pre-filled message. */
export function whatsappLink(
  message = "Hello Philos EduOS, I'd like to bring Philos to my school.",
): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

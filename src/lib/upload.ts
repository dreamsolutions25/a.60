export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function imageUploadError(file: { type: string; size: number }) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Please choose a JPG, PNG, or WebP image";
  if (file.size > MAX_IMAGE_BYTES) return "Each photograph must be smaller than 8 MB";
  return null;
}

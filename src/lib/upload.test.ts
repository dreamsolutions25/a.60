import { describe, expect, it } from "vitest";
import { imageUploadError, MAX_IMAGE_BYTES } from "./upload";

describe("photograph uploads", () => {
  it("accepts JPG, PNG, and WebP images up to 8 MB", () => {
    expect(imageUploadError({ type: "image/jpeg", size: MAX_IMAGE_BYTES })).toBeNull();
    expect(imageUploadError({ type: "image/png", size: 1000 })).toBeNull();
    expect(imageUploadError({ type: "image/webp", size: 1000 })).toBeNull();
  });

  it("rejects other file types", () => {
    expect(imageUploadError({ type: "image/gif", size: 1000 })).toBe("Please choose a JPG, PNG, or WebP image");
    expect(imageUploadError({ type: "application/pdf", size: 1000 })).toBe("Please choose a JPG, PNG, or WebP image");
  });

  it("rejects images larger than 8 MB", () => {
    expect(imageUploadError({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toBe("Each photograph must be smaller than 8 MB");
  });
});

// Downscale a photo in the browser before upload so phones don't send multi-MB camera files.
// Returns the original file if it's not an image, already small, or can't be decoded (e.g. HEIC).
export default async function compressImage(file, { maxDim = 1600, quality = 0.8, minBytes = 300 * 1024 } = {}) {
  if (!file || !file.type?.startsWith("image/") || file.type === "image/gif" || file.size < minBytes) {
    return file;
  }

  try {
    const bitmap = await loadImage(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch (e) {
    console.warn("Image compression failed, uploading original", e);
    return file;
  }
}

async function loadImage(file) {
  // createImageBitmap applies EXIF orientation, so portrait phone photos stay upright.
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" });
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

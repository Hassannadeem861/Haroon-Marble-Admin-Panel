/**
 * compressImage(file)
 * ---------------------------------------------------------------
 * Mobile camera ki 3-5MB photo ko upload se pehle browser mein hi chhota karta hai
 * (max 1600px, WebP ~0.8 quality → aam tor par 150-400KB). Wajah:
 *   - backend Vercel par hai jahan poori request 4.5MB se bari nahi ho sakti
 *   - mobile data aur upload time bachta hai
 * Final compression (1200px WebP) backend/Cloudinary karta hai.
 * Photo ki orientation (EXIF) sahi rakhi jati hai taake photo ghoomi hui na aaye.
 */
const MAX_DIMENSION = 1600;
const QUALITY = 0.8;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const loadBitmap = async (file) => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // purane browsers — neeche <img> fallback
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Ye photo khul nahi saki. JPG, PNG ya WEBP photo lagayen."));
    };
    img.src = url;
  });
};

const canvasToBlob = (canvas, type) =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, QUALITY));

export const compressImage = async (file) => {
  const bitmap = await loadBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (typeof bitmap.close === "function") bitmap.close();

  // Kuch purane Safari WebP encode nahi karte (PNG de dete hain) — tab JPEG.
  let blob = await canvasToBlob(canvas, "image/webp");
  if (!blob || blob.type !== "image/webp") blob = await canvasToBlob(canvas, "image/jpeg");
  if (!blob) throw new Error("Photo process nahi ho saki. Dobara koshish karein.");

  // Agar original already chhoti aur supported thi aur compress se bari ho gayi, original hi bhejo.
  if (blob.size >= file.size && ALLOWED_IMAGE_TYPES.includes(file.type)) return file;

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `photo-${Date.now()}.${extension}`, { type: blob.type });
};

/**
 * Image optimization utilities for Supabase Storage
 * Adds automatic image transformation and compression
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
}

/**
 * Optimizes Supabase Storage image URLs with transformation parameters
 * @param url - Original Supabase storage URL
 * @param options - Transformation options
 * @returns Optimized URL with transformation parameters
 */
export function optimizeSupabaseImage(
  url: string | null | undefined,
  options: ImageTransformOptions = {},
): string | null {
  if (!url) return null;

  // Only process Supabase storage URLs
  if (!url.includes("supabase.co/storage")) return url;

  const { width, height, quality = 80, format = "webp" } = options;

  // Build transformation URL
  const urlParts = url.split("/storage/v1/object/public/");
  if (urlParts.length !== 2) return url;

  const [baseUrl, objectPath] = urlParts;
  const transformParams = new URLSearchParams();

  if (width) transformParams.append("width", width.toString());
  if (height) transformParams.append("height", height.toString());
  transformParams.append("quality", quality.toString());
  transformParams.append("format", format);

  return `${baseUrl}/storage/v1/render/image/public/${objectPath}?${transformParams.toString()}`;
}

/**
 * Generate srcset for responsive images
 * @param url - Original image URL
 * @param sizes - Array of width sizes to generate
 * @returns srcset string
 */
export function generateSrcSet(
  url: string | null | undefined,
  sizes: number[] = [320, 640, 960, 1280, 1920],
): string {
  if (!url) return "";

  return sizes
    .map((size) => {
      const optimizedUrl = optimizeSupabaseImage(url, {
        width: size,
        quality: 80,
      });
      return `${optimizedUrl} ${size}w`;
    })
    .join(", ");
}

/**
 * Preload critical images
 * @param urls - Array of image URLs to preload
 */
export function preloadImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Get optimized thumbnail size for product cards
 */
export function getProductThumbnail(
  url: string | null | undefined,
): string | null {
  return optimizeSupabaseImage(url, {
    width: 400,
    height: 400,
    quality: 85,
    format: "webp",
  });
}

/**
 * Get optimized size for hero/banner images
 */
export function getHeroImage(url: string | null | undefined): string | null {
  return optimizeSupabaseImage(url, {
    width: 1920,
    quality: 85,
    format: "webp",
  });
}

/**
 * Get optimized size for detail images
 */
export function getDetailImage(url: string | null | undefined): string | null {
  return optimizeSupabaseImage(url, {
    width: 1200,
    quality: 90,
    format: "webp",
  });
}

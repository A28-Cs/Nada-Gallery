import { Product } from '../types/product';
import { PLACEHOLDER_IMAGE } from '../config/constants';

const GOOGLE_DRIVE_FILE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function buildGoogleDriveImageUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

function extractGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim();

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'drive.google.com') {
      const filePathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      const fileId = filePathMatch?.[1] || parsed.searchParams.get('id');
      return fileId && GOOGLE_DRIVE_FILE_ID_PATTERN.test(fileId) ? fileId : null;
    }

    if (host === 'lh3.googleusercontent.com') {
      const lh3Match = parsed.pathname.match(/\/d\/([^/=]+)/);
      const fileId = lh3Match?.[1];
      return fileId && GOOGLE_DRIVE_FILE_ID_PATTERN.test(fileId) ? fileId : null;
    }

    return null;
  } catch {
    // Fall back to regex parsing for pasted or partially encoded links.
  }

  const fallbackMatch =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/[^\s#]*[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

  return fallbackMatch?.[1] || null;
}

export function normalizeImageUrl(url: string): string {
  if (!url) return url;

  const trimmed = url.trim();
  const driveFileId = extractGoogleDriveFileId(trimmed);

  return driveFileId ? buildGoogleDriveImageUrl(driveFileId) : trimmed;
}

export const normalizeProductImageUrl = normalizeImageUrl;

/**
 * Get all images for a product with backward compatibility.
 * - If `images` array exists and is non-empty, use it.
 * - Else fallback to single `image` field.
 * - If both are missing, return placeholder.
 */
export function getProductImages(product: Product | null | undefined): string[] {
  if (!product) return [PLACEHOLDER_IMAGE];

  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    return product.images
      .map(normalizeImageUrl)
      .filter((url) => url && url.trim() !== '');
  }

  if (product.image && product.image.trim() !== '') {
    return [normalizeImageUrl(product.image)];
  }

  return [PLACEHOLDER_IMAGE];
}

/**
 * Get the primary (first) image for a product.
 * Used in product cards and thumbnails.
 */
export function getProductPrimaryImage(product: Product | null | undefined): string {
  const images = getProductImages(product);
  return images[0] || PLACEHOLDER_IMAGE;
}

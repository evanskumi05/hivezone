/**
 * Cloudflare Image Resizing utility for existing images.
 * 
 * Uses Cloudflare's /cdn-cgi/image/ endpoint to resize and compress images
 * on-the-fly at the CDN edge. This works for ALL existing images stored in R2
 * without needing to re-upload or modify them.
 *
 * Requirements:
 * - The domain (cdn.hivezone.co) must be proxied through Cloudflare (orange-cloud).
 * - Image Resizing must be enabled in Cloudflare Dashboard > Speed > Optimization.
 *
 * If Image Resizing is not enabled, the function returns the original URL unchanged.
 */

const R2_DOMAIN = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || '';
// DEFAULT TO FALSE. The user must explicitly set this to 'true' in .env once they have a Pro plan.
const ENABLE_EDGE_OPTIMIZATION = process.env.NEXT_PUBLIC_ENABLE_EDGE_OPTIMIZATION === 'true';

/**
 * Transform a CDN image URL to use Cloudflare Image Resizing.
 * Returns the original URL unchanged if it's not an R2/CDN image or is a video.
 *
 * @param {string} url - Original image URL
 * @param {Object} options - Resize options
 * @param {number} options.width - Max width in pixels
 * @param {number} options.quality - Quality 1-100 (default 75)
 * @param {string} options.format - Output format: 'webp', 'avif', 'auto' (default 'auto')
 * @param {string} options.fit - Fit mode: 'contain', 'cover', 'crop', 'scale-down' (default 'scale-down')
 * @returns {string} - Optimized URL or original URL
 */
export function getOptimizedUrl(url, options = {}) {
    if (!url || typeof url !== 'string') return url;

    // Feature toggle: If Edge Optimization is disabled, skip transformation
    if (!ENABLE_EDGE_OPTIMIZATION) return url;

    // Don't optimize videos
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) return url;

    // Don't optimize non-image URLs
    if (!url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)(\?.*)?$/i) && !url.includes(R2_DOMAIN)) {
        // If it's a Supabase URL with no extension (some storage URLs), still try
        if (!url.includes('supabase.co/storage')) return url;
    }

    // Don't double-transform
    if (url.includes('/cdn-cgi/image/')) return url;

    const {
        width = 800,
        quality = 75,
        format = 'auto', // 'auto' lets Cloudflare pick webp/avif based on browser support
        fit = 'scale-down',
    } = options;

    // Build Cloudflare Image Resizing params
    const params = `width=${width},quality=${quality},format=${format},fit=${fit}`;

    // For R2 images (cdn.hivezone.co), use the /cdn-cgi/image/ path
    if (R2_DOMAIN && url.includes(R2_DOMAIN)) {
        // Extract the path after the domain
        // e.g. https://cdn.hivezone.co/avatars/user-123.jpg
        //   -> https://cdn.hivezone.co/cdn-cgi/image/width=400,quality=75,format=auto/avatars/user-123.jpg
        const domainEnd = url.indexOf(R2_DOMAIN) + R2_DOMAIN.length;
        const path = url.slice(domainEnd); // e.g. /avatars/user-123.jpg
        return `${R2_DOMAIN}/cdn-cgi/image/${params}${path}`;
    }

    // For Supabase storage images, use Supabase Image Transformations (Pro plan)
    // /storage/v1/object/public/ -> /storage/v1/render/image/public/ + ?width=X&quality=Y
    if (url.includes('supabase.co/storage/v1/object/public/')) {
        const transformed = url.replace(
            '/storage/v1/object/public/',
            '/storage/v1/render/image/public/'
        );
        const separator = transformed.includes('?') ? '&' : '?';
        return `${transformed}${separator}width=${width}&quality=${quality}`;
    }

    // Unknown origin — return as-is
    return url;
}

/**
 * Presets for common use cases.
 */

/** For feed post images (medium-large) */
export function feedImageUrl(url) {
    return getOptimizedUrl(url, { width: 800, quality: 75 });
}

/** For avatar/profile pictures (small-medium for retina support) */
export function avatarUrl(url) {
    return getOptimizedUrl(url, { width: 300, quality: 75, fit: 'cover' });
}

/** For chat attachment images */
export function chatImageUrl(url) {
    return getOptimizedUrl(url, { width: 600, quality: 70 });
}

/** For full-screen image viewer (high quality) */
export function fullImageUrl(url) {
    return getOptimizedUrl(url, { width: 1600, quality: 85 });
}

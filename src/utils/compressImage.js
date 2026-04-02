/**
 * Client-side image compression using Canvas API.
 * Compresses images before upload to drastically reduce storage and bandwidth costs.
 *
 * Industry standard: Twitter compresses to ~1500px max, Instagram to ~1080px.
 * We use 1200px for feed images and 400px for avatars.
 */

const DEFAULT_OPTIONS = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.75,      // 0-1, WebP quality. 0.75 is visually identical to raw JPEG for social feeds.
    outputType: 'image/webp',  // WebP is ~30% smaller than JPEG at same quality
};

/**
 * Compress an image File/Blob using Canvas.
 * Returns a new compressed File ready for upload.
 * Non-image files are returned as-is.
 *
 * @param {File} file - The original file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Max width in pixels (default 1200)
 * @param {number} options.maxHeight - Max height in pixels (default 1200)
 * @param {number} options.quality - Compression quality 0-1 (default 0.75)
 * @returns {Promise<File>} - Compressed file
 */
export async function compressImage(file, options = {}) {
    // Only compress images (skip videos, PDFs, docs, etc.)
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Skip GIFs (compression would remove animation)
    if (file.type === 'image/gif') {
        return file;
    }

    // Skip already-small files (under 200KB)
    if (file.size < 200 * 1024) {
        return file;
    }

    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Calculate scaled dimensions while maintaining aspect ratio
            if (width > opts.maxWidth || height > opts.maxHeight) {
                const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            // Draw to canvas at the target size
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            // Export as WebP (or fallback to JPEG if WebP not supported)
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        // Fallback: return original file if canvas export fails
                        resolve(file);
                        return;
                    }

                    // Determine file extension
                    const ext = opts.outputType === 'image/webp' ? 'webp' : 'jpg';
                    const baseName = file.name.replace(/\.[^.]+$/, '');

                    const compressedFile = new File(
                        [blob],
                        `${baseName}.${ext}`,
                        { type: opts.outputType, lastModified: Date.now() }
                    );

                    // Only use compressed version if it's actually smaller
                    if (compressedFile.size < file.size) {
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                },
                opts.outputType,
                opts.quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            // On error, return original file
            resolve(file);
        };

        img.src = url;
    });
}

/**
 * Compress for feed posts (larger, higher quality).
 */
export async function compressForFeed(file) {
    return compressImage(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.75,
    });
}

/**
 * Compress for chat attachments (medium size).
 */
export async function compressForChat(file) {
    return compressImage(file, {
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.70,
    });
}

/**
 * Compress for profile pictures / avatars (small).
 */
export async function compressForAvatar(file) {
    return compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.70,
    });
}

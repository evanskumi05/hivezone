/**
 * Platform-aware file download.
 * - Native (Capacitor): fetch → base64 → Filesystem.writeFile → Share.share
 *   This opens the native share sheet so the user can save, open, or send the file.
 * - Web: fetch → blob → anchor click (standard browser download)
 */

const getFilename = (url, fallback = 'attachment') => {
    try {
        const u = new URL(url);
        const raw = decodeURIComponent(u.pathname.split('/').pop() || '');
        // Strip the timestamp-- prefix: "1719000000000--report.pdf" → "report.pdf"
        const clean = raw.includes('--') ? raw.split('--').slice(1).join('--') : raw;

        if (!clean || /^[0-9a-f-]{36}$/i.test(clean)) return fallback;

        return clean;
    } catch {
        return fallback;
    }
};

const isNative = () =>
    typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform();

export const downloadOrShareFile = async (url, fallbackName = 'attachment') => {
    const filename = getFilename(url, fallbackName);

    if (isNative()) {
        try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const { Share } = await import('@capacitor/share');

            let path;
            const targetDirectory = Directory.Cache;

            // Use Filesystem.downloadFile if available (Capacitor 5.1+)
            if (typeof Filesystem.downloadFile === 'function') {
                try {
                    // Try to delete existing file first
                    await Filesystem.deleteFile({
                        path: filename,
                        directory: targetDirectory
                    });
                } catch (e) { /* ignore */ }

                await Filesystem.downloadFile({
                    url,
                    path: filename,
                    directory: targetDirectory,
                });
                
                const stat = await Filesystem.getUri({
                    path: filename,
                    directory: targetDirectory
                });
                path = stat.uri;
            } else {
                // Fallback for older Capacitor versions
                const res = await fetch(url);
                if (!res.ok) throw new Error('Fetch failed');
                const blob = await res.blob();

                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                const result = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: targetDirectory,
                });
                path = result.uri;
            }

            // Share using STRICTLY 'files' for local native files (no text URL confusion)
            await Share.share({
                title: filename,
                files: [path],
                dialogTitle: 'Save or share file',
            });
        } catch (error) {
            console.error('[fileDownload] Native failed:', error);
            // Final fallback: attempt to open in browser
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    } else {
        // Web: Fetch the file as a Blob to force download, especially for cross-origin (R2) URLs
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            // No target='_blank' needed for blob URLs, it triggers download directly
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the object URL to avoid memory leaks
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        } catch (error) {
            console.error('[fileDownload] Web download via fetch failed, falling back to direct link:', error);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }
};

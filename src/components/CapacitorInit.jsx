"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBar } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

export const CapacitorInit = () => {
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Register service worker for offline support on web only
        if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform()) {
            navigator.serviceWorker.register('/sw.js').catch(err =>
                console.warn('[SW] Registration failed:', err)
            );
        }

        if (!window.Capacitor?.isNativePlatform()) return;

        const initCapacitor = async () => {
            try {
                await StatusBar.setOverlaysWebView({ overlay: false });
                await StatusBar.setStyle({ style: 'LIGHT' });
                await StatusBar.setBackgroundColor({ color: '#fcf6de' });
            } catch (e) {
                console.error('CapacitorInit: StatusBar error', e);
            }
        };

        initCapacitor();

        // Handle deep links — both cold start and while app is open
        const APP_PATHS = ['/auth/', '/dashboard/', '/admin/'];

        const handleUrl = (data) => {
            try {
                const url = new URL(data.url);
                const path = url.pathname + url.search + url.hash;
                const isAppPath = APP_PATHS.some(p => url.pathname.startsWith(p));

                if (isAppPath) {
                    router.push(path);
                } else {
                    // Open website pages in the device browser
                    window.open(data.url, '_system');
                }
            } catch (e) {
                console.warn('Deep link parse error:', e);
            }
        };

        // While app is already open
        const listenerPromise = App.addListener('appUrlOpen', handleUrl);

        // Cold start — app was launched via a link
        App.getLaunchUrl().then((data) => {
            if (data?.url) handleUrl(data);
        });

        return () => {
            listenerPromise.then(l => l.remove());
        };
    }, []);

    return null;
};

export default CapacitorInit;

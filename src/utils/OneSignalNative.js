import OneSignalWeb from 'react-onesignal';

const ONESIGNAL_APP_ID = 'b9314dfb-651e-4f29-b1e9-c1f6f2300b0e';

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------

const isCapacitor = () =>
    typeof window !== 'undefined' &&
    !!window.Capacitor?.isNativePlatform?.();

const getNative = () =>
    (typeof window !== 'undefined' && window.plugins?.OneSignal) || null;

// ---------------------------------------------------------------------------
// deviceready promise — resolves once Capacitor/Cordova has loaded all plugins
// This is the standard pattern; replaces polling loops.
// ---------------------------------------------------------------------------

const deviceReadyPromise = (() => {
    if (typeof window === 'undefined') return Promise.resolve();
    return new Promise(resolve => {
        if (document.readyState === 'complete' && getNative()) {
            // Already fired (e.g. hot-reload)
            resolve();
        } else {
            document.addEventListener('deviceready', resolve, { once: true });
            // Fallback: if deviceready never fires (web env with isCapacitor false),
            // resolve after DOM content loaded so we don't block forever.
            document.addEventListener('DOMContentLoaded', () => {
                if (!isCapacitor()) resolve();
            }, { once: true });
        }
    });
})();

// ---------------------------------------------------------------------------
// Initialization — idempotent, safe to call many times
// ---------------------------------------------------------------------------

let initialized = false;

export const initOneSignal = async () => {
    if (initialized) return true;

    if (isCapacitor()) {
        // Wait for the deviceready event so window.plugins.OneSignal is available
        await deviceReadyPromise;
        const native = getNative();
        if (!native) {
            console.warn('[OneSignal] Native SDK unavailable after deviceready');
            return false;
        }
        native.initialize(ONESIGNAL_APP_ID);
        console.log('[OneSignal] Native SDK initialized');
        initialized = true;
        return true;
    } else {
        // Web — use react-onesignal
        try {
            await OneSignalWeb.init({
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true,
                notifyButton: { enable: false },
            });
            initialized = true;
            console.log('[OneSignal] Web SDK initialized');
            return true;
        } catch (e) {
            console.error('[OneSignal] Web init error:', e);
            return false;
        }
    }
};

// ---------------------------------------------------------------------------
// login / logout
// ---------------------------------------------------------------------------

export const loginOneSignal = async (externalId) => {
    await initOneSignal();
    try {
        if (isCapacitor()) {
            getNative()?.login(externalId);
        } else {
            await OneSignalWeb.login(externalId);
        }
    } catch (e) {
        console.warn('[OneSignal] login error:', e);
    }
};

export const logoutOneSignal = async () => {
    await initOneSignal();
    try {
        if (isCapacitor()) {
            getNative()?.logout();
        } else {
            await OneSignalWeb.logout();
        }
    } catch (e) {
        console.warn('[OneSignal] logout error:', e);
    }
};

// ---------------------------------------------------------------------------
// getNotificationPermissionStatus
// Always returns: 'granted' | 'denied' | 'default'
// ---------------------------------------------------------------------------

export const getNotificationPermissionStatus = async () => {
    await initOneSignal();
    try {
        if (isCapacitor()) {
            const native = getNative();
            if (!native) return 'default';

            // onesignal-cordova-plugin v5: hasPermission is a boolean PROPERTY
            const hasPermission = native.Notifications.hasPermission;
            if (hasPermission === true) return 'granted';

            // canRequestPermission: true → not yet asked, false → permanently denied
            const canRequest = native.Notifications.canRequestPermission;
            return canRequest === false ? 'denied' : 'default';
        } else {
            // Web: browser Notification API is always the source of truth
            if (typeof Notification !== 'undefined') {
                return Notification.permission; // 'granted' | 'denied' | 'default'
            }
            return 'default';
        }
    } catch (e) {
        console.error('[OneSignal] getNotificationPermissionStatus error:', e);
        return 'default';
    }
};

// ---------------------------------------------------------------------------
// requestNotificationPermission
// Always returns: 'granted' | 'denied' | 'default'
// ---------------------------------------------------------------------------

export const requestNotificationPermission = async () => {
    await initOneSignal();
    try {
        if (isCapacitor()) {
            const native = getNative();
            if (!native) return 'default';

            // v5: requestPermission(fallbackToSettings) → Promise<boolean>
            // Passing true will also open OS Settings if already denied
            const accepted = await native.Notifications.requestPermission(true);
            return accepted ? 'granted' : 'denied';
        } else {
            // Web: try OneSignal branded prompt, fall back to native browser prompt
            try {
                await OneSignalWeb.Slidedown.promptPush();
            } catch {
                if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                    await Notification.requestPermission();
                }
            }
            if (typeof Notification !== 'undefined') {
                return Notification.permission;
            }
            return 'default';
        }
    } catch (e) {
        console.error('[OneSignal] requestPermission error:', e);
        return getNotificationPermissionStatus();
    }
};

// ---------------------------------------------------------------------------
// openNotificationSettings
// On native: requestPermission(true) opens OS Settings when already denied
// On web: no OS-level settings page exists; re-prompt if possible
// ---------------------------------------------------------------------------

export const openNotificationSettings = async () => {
    await initOneSignal();
    try {
        if (isCapacitor()) {
            await getNative()?.Notifications.requestPermission(true);
        } else {
            try {
                await OneSignalWeb.Slidedown.promptPush();
            } catch { /* already granted or denied — nothing to do */ }
        }
    } catch (e) {
        console.warn('[OneSignal] openNotificationSettings error:', e);
    }
};

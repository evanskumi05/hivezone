import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = "b9314dfb-651e-4f29-b1e9-c1f6f2300b0e";
let initialized = false;
let initPromise = null;

/**
 * Returns the native OneSignal instance if available.
 */
const getNativeOneSignal = () => {
    return (typeof window !== 'undefined' && window.plugins && window.plugins.OneSignal) || null;
};

/**
 * Initializes OneSignal and returns a promise that resolves when initialization is complete.
 */
export const initOneSignal = async () => {
    if (initialized) return true;
    if (initPromise) return initPromise;

    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    initPromise = (async () => {
        if (isCapacitor) {
            try {
                // Wait for the native object to be available
                let nativeOneSignal = getNativeOneSignal();
                let attempts = 0;
                
                while (!nativeOneSignal && attempts < 50) { // Wait up to 5 seconds
                    await new Promise(r => setTimeout(r, 100));
                    nativeOneSignal = getNativeOneSignal();
                    attempts++;
                }

                if (nativeOneSignal) {
                    nativeOneSignal.initialize(ONESIGNAL_APP_ID);
                    console.log("OneSignal: Native SDK Initialized");
                    initialized = true;
                    return true;
                } else {
                    console.warn("OneSignal: Native SDK not found after timeout");
                    return false;
                }
            } catch (e) {
                console.error("OneSignal: Native Initialization Error:", e);
                return false;
            }
        } else {
            // Web OneSignal
            try {
                await OneSignal.init({
                    appId: ONESIGNAL_APP_ID,
                    allowLocalhostAsSecureOrigin: true,
                    notifyButton: {
                        enable: false,
                    },
                });
                initialized = true;
                return true;
            } catch (e) {
                console.error("OneSignal: Web Initialization Error:", e);
                return false;
            }
        }
    })();

    return initPromise;
};

export const loginOneSignal = async (externalId) => {
    await initOneSignal();
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        getNativeOneSignal()?.login(externalId);
    } else {
        await OneSignal.login(externalId);
    }
};

export const logoutOneSignal = async () => {
    await initOneSignal();
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        getNativeOneSignal()?.logout();
    } else {
        await OneSignal.logout();
    }
};

export const requestNotificationPermission = async () => {
    await initOneSignal();
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        return new Promise((resolve) => {
            const nativeOneSignal = getNativeOneSignal();
            if (nativeOneSignal) {
                // Add a timeout to prevent hanging the UI if the callback never fires
                const timeout = setTimeout(() => {
                    console.warn("OneSignal: Permission request timed out");
                    resolve(false);
                }, 10000);

                nativeOneSignal.Notifications.requestPermission(true, (accepted) => {
                    clearTimeout(timeout);
                    resolve(accepted);
                });
            } else {
                resolve(false);
            }
        });
    } else {
        return await OneSignal.Slidedown.promptPush();
    }
};

export const getNotificationPermissionStatus = async () => {
    await initOneSignal();
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        return new Promise((resolve) => {
            const nativeOneSignal = getNativeOneSignal();
            if (nativeOneSignal) {
                // Add a timeout
                const timeout = setTimeout(() => {
                    console.warn("OneSignal: Permission status check timed out");
                    resolve(false);
                }, 3000);

                try {
                    nativeOneSignal.Notifications.hasPermission((hasPermission) => {
                        clearTimeout(timeout);
                        // Ensure we return a string compatible with web if needed, 
                        // but the current UI handles boolean/string mix.
                        resolve(hasPermission ? 'granted' : 'default');
                    });
                } catch (e) {
                    clearTimeout(timeout);
                    console.error("OneSignal: hasPermission call failed", e);
                    resolve('default');
                }
            } else {
                resolve('default');
            }
        });
    } else {
        return OneSignal.Notifications.permission;
    }
};

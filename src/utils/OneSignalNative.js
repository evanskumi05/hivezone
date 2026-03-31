import OneSignal from 'react-onesignal';

const ONESIGNAL_APP_ID = "b9314dfb-651e-4f29-b1e9-c1f6f2300b0e";

export const initOneSignal = async () => {
    // Check if running in Capacitor
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        // Use Native OneSignal (Cordova Plugin via Capacitor)
        try {
            const nativeOneSignal = window.plugins.OneSignal;
            if (nativeOneSignal) {
                // Initialize Native SDK
                nativeOneSignal.initialize(ONESIGNAL_APP_ID);
                
                // Set Notification Permission (Silent - no prompt yet)
                // nativeOneSignal.Notifications.requestPermission(true);
            }
        } catch (e) {
            console.error("Native OneSignal Error:", e);
        }
    } else {
        // Use Web OneSignal
        try {
            await OneSignal.init({
                appId: ONESIGNAL_APP_ID,
                allowLocalhostAsSecureOrigin: true,
                notifyButton: {
                    enable: false, // We'll use our own UI
                },
            });
        } catch (e) {
            console.error("Web OneSignal Error:", e);
        }
    }
};

export const loginOneSignal = async (externalId) => {
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        window.plugins.OneSignal?.login(externalId);
    } else {
        await OneSignal.login(externalId);
    }
};

export const logoutOneSignal = async () => {
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        window.plugins.OneSignal?.logout();
    } else {
        await OneSignal.logout();
    }
};

export const requestNotificationPermission = async () => {
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        return new Promise((resolve) => {
            window.plugins.OneSignal?.Notifications.requestPermission(true, (accepted) => {
                resolve(accepted);
            });
        });
    } else {
        // Web prompt
        return await OneSignal.Slidedown.promptPush();
    }
};

export const getNotificationPermissionStatus = async () => {
    const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

    if (isCapacitor) {
        return new Promise((resolve) => {
            window.plugins.OneSignal?.Notifications.hasPermission((hasPermission) => {
                resolve(hasPermission);
            });
        });
    } else {
        return OneSignal.Notifications.permission;
    }
};

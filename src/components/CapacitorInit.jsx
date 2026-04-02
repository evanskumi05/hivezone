"use client";

import { useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';

export const CapacitorInit = () => {
    useEffect(() => {
        const initCapacitor = async () => {
            if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform()) {
                try {
                    // DO NOT overlay webview, allow the status bar to push content down
                    await StatusBar.setOverlaysWebView({ overlay: false });
                    
                    // Set light background style (forces dark icons like battery/wifi)
                    await StatusBar.setStyle({ style: 'LIGHT' });

                    
                    // Set background color to dashboard cream
                    await StatusBar.setBackgroundColor({ color: '#fcf6de' });


                } catch (e) {
                    console.error('CapacitorInit: Error initializing StatusBar', e);
                }
            }
        };

        initCapacitor();
    }, []);


    return null;
};

export default CapacitorInit;

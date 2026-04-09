import { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const config: CapacitorConfig = {
  appId: 'co.hivezone.app',
  appName: 'HiveZone',
  webDir: 'out',
  server: {
    url: 'https://hivezone.co',
    cleartext: true,
    errorPath: '/offline.html'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#fcf6de",
      overlaysWebView: true
    },
    Keyboard: {
      resize: KeyboardResize.None
    }
  },
  appendUserAgent: "CapacitorApp"
};

export default config;

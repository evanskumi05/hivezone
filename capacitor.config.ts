import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.hivezone.app',
  appName: 'HiveZone',
  webDir: 'out',
  server: {

    url: 'https://hivezone.co',
    cleartext: true
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
      style: "DARK",
      backgroundColor: "#fcf6de",
      overlaysWebView: false
    }


  },
  appendUserAgent: "CapacitorApp"
};

export default config;

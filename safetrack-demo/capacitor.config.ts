import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safetrack.app',
  appName: 'SafeTrack',
  webDir: 'dist', // Double check if your build folder is 'dist' or 'build'
  server: {
    androidScheme: 'https' // This helps with CORS issues on Android
  }
};

export default config;

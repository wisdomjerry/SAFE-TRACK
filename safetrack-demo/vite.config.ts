import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This forces Vite to find the correct entry point for Mapbox
      'react-map-gl': 'react-map-gl/mapbox'
    }
  }
})

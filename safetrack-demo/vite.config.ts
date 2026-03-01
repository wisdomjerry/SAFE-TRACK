import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
    resolve: {
        alias: {
              // This bypasses the '.' specifier error by pointing directly to the 
                    'react-map-gl': 'react-map-gl/dist/esm/index.js'
                        }
                          },
                            optimizeDeps: {
                                include: ['react-map-gl', 'mapbox-gl']
                                  }
                                  })
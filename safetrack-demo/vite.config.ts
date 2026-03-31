import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
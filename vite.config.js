import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Jede Version bekommt eine eigene Kennung – so merkt die installierte App, wenn es ein Update gibt
const BUILD_ID = Date.now().toString(36)

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-file',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ id: BUILD_ID }) })
      },
    },
  ],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
})

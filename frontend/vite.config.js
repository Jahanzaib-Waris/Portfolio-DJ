import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // radar parsing/scoring is shared with the Supabase Edge Functions (../supabase/functions/_shared)
    fs: { allow: ['..'] },
  },
})

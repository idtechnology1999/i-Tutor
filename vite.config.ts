import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import legacy from '@vitejs/plugin-legacy'
import { defineConfig } from 'vite'

/* Many students use older Android phones (old Chrome, or the phone maker's
   own browser). Vite's default only runs on Chrome 111+ (2023), and anything
   older showed just the plain search-engine text. These targets reach phones
   from about 2018 on; the legacy build covers the rest. */
const OLD_PHONES = ['chrome64', 'edge79', 'firefox67', 'safari12', 'ios12']

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    legacy({
      targets: ['defaults', 'chrome >= 49', 'android >= 5', 'ios >= 10', 'not dead'],
      modernTargets: ['chrome >= 64', 'edge >= 79', 'firefox >= 67', 'safari >= 12', 'ios >= 12'],
      // Newer built-ins (Array.at, Object.hasOwn, …) added where a phone lacks them.
      modernPolyfills: true,
    }),
  ],
  build: {
    cssTarget: OLD_PHONES,
  },
})

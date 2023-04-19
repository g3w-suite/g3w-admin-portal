import { defineConfig } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue2'
import envCompatible from 'vite-plugin-env-compatible';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import * as dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config()

// import { createVuePlugin } from 'vite-plugin-vue2'; // REPLACED BY: @vitejs/plugin-vue2
// import { createHtmlPlugin } from 'vite-plugin-html';
// import djangoVite from 'django-vite-plugin'

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^~/, replacement: '' },
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue' ]
  },
  plugins: [
    vue(),
    viteCommonjs(),
    envCompatible(),
    // createVuePlugin({ jsx: true }),
    // djangoVite(['frondend/main.js',]),
    // createHtmlPlugin({
    //   inject: {
    //     data: {
    //       title: 'g3w-portal'
    //     }
    //   }
    // })
  ],
  base: (process.env.NODE_ENV === 'production' ? '/static/frontend/' : './'),
  server: {
    strictPort: false,
    port: (new URL(process.env.VITE_SERVER)).port,
    origin: process.env.VITE_SERVER,
  },
  build: {
    emptyOutDir: true,
    manifest: true,
    outDir: '../static/frontend/',
    // assetsDir: 'assets',
    rollupOptions: {
      // input: [
      //   './src/main.ts'
      // ],
      output: {
        entryFileNames: `[name].js`,
        chunkFileNames: `portal-[name].js`,
        assetFileNames: `assets/[name].[ext]`
      },
    },
    sourcemap: true,
  }
})

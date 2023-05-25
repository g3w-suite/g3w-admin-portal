// import packageJson from "./package.json"
import { defineConfig, splitVendorChunkPlugin } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue'
import envCompatible from 'vite-plugin-env-compatible';
import commonjs from 'vite-plugin-commonjs';
import * as dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config()

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^~/, replacement: '' },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue' ]
  },
  // define: {
  //   "process.env.__VERSION__": packageJson.version
  // },
  plugins: [
    splitVendorChunkPlugin(),
    vue({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 2
          }
        }
      }
    }),
    commonjs(),
    envCompatible.default(),

  ],
  base: './', /* process.env.NODE_ENV === 'production' ? './static/frontend/' : './', */
  server: {
    strictPort: false,
    port: +(new URL(process.env.VITE_SERVER as string)).port,
    origin: process.env.VITE_SERVER,
  },
  build: {
    emptyOutDir: true,
    manifest: true,
    outDir: '../portal/static/frontend/',
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

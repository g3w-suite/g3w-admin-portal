// import packageJson from "./package.json"
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import path from 'path';
import vue from '@vitejs/plugin-vue'
// import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import envCompatible from 'vite-plugin-env-compatible';
import checker from 'vite-plugin-checker'
import commonjs from 'vite-plugin-commonjs';
// import * as dotenv from 'dotenv';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// dotenv.config()

/**
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ mode }) => {
  const envPrefix = ['VITE_', 'VUE_'];
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), envPrefix) };
  return {
    envPrefix,
    resolve: {
      alias: [
        { find: /^~/, replacement: '' },
        { find: '@', replacement: path.resolve(__dirname, 'src') },
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },
    // define: {
    //   "process.env.__VERSION__": packageJson.version
    // },
    plugins: [
      splitVendorChunkPlugin(),
      checker({
        typescript: true,
        overlay: {
          initialIsOpen: false,
        }
      }),
      vue({
        template: {
          compilerOptions: {
            // compatConfig: {
            //   MODE: 2
            // },
            // treat all tags with a dash as custom elements
            // isCustomElement: (tag) => tag.includes('-')
          }
        }
      }),
      // VueI18nPlugin({
      //   include: path.resolve(__dirname, './src/locale/**'), // PUT YOUR OWN PATH TO LOCALES HERE
      //   allowDynamic: true
      // }),
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
      // lib: {
      //   entry: path.resolve('./src/main.ts'),
      //   name: 'DarkModeSwitch',
      //   fileName: format => `index.${format}.js`
      // },
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
  }
})

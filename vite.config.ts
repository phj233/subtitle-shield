import { defineConfig } from 'vite'

const userscriptHeader = `// ==UserScript==
// @name         Subtitle Shield
// @namespace    https://github.com/phj233/subtitle-shield
// @version      0.1.0
// @description  Hide, blur, or flip YouTube and Bilibili captions so language learners listen first.
// @homepageURL  https://github.com/phj233/subtitle-shield
// @supportURL   https://github.com/phj233/subtitle-shield/issues
// @match        https://www.youtube.com/*
// @match        https://youtube.com/*
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/list/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==
`

export default defineConfig({
  build: {
    emptyOutDir: true,
    target: 'es2020',
    minify: false,
    sourcemap: false,
    lib: {
      entry: 'src/main.ts',
      formats: ['iife'],
      name: 'SubtitleShield',
    },
    rollupOptions: {
      output: {
        banner: userscriptHeader,
        entryFileNames: 'subtitle-shield.user.js',
        extend: true,
      },
    },
  },
})

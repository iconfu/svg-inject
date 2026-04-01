import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM for bundlers + TypeScript types
  {
    entry: { 'svg-inject.esm': 'src/index.ts' },
    format: ['esm'],
    outDir: 'dist',
    clean: true,
    minify: true,
    outExtension: () => ({ js: '.js' }),
  },
  // CJS for require() + TypeScript .d.ts
  {
    entry: { 'svg-inject': 'src/index.ts' },
    format: ['cjs'],
    outDir: 'dist',
    dts: true,
    minify: true,
    outExtension: () => ({ js: '.cjs' }),
  },
  // IIFE minified — svg-inject.min.js (v1 compatible)
  {
    entry: { 'svg-inject.min': 'src/index.ts' },
    format: ['iife'],
    globalName: 'SVGInjectModule',
    outDir: 'dist',
    minify: true,
    outExtension: () => ({ js: '.js' }),
    footer: {
      js: 'if(typeof window!=="undefined"&&SVGInjectModule&&SVGInjectModule.SVGInject){window.SVGInject=SVGInjectModule.SVGInject;}',
    },
  },
  // IIFE unminified — svg-inject.js (v1 compatible, readable)
  {
    entry: { 'svg-inject': 'src/index.ts' },
    format: ['iife'],
    globalName: 'SVGInjectModule',
    outDir: 'dist',
    minify: false,
    outExtension: () => ({ js: '.js' }),
    footer: {
      js: 'if(typeof window!=="undefined"&&SVGInjectModule&&SVGInjectModule.SVGInject){window.SVGInject=SVGInjectModule.SVGInject;}',
    },
  },
]);

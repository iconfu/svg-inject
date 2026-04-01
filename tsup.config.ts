import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'svg-inject': 'src/index.ts' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'SVGInjectModule',
  outDir: 'dist',
  dts: true,
  clean: true,
  minify: true,
  outExtension({ format }) {
    if (format === 'esm') return { js: '.mjs' };
    if (format === 'cjs') return { js: '.cjs' };
    return { js: '.iife.js' };
  },
  footer({ format }) {
    if (format === 'iife') {
      return {
        js: 'if(typeof window!=="undefined"&&SVGInjectModule&&SVGInjectModule.SVGInject){window.SVGInject=SVGInjectModule.SVGInject;}',
      };
    }
    return {};
  },
});

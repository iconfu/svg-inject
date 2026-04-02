[![npm version](https://badge.fury.io/js/%40iconfu%2Fsvg-inject.svg)](https://www.npmjs.com/package/@iconfu/svg-inject) [![CI](https://github.com/iconfu/svg-inject/actions/workflows/ci.yml/badge.svg)](https://github.com/iconfu/svg-inject/actions/workflows/ci.yml) [![bundle size](https://img.shields.io/bundlephobia/minzip/@iconfu/svg-inject)](https://bundlephobia.com/package/@iconfu/svg-inject)

# SVGInject

**Style your SVGs with CSS. No build step. No framework lock-in. Under 4 KB.**

SVGInject replaces `<img>` elements with inline `<svg>` so you can target every path, circle, and group with CSS — colors, animations, hover effects, dark mode, all of it. One line of code, works everywhere.

![SVG Injection](https://github.com/iconfu/svg-inject/raw/master/resources/svg-injection.png)

```html
<img src="icon.svg" onload="SVGInject(this)" />
```

That's it. The `<img>` becomes an inline `<svg>` you can style freely.

Developed and maintained by [INCORS](https://www.incors.com).

> **Using v1?** v2 is a drop-in upgrade — same API, no code changes needed. You get bug fixes, better accessibility, and a full test suite. Only downside: no more IE support. [See what changed](#migrating-from-v1).


## Quick start

```bash
npm install @iconfu/svg-inject
```

```html
<img src="icon.svg" class="icon" onload="SVGInject(this)" />

<style>
  .icon { color: coral; }               /* currentColor works */
  .icon:hover { color: teal; }          /* hover works */
  .icon circle { fill: gold; }          /* target inner elements */
  .icon .logo-text { display: none; }   /* hide parts */
</style>
```

The injected SVG inherits the `class` from the `<img>`, so your CSS rules apply instantly.


## Why SVGInject?

|  | SVGInject | svgr | react-inlinesvg | vue-inline-svg |
|--|-----------|------|-----------------|----------------|
| Bundle size | **~4 KB** | varies | 8 KB | 3 KB |
| Dependencies | **0** | babel, etc. | 1 | 1 |
| Works without a build step | **yes** | no | no | no |
| Framework-agnostic | **yes** | React only | React only | Vue only |
| Works with CMS / dynamic HTML | **yes** | no | no | no |
| TypeScript types | **built-in** | built-in | built-in | community |
| Built-in sanitization | **yes** | n/a (build time) | no | no |
| Accessible (ARIA, role) | **automatic** | manual | manual | manual |

SVGInject is the right choice when you want to **style SVGs with CSS without changing your build pipeline** — especially for multi-framework projects, CMS-driven content, or plain HTML sites.

If your project is 100% React and you want compile-time SVG-to-component conversion, [svgr](https://react-svgr.com/) is a great alternative.


## Install

```bash
npm install @iconfu/svg-inject
```

**With a bundler** (React, Vue, Svelte, Angular, Next.js, Nuxt, SvelteKit, etc.):
```js
import { SVGInject } from '@iconfu/svg-inject';
```

**Without a bundler** (plain HTML, WordPress, CMS):
```html
<script src="https://unpkg.com/@iconfu/svg-inject@2/dist/svg-inject.min.js"></script>
```


## Usage

### Vanilla HTML

```html
<img src="icon.svg" onload="SVGInject(this)" />
```

Works with dynamically inserted content too. Any `<img>` with this `onload` gets injected automatically, even if added to the page later.

### From JavaScript

```js
// Inject all matching images after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  SVGInject(document.querySelectorAll('img.injectable'));
});
```

This approach avoids inline `onload` attributes, which is better for strict [Content Security Policy](#security) setups.

### Build your own wrapper

We intentionally don't ship framework-specific packages. SVGInject is one function — wrapping it in a component is 5 lines, and you have full control. No extra dependency, no version conflicts.

**React:**
```jsx
import { SVGInject } from '@iconfu/svg-inject';

function SvgImg({ src, ...props }) {
  return <img src={src} {...props} onLoad={(e) => SVGInject(e.currentTarget)} />;
}

// <SvgImg src="icon.svg" className="icon" alt="Settings" />
```

**Vue:**
```vue
<!-- SvgImg.vue -->
<template>
  <img :src="src" v-bind="$attrs" @load="(e) => SVGInject(e.currentTarget)" />
</template>

<script setup>
import { SVGInject } from '@iconfu/svg-inject';
defineProps(['src']);
</script>

<!-- <SvgImg src="icon.svg" class="icon" alt="Settings" /> -->
```

**Svelte:**
```svelte
<!-- SvgImg.svelte -->
<script>
  import { SVGInject } from '@iconfu/svg-inject';
  let { src, ...rest } = $props();
</script>

<img {src} {...rest} onload={(e) => SVGInject(e.currentTarget)} />

<!-- <SvgImg src="icon.svg" class="icon" alt="Settings" /> -->
```


## Features

### Tiny and dependency-free

Under 4 KB gzipped. Zero runtime dependencies. Tree-shakeable ESM. Ships with full TypeScript definitions.

### Accessible by default

SVGInject automatically sets the right ARIA attributes based on your `<img>`:

- **`alt="descriptive text"`** -- sets `role="img"` and `aria-label` on the SVG
- **`alt=""`** (decorative) -- sets `role="none"` and `aria-hidden="true"`
- **`title` attribute** -- becomes a `<title>` child element inside the SVG
- **ARIA ID references** (`aria-labelledby`, `aria-describedby`, etc.) are updated when IDs are made unique

```html
<!-- Meaningful icon -->
<img src="chart.svg" alt="Sales by quarter" onload="SVGInject(this)" />
<!-- Becomes: <svg role="img" aria-label="Sales by quarter"> ... </svg> -->

<!-- Decorative divider -->
<img src="divider.svg" alt="" onload="SVGInject(this)" />
<!-- Becomes: <svg role="none" aria-hidden="true"> ... </svg> -->
```

### ID conflict prevention

When multiple SVGs on the same page share IDs (common with gradient or clipPath definitions), SVGInject automatically makes all IDs unique by appending `--inject-N` suffixes. References in `url()`, `href`, `xlink:href`, and ARIA attributes are updated to match.

### Smart caching

Each SVG URL is fetched once and cached for the page lifetime. Subsequent injections of the same URL reuse the cached SVG string but parse a fresh DOM element, so ID uniquification and sanitization are always applied.

### Built-in sanitization

SVGInject can strip `<script>` elements, `<foreignObject>`, `on*` event handler attributes, and `javascript:`/`data:` URIs before injection. Enable with `sanitize: true`. See [Security](#security) for details.

### SSR-safe

Safe to `import` in Node.js, Next.js, Nuxt, SvelteKit, and any server-side environment. All DOM access is deferred to function call time — no top-level `window` or `document` references.

### Attribute handling

All attributes are copied from `<img>` to `<svg>` with these rules:

- **Excluded**: `src`, `alt`, `onload`, `onerror`
- **`title`** becomes a `<title>` child element
- **`alt`** becomes `aria-label` (or triggers decorative mode if empty)
- **`style`** is merged with the SVG's existing inline style (img values win on conflicts)
- **Case-sensitive SVG attributes** like `viewBox` and `preserveAspectRatio` are correctly mapped from their lowercased HTML form

Set `copyAttributes: false` to disable and handle it yourself in `beforeInject`.


## API

```ts
SVGInject(img, options?): Promise<void>
```
Injects the SVG for one or many `<img>` elements. Accepts a single element, an array, or a `NodeList`. Returns a Promise that resolves when all injections complete.

```ts
SVGInject.setOptions(options): void
```
Sets global default options for all subsequent injections.

```ts
SVGInject.create(name, options?): SVGInjectFunction
```
Creates an independent instance with its own cache and options. The `name` parameter sets the global variable name (used for `onload` attribute binding) and the flash-prevention CSS selector.

```ts
SVGInject.err(img, fallbackSrc?): void
```
Error handler for `onerror` on `<img>` elements. Optionally sets a fallback `src`.

### Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `useCache` | `boolean` | `true` | Cache SVG content per URL for the page lifetime |
| `copyAttributes` | `boolean` | `true` | Copy attributes from `<img>` to `<svg>` |
| `makeIdsUnique` | `boolean` | `true` | Append `--inject-N` suffix to all IDs to prevent collisions |
| `sanitize` | `boolean` | `false` | Strip `<script>`, `<foreignObject>`, event handlers, and dangerous URIs before injection |
| `injectStyleTag` | `boolean` | `true` | Inject a `<style>` tag to hide images before injection, preventing unstyled image flash. Set to `false` if you have a strict CSP |
| `beforeLoad` | `(img) => string \| void` | | Hook before loading. Return a string to override the URL |
| `afterLoad` | `(svg, svgString) => string \| SVGSVGElement \| void` | | Hook after loading. Modify the SVG or return a new one. Called once per URL when caching is enabled |
| `beforeInject` | `(img, svg) => Element \| void` | | Hook before injection. Return an element to inject instead |
| `afterInject` | `(img, svg) => void` | | Hook after injection |
| `onAllFinish` | `() => void` | | Called when all elements in a batch are done |
| `onFail` | `(img, status) => void` | | Called on failure. Status is `'LOAD_FAIL'`, `'SVG_INVALID'`, or `'SVG_NOT_SUPPORTED'` |


## Unstyled image flash

When using `onload`, the browser may briefly show the raw `<img>` before injection replaces it. SVGInject prevents this by default — it injects a CSS rule that hides injectable images until injection is complete.

This requires `style-src 'unsafe-inline'` in your Content Security Policy. If you have a strict CSP, disable it and add the rule to your own stylesheet instead:

```js
SVGInject.setOptions({ injectStyleTag: false });
```

```css
img[onload^="SVGInject("] { visibility: hidden; }
```


## Error handling

```html
<img src="icon.svg"
     onload="SVGInject(this)"
     onerror="SVGInject.err(this, 'fallback.png')" />
```

Or use the `onFail` hook:

```js
SVGInject.setOptions({
  onFail(img, status) {
    console.error('Injection failed:', status); // 'LOAD_FAIL', 'SVG_INVALID', or 'SVG_NOT_SUPPORTED'
  }
});
```


## Security

SVG files can contain scripts. SVGInject includes built-in protections you can opt into:

- **Built-in sanitization.** Enable with `SVGInject.setOptions({ sanitize: true })` or per call with `SVGInject(img, { sanitize: true })`. This strips `<script>`, `<foreignObject>`, `on*` event handlers, and `javascript:`/`data:` URIs before injection, catching the most common XSS vectors.
- **For untrusted SVGs** (user uploads, third-party URLs), consider adding [DOMPurify](https://github.com/cure53/DOMPurify) in the `afterLoad` hook for comprehensive protection.
- **Same-origin policy applies.** SVGs are loaded with `fetch()`. Cross-origin SVGs require [CORS headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) on the server.
- **CSP note.** The `onload="..."` attribute requires `script-src 'unsafe-inline'` (or a nonce/hash). If you use a strict CSP, call SVGInject from JavaScript instead. See [Usage > From JavaScript](#from-javascript).


## Migrating from v1

v2 is API-compatible with v1. Breaking changes:

| Change | Migration |
|--------|-----------|
| IE9-11 no longer supported | Stay on v1.x for IE |
| Decorative images handled correctly | `alt=""` now sets `role="none"` + `aria-hidden="true"` |
| `alt` converted to `aria-label` | Accessibility improvement |
| `style` merged instead of overwritten | Better behavior when both img and SVG have inline styles |


## Browser support

Chrome, Firefox, Safari, Edge -- all modern versions.


## License

[MIT](https://github.com/iconfu/svg-inject/blob/master/LICENSE)

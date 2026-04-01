# Issue Responses for v2.0.0

Comments to post on each open GitHub issue. Copy-paste each one.

---

### #36 — Missing TypeScript type definition

Hey, sorry this took forever — life got in the way.

v2 is now fully written in TypeScript, so type definitions ship with the package (`svg-inject.d.ts`). No more `@types` needed. Just `import { SVGInject } from '@iconfu/svg-inject'` and you get full types out of the box.

Available on the `v2-typescript-rewrite` branch.

---

### #40 — SSR Friendly

This is fixed in v2. The module no longer accesses `window` or `document` at the top level, so importing it in Node/Next.js/Nuxt/SvelteKit won't throw. All DOM access is deferred to when you actually call `SVGInject()`.

```js
import { SVGInject } from '@iconfu/svg-inject'; // safe in SSR
```

Sorry it took so long to get to this — been heads down on other stuff.

---

### #45 — IE WrongDocumentError

We've dropped IE support in v2 (moved from XHR to fetch). Since IE is end-of-life, this isn't something we'll fix going forward. If you still need IE, please stick with v1.x.

---

### #47 — Accessibility

Addressed in v2. The `alt` attribute on the `<img>` is now converted to `aria-label` on the injected `<svg>`. Decorative images (`alt=""`) get `role="none"` and `aria-hidden="true"`. The `title` attribute becomes a `<title>` child element, same as before.

We also looked into the styled-img-via-data-URL idea from the earlier discussion, but decided to keep the scope focused on injection + accessibility for now.

---

### #48 — inline style

Fixed in v2. If both the `<img>` and the `<svg>` have a `style` attribute, they're now merged instead of the img overwriting the svg's styles. The img's values win on conflicts.

Apologies for the slow turnaround on this.

---

### #49 — Simplify function `makeIdsUnique()`

Done — the `onlyReferenced` parameter and all its dead branches have been removed in v2. The function is cleaner now. Also fixed the array-used-as-object issue you spotted.

---

### #50 — Always add `role="img"` to injected SVG

Implemented in v2. Every injected SVG gets `role="img"` by default. Exception: if the original `<img>` has `alt=""` (decorative), it gets `role="none"` + `aria-hidden="true"` instead, which is the correct WCAG pattern.

---

### #52 — Consider `aria-labelledby` and `aria-describedby` when making IDs unique

Fixed in v2. When IDs are made unique, all ARIA ID reference attributes are now updated too: `aria-labelledby`, `aria-describedby`, `aria-controls`, `aria-owns`, `aria-flowto`, `aria-activedescendant`, `aria-errormessage`, and `aria-details`.

Only IDs that actually exist in the SVG get suffixed — external references are left alone.

Sorry this sat open for so long.

---

### #53 — Access to XMLHttpRequest has been blocked by CORS policy

This is a browser security restriction, not a bug in SVGInject. The SVG must be served from the same origin as the page, or the server needs to send CORS headers (`Access-Control-Allow-Origin`). Running from `file://` won't work in Chrome/Safari — use a local server instead (`npx serve .`).

v2 switched from XHR to `fetch()`, but the same-origin requirement is the same. We've added a note about this in the README.

---

### #54 — makeIdsUnique not working properly

This was a caching bug — the cache was storing pre-uniquified SVGs, so the `makeIdsUnique` option state leaked between injections. Fixed in v2: the cache now stores only the original SVG string, and uniquification is applied fresh on each injection. Setting `makeIdsUnique: false` works correctly now regardless of what previous injections did.

---

### #56 — Chrome scrollbar issue

Could you provide more details or a reproduction? We haven't been able to reproduce this. If you're still experiencing it with v2, please let us know.

---

### #57 — make addStyleToHead optional to easily comply with Content Security Policy

Done. v2 has an `injectStyleTag` option (defaults to `true` for backward compatibility). Set it to `false` if you have a strict CSP, and add the CSS rule to your own stylesheet instead:

```css
img[onload^="SVGInject("] { visibility: hidden; }
```

Also, calling SVGInject from JavaScript (instead of using the `onload` attribute) avoids the `script-src 'unsafe-inline'` requirement entirely.

---

### #58 — Partly img effective

Hard to say without a reproduction case. If you can share a minimal example or describe what's happening, happy to take a look. v2 has a lot of bug fixes that might have addressed this already.

---

### #61 — how can i use it in typescript?

v2 is written in TypeScript and ships with built-in type definitions. Just:

```ts
import { SVGInject } from '@iconfu/svg-inject';
```

Everything is typed — options, hooks, the return value.

---

### #63 — Attributes copied with lowercase names — can't override viewBox

Fixed in v2. There's now a mapping table that converts lowercased HTML attribute names to their correct SVG casing: `viewbox` → `viewBox`, `preserveaspectratio` → `preserveAspectRatio`, and about 40 more. Your workaround is no longer needed.

Took a while to get to this, sorry about that.

---

### #64 — Certain SVG displayed with black square unless makeIdsUnique is set to false

This was likely caused by the `url()` regex not matching single-quoted references like `url('#id')`. Fixed in v2 — the regex now handles unquoted, single-quoted, and double-quoted url() references. If you're still seeing the issue with v2, please let me know.

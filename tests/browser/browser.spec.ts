import { test, expect } from '@playwright/test';

const TEST_PAGE = '/tests/browser/test.html';

// Wait for all injections to settle
async function waitForInjections(page: import('@playwright/test').Page, selector: string, count: number) {
  await page.waitForFunction(
    ({ sel, cnt }) => document.querySelectorAll(sel).length >= cnt,
    { sel: selector, cnt: count },
    { timeout: 5000 },
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto(TEST_PAGE);
});

// --- Test 1: Basic onload injection ---

test('onload injection replaces img with svg', async ({ page }) => {
  await waitForInjections(page, '#test-onload svg', 1);
  const svgCount = await page.locator('#test-onload svg').count();
  const imgCount = await page.locator('#test-onload img').count();
  expect(svgCount).toBe(1);
  expect(imgCount).toBe(0);
});

// --- Test 2: Caching ---

test('cached injection — 3 identical SVGs all injected', async ({ page }) => {
  await waitForInjections(page, '#test-cache svg', 3);
  expect(await page.locator('#test-cache svg').count()).toBe(3);
  expect(await page.locator('#test-cache img').count()).toBe(0);
});

// --- Test 3: ID uniquification ---

test('IDs are unique across injected SVGs', async ({ page }) => {
  await waitForInjections(page, '#test-ids svg', 2);
  const ids = await page.evaluate(() => {
    const gradients = document.querySelectorAll('#test-ids linearGradient');
    return Array.from(gradients).map(el => el.id);
  });
  expect(ids.length).toBe(2);
  expect(ids[0]).not.toBe(ids[1]);
  expect(ids[0]).toContain('grad1');
  expect(ids[1]).toContain('grad1');
});

test('gradient fill references updated correctly', async ({ page }) => {
  await waitForInjections(page, '#test-ids svg', 2);
  const fills = await page.evaluate(() => {
    const circles = document.querySelectorAll('#test-ids circle');
    return Array.from(circles).map(el => el.getAttribute('fill'));
  });
  // Each circle's fill should reference its own uniquified gradient
  expect(fills[0]).not.toBe(fills[1]);
  for (const fill of fills) {
    expect(fill).toMatch(/url\(#grad1--inject-\d+\)/);
  }
});

// --- Test 4: Attribute copying ---

test('copies class, data-*, sets role="img" and aria-label', async ({ page }) => {
  await waitForInjections(page, '#test-attrs svg', 1);
  const attrs = await page.evaluate(() => {
    const svg = document.querySelector('#test-attrs svg')!;
    return {
      class: svg.getAttribute('class'),
      dataTestid: svg.getAttribute('data-testid'),
      role: svg.getAttribute('role'),
      ariaLabel: svg.getAttribute('aria-label'),
      hasSrc: svg.hasAttribute('src'),
      hasAlt: svg.hasAttribute('alt'),
      hasOnload: svg.hasAttribute('onload'),
    };
  });
  expect(attrs.class).toBe('my-icon');
  expect(attrs.dataTestid).toBe('icon1');
  expect(attrs.role).toBe('img');
  expect(attrs.ariaLabel).toBe('A circle icon');
  expect(attrs.hasSrc).toBe(false);
  expect(attrs.hasAlt).toBe(false);
  expect(attrs.hasOnload).toBe(false);
});

test('title attribute becomes <title> element', async ({ page }) => {
  await waitForInjections(page, '#test-attrs svg', 1);
  const titleText = await page.evaluate(() => {
    const svg = document.querySelector('#test-attrs svg')!;
    const title = svg.querySelector('title');
    return title?.textContent;
  });
  expect(titleText).toBe('My Icon');
});

// --- Test 5: Error handling ---

test('404 triggers fallback src via SVGInject.err()', async ({ page }) => {
  // The img should get fallback src after the 404
  await page.waitForFunction(() => {
    const img = document.querySelector('#test-error img');
    return img && img.getAttribute('src')?.includes('simple.svg');
  }, undefined, { timeout: 5000 });
  const src = await page.locator('#test-error img').getAttribute('src');
  expect(src).toContain('simple.svg');
});

// --- Test 6: ARIA ID references ---

test('ARIA labelledby IDs are uniquified', async ({ page }) => {
  await waitForInjections(page, '#test-aria svg', 1);
  const result = await page.evaluate(() => {
    const svg = document.querySelector('#test-aria svg')!;
    const labelledby = svg.getAttribute('aria-labelledby') || '';
    const title = svg.querySelector('title');
    const desc = svg.querySelector('desc');
    return {
      labelledby,
      titleId: title?.id || '',
      descId: desc?.id || '',
    };
  });
  // IDs should be uniquified and match the aria-labelledby references
  const refs = result.labelledby.split(' ');
  expect(refs.length).toBe(2);
  expect(refs[0]).toBe(result.titleId);
  expect(refs[1]).toBe(result.descId);
  expect(result.titleId).toContain('--inject-');
  expect(result.descId).toContain('--inject-');
});

// --- Test 7: JS-driven injection ---

test('JS-driven injection without onload attribute', async ({ page }) => {
  await waitForInjections(page, '#test-js svg', 2);
  expect(await page.locator('#test-js svg').count()).toBe(2);
  expect(await page.locator('#test-js img').count()).toBe(0);
});

// --- Test 8: Dynamic content insertion ---

test('dynamically inserted img elements get injected', async ({ page }) => {
  await waitForInjections(page, '#test-dynamic svg', 2);
  expect(await page.locator('#test-dynamic svg').count()).toBe(2);
  expect(await page.locator('#test-dynamic img').count()).toBe(0);
});

// --- Test 9: CSS currentColor ---

test('injected SVG inherits currentColor from parent', async ({ page }) => {
  await waitForInjections(page, '#test-style svg', 1);
  const color = await page.evaluate(() => {
    const circle = document.querySelector('#test-style svg circle') as SVGCircleElement;
    return window.getComputedStyle(circle).fill;
  });
  // coral = rgb(255, 127, 80)
  expect(color).toBe('rgb(255, 127, 80)');
});

// --- Test 10: viewBox case mapping ---

test('viewbox attribute mapped to viewBox correctly', async ({ page }) => {
  await waitForInjections(page, '#test-viewbox svg', 1);
  const viewBox = await page.evaluate(() => {
    const svg = document.querySelector('#test-viewbox svg')!;
    return svg.getAttribute('viewBox');
  });
  expect(viewBox).toBe('0 0 50 50');
});

// --- Test 11: data-inject-url ---

test('injected SVG has data-inject-url attribute', async ({ page }) => {
  await waitForInjections(page, '#test-onload svg', 1);
  const url = await page.evaluate(() => {
    const svg = document.querySelector('#test-onload svg')!;
    return svg.getAttribute('data-inject-url');
  });
  expect(url).toContain('simple.svg');
});

// --- Test 12: No unstyled image flash ---

test('img elements are hidden before injection (no onload visible)', async ({ page }) => {
  // Verify no img[onload] elements are left visible after page settles
  await waitForInjections(page, '#test-onload svg', 1);
  const visibleImgs = await page.evaluate(() => {
    return document.querySelectorAll('img[onload]').length;
  });
  expect(visibleImgs).toBe(0);
});

// --- Test 13: Visual regression ---

test('SVG renders visually', async ({ page }) => {
  await waitForInjections(page, '#test-onload svg', 1);
  const svg = page.locator('#test-onload svg');
  // Verify the SVG has non-zero dimensions (actually rendered)
  const box = await svg.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(0);
  expect(box!.height).toBeGreaterThan(0);
});

test('gradient SVG renders with non-zero dimensions', async ({ page }) => {
  await waitForInjections(page, '#test-ids svg', 2);
  const boxes = await page.locator('#test-ids svg').evaluateAll(svgs =>
    svgs.map(svg => {
      const r = svg.getBoundingClientRect();
      return { w: r.width, h: r.height };
    })
  );
  for (const box of boxes) {
    expect(box.w).toBeGreaterThan(0);
    expect(box.h).toBeGreaterThan(0);
  }
});

// --- Test 14: window.SVGInject global ---

test('IIFE exposes window.SVGInject', async ({ page }) => {
  const result = await page.evaluate(() => {
    return {
      hasInject: typeof (window as any).SVGInject === 'function',
      hasSetOptions: typeof (window as any).SVGInject.setOptions === 'function',
      hasCreate: typeof (window as any).SVGInject.create === 'function',
      hasErr: typeof (window as any).SVGInject.err === 'function',
    };
  });
  expect(result.hasInject).toBe(true);
  expect(result.hasSetOptions).toBe(true);
  expect(result.hasCreate).toBe(true);
  expect(result.hasErr).toBe(true);
});

// --- Test 15: create() assigns to window (v1 compat) ---

// --- Test 15: Sanitization ---

test('malicious SVG is sanitized — no script execution', async ({ page }) => {
  // Use JS-driven injection so we can reset __xss right before injecting
  // This isolates our sanitization from any browser behavior during <img> rendering
  const xss = await page.evaluate(async () => {
    delete (window as any).__xss;
    const img = document.querySelector('#test-sanitize .sanitize-test') as HTMLImageElement;
    await (window as any).SVGInject(img, { sanitize: true });
    return (window as any).__xss;
  });
  expect(xss).toBeUndefined();
});

test('malicious SVG — script, foreignObject, event handlers removed', async ({ page }) => {
  // Ensure injection has happened (from the previous test or trigger it)
  await page.evaluate(async () => {
    const img = document.querySelector('#test-sanitize .sanitize-test') as HTMLImageElement;
    if (img) await (window as any).SVGInject(img, { sanitize: true });
  });
  await page.waitForSelector('#test-sanitize svg', { timeout: 5000 });
  const result = await page.evaluate(() => {
    const svg = document.querySelector('#test-sanitize svg')!;
    return {
      hasScript: svg.querySelector('script') !== null,
      hasForeignObject: svg.querySelector('foreignObject') !== null || svg.querySelector('foreignobject') !== null,
      hasOnclick: svg.querySelector('[onclick]') !== null,
      hasOnload: svg.hasAttribute('onload'),
      hasRect: svg.querySelector('rect') !== null,
      hasJsHref: svg.querySelector('a')?.getAttribute('href')?.startsWith('javascript:') ?? false,
    };
  });
  expect(result.hasScript).toBe(false);
  expect(result.hasForeignObject).toBe(false);
  expect(result.hasOnclick).toBe(false);
  expect(result.hasOnload).toBe(false);
  expect(result.hasRect).toBe(true);
  expect(result.hasJsHref).toBe(false);
});

// --- Test 16: create() assigns to window ---

test('SVGInject.create() assigns new instance to window[name]', async ({ page }) => {
  const result = await page.evaluate(() => {
    (window as any).SVGInject.create('MyCustomInject');
    return typeof (window as any).MyCustomInject === 'function';
  });
  expect(result).toBe(true);
});

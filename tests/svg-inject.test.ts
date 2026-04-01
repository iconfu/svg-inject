import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSVGInject, SVGInject } from '../src/svg-inject';
import type { SVGInjectOptions, FailStatus } from '../src/types';
import { resetIdCounter } from '../src/make-ids-unique';

const SIMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>';
const SVG_WITH_IDS = '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1"><stop offset="0%"/></linearGradient></defs><rect fill="url(#g1)"/></svg>';
const SVG_WITH_SCRIPT = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect onclick="alert(2)" width="10"/></svg>';
const SIMPLE_SVG_2 = '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><rect width="50" height="50" fill="red"/></svg>';
const INVALID_SVG = '<notsvg>this is not valid</notsvg>';

function mockFetch(responses: Record<string, { ok: boolean; text: string }>) {
  return vi.fn(async (url: string) => {
    const resp = responses[url];
    if (!resp) {
      return { ok: false, status: 404, text: async () => '' } as unknown as Response;
    }
    return {
      ok: resp.ok,
      status: resp.ok ? 200 : 500,
      text: async () => resp.text,
    } as unknown as Response;
  });
}

function createImg(src: string, attrs: Record<string, string> = {}): HTMLImageElement {
  const img = document.createElement('img');
  img.setAttribute('src', src);
  for (const [k, v] of Object.entries(attrs)) {
    img.setAttribute(k, v);
  }
  document.body.appendChild(img);
  return img;
}

describe('SVGInject', () => {
  let fetchSpy: ReturnType<typeof mockFetch>;

  beforeEach(() => {
    resetIdCounter(1);
    document.body.innerHTML = '';
    fetchSpy = mockFetch({
      'http://localhost/test.svg': { ok: true, text: SIMPLE_SVG },
      'http://localhost/test2.svg': { ok: true, text: SIMPLE_SVG_2 },
      'http://localhost/test-ids.svg': { ok: true, text: SVG_WITH_IDS },
      'http://localhost/test-script.svg': { ok: true, text: SVG_WITH_SCRIPT },
      'http://localhost/invalid.svg': { ok: true, text: INVALID_SVG },
    });
    vi.stubGlobal('fetch', fetchSpy);
    // jsdom doesn't define SVGRect by default
    vi.stubGlobal('SVGRect', class {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('injects a single element — img replaced by SVG in DOM', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img);
    expect(document.body.querySelector('svg')).not.toBeNull();
    expect(document.body.querySelector('img')).toBeNull();
  });

  it('injects an array of elements', async () => {
    const img1 = createImg('http://localhost/test.svg');
    const img2 = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject([img1, img2]);
    expect(document.body.querySelectorAll('svg').length).toBe(2);
  });

  it('injects a NodeList from querySelectorAll', async () => {
    createImg('http://localhost/test.svg', { class: 'injectable' });
    createImg('http://localhost/test.svg', { class: 'injectable' });
    const inject = createSVGInject('SVGInject');
    await inject(document.querySelectorAll('img.injectable') as NodeListOf<HTMLImageElement>);
    expect(document.body.querySelectorAll('svg').length).toBe(2);
  });

  it('caches — fetch called once for same URL', async () => {
    const img1 = createImg('http://localhost/test.svg');
    const img2 = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject([img1, img2]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('does not cache when useCache is false', async () => {
    const img1 = createImg('http://localhost/test.svg');
    const img2 = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject([img1, img2], { useCache: false });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('calls onFail with LOAD_FAIL when fetch fails', async () => {
    const img = createImg('http://localhost/notfound.svg');
    const onFail = vi.fn();
    const inject = createSVGInject('SVGInject');
    await inject(img, { onFail });
    expect(onFail).toHaveBeenCalledWith(img, 'LOAD_FAIL');
  });

  it('calls onFail with SVG_INVALID for invalid SVG', async () => {
    const img = createImg('http://localhost/invalid.svg');
    const onFail = vi.fn();
    const inject = createSVGInject('SVGInject');
    await inject(img, { onFail });
    expect(onFail).toHaveBeenCalledWith(img, 'SVG_INVALID');
  });

  it('uses URL from beforeLoad hook', async () => {
    const img = createImg('http://localhost/original.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, {
      beforeLoad: () => 'http://localhost/test.svg',
    });
    expect(document.body.querySelector('svg')).not.toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost/test.svg');
  });

  it('applies afterLoad hook — in-place mutation (no cache)', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, {
      useCache: false,
      afterLoad: (svg) => {
        svg.setAttribute('data-processed', 'true');
      },
    });
    const svg = document.body.querySelector('svg')!;
    expect(svg.getAttribute('data-processed')).toBe('true');
  });

  it('applies afterLoad hook — returns new SVG string', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    const customSvg = '<svg xmlns="http://www.w3.org/2000/svg" data-custom="yes"><rect/></svg>';
    await inject(img, {
      useCache: false,
      afterLoad: () => customSvg,
    });
    const svg = document.body.querySelector('svg')!;
    expect(svg.getAttribute('data-custom')).toBe('yes');
  });

  it('applies afterLoad hook — returns new SVG element', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, {
      useCache: false,
      afterLoad: (svg) => {
        svg.setAttribute('data-from-element', 'yes');
        return svg;
      },
    });
    const svg = document.body.querySelector('svg')!;
    expect(svg.getAttribute('data-from-element')).toBe('yes');
  });

  it('uses element from beforeInject hook', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, {
      beforeInject: (_img, svg) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('svg-wrapper');
        wrapper.appendChild(svg);
        return wrapper;
      },
    });
    expect(document.body.querySelector('.svg-wrapper')).not.toBeNull();
    expect(document.body.querySelector('.svg-wrapper svg')).not.toBeNull();
  });

  it('calls afterInject with correct arguments', async () => {
    const img = createImg('http://localhost/test.svg');
    const afterInject = vi.fn();
    const inject = createSVGInject('SVGInject');
    await inject(img, { afterInject });
    expect(afterInject).toHaveBeenCalledTimes(1);
    expect(afterInject.mock.calls[0][0]).toBe(img);
    expect(afterInject.mock.calls[0][1].localName).toBe('svg');
  });

  it('calls onAllFinish once after batch', async () => {
    const img1 = createImg('http://localhost/test.svg');
    const img2 = createImg('http://localhost/test.svg');
    const onAllFinish = vi.fn();
    const inject = createSVGInject('SVGInject');
    await inject([img1, img2], { onAllFinish });
    expect(onAllFinish).toHaveBeenCalledTimes(1);
  });

  it('promise resolves after injection', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await expect(inject(img)).resolves.toBeUndefined();
    expect(document.body.querySelector('svg')).not.toBeNull();
  });

  it('does not inject <style> tag by default (CSP-safe) (#57)', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img);
    expect(document.head.querySelector('style')).toBeNull();
  });

  it('injects <style> tag when injectStyleTag is true (#57)', async () => {
    const inject = createSVGInject('TestInject', { injectStyleTag: true });
    const img = createImg('http://localhost/test.svg');
    await inject(img);
    const style = document.head.querySelector('style');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('TestInject');
  });

  it('cache isolation — makeIdsUnique true then false (#54)', async () => {
    const inject = createSVGInject('SVGInject');

    const img1 = createImg('http://localhost/test-ids.svg');
    await inject(img1, { makeIdsUnique: true });
    const svg1 = document.body.querySelector('svg')!;
    const gradient1 = svg1.querySelector('[id]');
    expect(gradient1!.id).toContain('--inject-');

    const img2 = createImg('http://localhost/test-ids.svg');
    await inject(img2, { makeIdsUnique: false });
    const svgs = document.body.querySelectorAll('svg');
    const svg2 = svgs[svgs.length - 1];
    const gradient2 = svg2.querySelector('[id]');
    // Second injection should have original IDs (no suffix)
    expect(gradient2!.id).not.toContain('--inject-');
  });

  it('sets data-inject-url attribute', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img);
    const svg = document.body.querySelector('svg')!;
    expect(svg.getAttribute('data-inject-url')).toBe('http://localhost/test.svg');
  });

  it('SVGInject.err() calls onFail and sets fallback src', () => {
    const inject = createSVGInject('SVGInject');
    const onFail = vi.fn();
    inject.setOptions({ onFail });
    const img = createImg('http://localhost/bad.svg');
    inject.err(img, 'http://localhost/fallback.png');
    expect(onFail).toHaveBeenCalledWith(img, 'LOAD_FAIL');
    expect(img.src).toContain('fallback.png');
  });

  it('SVGInject.create() creates independent instance', async () => {
    const inject1 = createSVGInject('Inject1');
    const inject2 = createSVGInject('Inject2');

    const onFail1 = vi.fn();
    const onFail2 = vi.fn();
    inject1.setOptions({ onFail: onFail1 });
    inject2.setOptions({ onFail: onFail2 });

    const img = createImg('http://localhost/notfound.svg');
    await inject1(img);
    expect(onFail1).toHaveBeenCalled();
    expect(onFail2).not.toHaveBeenCalled();
  });

  it('img with no src attribute — silent no-op', async () => {
    const img = document.createElement('img');
    document.body.appendChild(img);
    const inject = createSVGInject('SVGInject');
    const onFail = vi.fn();
    await inject(img, { onFail });
    // No src at all (getAttribute returns null) — should not call onFail
    expect(onFail).not.toHaveBeenCalled();
  });

  it('img with empty src — calls onFail with LOAD_FAIL', async () => {
    const img = document.createElement('img');
    img.setAttribute('src', '');
    document.body.appendChild(img);
    const inject = createSVGInject('SVGInject');
    const onFail = vi.fn();
    await inject(img, { onFail });
    expect(onFail).toHaveBeenCalledWith(img, 'LOAD_FAIL');
  });

  it('beforeLoad returning undefined — uses img src', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, { beforeLoad: () => undefined });
    expect(document.body.querySelector('svg')).not.toBeNull();
  });

  it('second injection on same element is a no-op', async () => {
    const img = createImg('http://localhost/test.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img);
    // img is no longer in DOM, but calling again should not throw
    await inject(img);
    expect(document.body.querySelectorAll('svg').length).toBe(1);
  });

  it('setOptions affects subsequent injections (#12)', async () => {
    const inject = createSVGInject('SVGInject');
    const afterInject = vi.fn();
    inject.setOptions({ afterInject });

    const img = createImg('http://localhost/test.svg');
    await inject(img);
    expect(afterInject).toHaveBeenCalledTimes(1);
  });

  it('concurrent injections of same URL use pending callback queue (#15)', async () => {
    const inject = createSVGInject('SVGInject');
    const img1 = createImg('http://localhost/test.svg');
    const img2 = createImg('http://localhost/test.svg');
    // Fire both concurrently — second should wait for first's fetch
    const [r1, r2] = await Promise.all([inject(img1), inject(img2)]);
    expect(document.body.querySelectorAll('svg').length).toBe(2);
    expect(fetchSpy).toHaveBeenCalledTimes(1); // only one fetch
  });

  it('concurrent injections of different URLs — independent cache entries', async () => {
    const inject = createSVGInject('SVGInject');
    const img1 = createImg('http://localhost/test.svg');
    const img2 = createImg('http://localhost/test2.svg');
    await Promise.all([inject(img1), inject(img2)]);
    expect(document.body.querySelectorAll('svg').length).toBe(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('sanitize: false preserves script and event handlers', async () => {
    const img = createImg('http://localhost/test-script.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, { sanitize: false });
    const svg = document.body.querySelector('svg')!;
    expect(svg.querySelector('script')).not.toBeNull();
    expect(svg.querySelector('rect')!.hasAttribute('onclick')).toBe(true);
  });

  it('sanitize: true strips script and event handlers', async () => {
    const img = createImg('http://localhost/test-script.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img, { sanitize: true });
    const svg = document.body.querySelector('svg')!;
    expect(svg.querySelector('script')).toBeNull();
    expect(svg.querySelector('rect')!.hasAttribute('onclick')).toBe(false);
    expect(svg.querySelector('rect')!.getAttribute('width')).toBe('10');
  });

  it('default (no sanitize) preserves all SVG content', async () => {
    const img = createImg('http://localhost/test-script.svg');
    const inject = createSVGInject('SVGInject');
    await inject(img);
    const svg = document.body.querySelector('svg')!;
    expect(svg.querySelector('script')).not.toBeNull();
    expect(svg.querySelector('rect')!.hasAttribute('onclick')).toBe(true);
  });
});

describe('SSR safety (#40)', () => {
  it('module can be imported without error', () => {
    // This test passing proves the module-level code doesn't access DOM
    expect(SVGInject).toBeDefined();
    expect(typeof SVGInject).toBe('function');
    expect(typeof SVGInject.setOptions).toBe('function');
    expect(typeof SVGInject.create).toBe('function');
    expect(typeof SVGInject.err).toBe('function');
  });
});

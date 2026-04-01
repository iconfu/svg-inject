import type { SVGInjectOptions, FailStatus, CacheEntry, SVGInjectFunction } from './types';
import { copyAttributes as copyAttrs } from './copy-attributes';
import { makeIdsUnique } from './make-ids-unique';
import { sanitizeSvg } from './sanitize';

const LOAD_FAIL: FailStatus = 'LOAD_FAIL';
const SVG_NOT_SUPPORTED: FailStatus = 'SVG_NOT_SUPPORTED';
const SVG_INVALID: FailStatus = 'SVG_INVALID';

const __SVGINJECT = '__svgInject';
const INJECTED = 1;
const FAIL = 2;

const DEFAULT_OPTIONS: Required<Pick<SVGInjectOptions, 'useCache' | 'copyAttributes' | 'makeIdsUnique' | 'sanitize' | 'injectStyleTag'>> = {
  useCache: true,
  copyAttributes: true,
  makeIdsUnique: true,
  sanitize: false,
  injectStyleTag: true,
};

// Lazy-initialized at call time (SSR-safe)
let domParser: DOMParser | null = null;
let xmlSerializer: XMLSerializer | null = null;
let aElement: HTMLAnchorElement | null = null;

function getAbsoluteUrl(url: string): string {
  aElement = aElement || document.createElement('a');
  aElement.href = url;
  return aElement.href;
}

function svgStringToSvgDoc(svgStr: string): Document {
  domParser = domParser || new DOMParser();
  return domParser.parseFromString(svgStr, 'text/xml');
}

function svgElemToSvgString(svgElement: Element): string {
  xmlSerializer = xmlSerializer || new XMLSerializer();
  return xmlSerializer.serializeToString(svgElement);
}

function buildSvgElement(svgStr: string, verify: boolean): Element | null {
  let svgDoc: Document;
  try {
    svgDoc = svgStringToSvgDoc(svgStr);
  } catch {
    return null;
  }
  if (verify && svgDoc.getElementsByTagName('parsererror').length) {
    return null;
  }
  return document.importNode(svgDoc.documentElement, true);
}

async function loadSvg(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load SVG: ${response.status}`);
  }
  return (await response.text()).trim();
}

function mergeOptions(base: SVGInjectOptions, override?: SVGInjectOptions): SVGInjectOptions {
  if (!override) return base;
  return { ...base, ...override };
}

function addStyleToHead(css: string): void {
  const head = document.getElementsByTagName('head')[0];
  if (head) {
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
  }
}

function isSvgElement(el: unknown): el is Element {
  return el != null && typeof el === 'object' && 'localName' in el && (el as Element).localName === 'svg';
}

function errorMessage(msg: string): void {
  console.error('SVGInject: ' + msg);
}

/**
 * Creates an SVGInject instance with its own cache and default options.
 */
export function createSVGInject(globalName: string, options?: SVGInjectOptions, _assignToWindow = true): SVGInjectFunction {
  let defaultOptions = mergeOptions({ ...DEFAULT_OPTIONS }, options);
  const svgLoadCache = new Map<string, CacheEntry>();
  let styleInjected = false;

  function ensureStyleTag(): void {
    if (!styleInjected && defaultOptions.injectStyleTag) {
      addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');
      styleInjected = true;
    }
  }

  function fail(imgElem: HTMLImageElement, status: FailStatus, opts: SVGInjectOptions): void {
    (imgElem as any)[__SVGINJECT] = FAIL;
    if (opts.onFail) {
      opts.onFail(imgElem, status);
    } else {
      errorMessage(status);
    }
  }

  function inject(
    imgElem: HTMLImageElement,
    svgElem: Element | null,
    absUrl: string,
    opts: SVGInjectOptions,
  ): void {
    if (!svgElem) {
      imgElem.removeAttribute('onload');
      fail(imgElem, SVG_INVALID, opts);
      return;
    }

    svgElem.setAttribute('data-inject-url', absUrl);
    const parentNode = imgElem.parentNode;
    if (!parentNode) return;

    if (opts.copyAttributes) {
      copyAttrs(imgElem, svgElem);
    }

    const injectElem = (opts.beforeInject && opts.beforeInject(imgElem, svgElem as SVGSVGElement)) || svgElem;
    parentNode.replaceChild(injectElem, imgElem);
    (imgElem as any)[__SVGINJECT] = INJECTED;
    imgElem.removeAttribute('onload');

    if (opts.afterInject) {
      opts.afterInject(imgElem, injectElem);
    }
  }

  async function injectElement(imgElem: HTMLImageElement, opts: SVGInjectOptions): Promise<void> {
    if (!imgElem) {
      errorMessage('no img element');
      return;
    }

    const svgInjectValue = (imgElem as any)[__SVGINJECT];
    if (!svgInjectValue) {
      // Clear JS event handlers (not just HTML attributes) on first processing
      imgElem.onload = null;
      imgElem.onerror = null;
    }
    if (svgInjectValue) {
      // Already injected or failed — if pending, wait for it
      if (svgInjectValue instanceof Promise) {
        await svgInjectValue;
      }
      return;
    }

    // Check SVG support
    if (typeof SVGRect === 'undefined') {
      imgElem.removeAttribute('onload');
      fail(imgElem, SVG_NOT_SUPPORTED, opts);
      return;
    }

    ensureStyleTag();

    const beforeLoad = opts.beforeLoad;
    const src = (beforeLoad && beforeLoad(imgElem)) || imgElem.getAttribute('src');

    if (src === null || src === undefined) {
      return;
    }
    if (src === '') {
      fail(imgElem, LOAD_FAIL, opts);
      return;
    }

    const absUrl = getAbsoluteUrl(src);
    const useCache = opts.useCache;
    const doMakeIdsUnique = opts.makeIdsUnique;

    // Mark as in-progress with a promise
    const { promise, resolve } = createDeferred();
    (imgElem as any)[__SVGINJECT] = promise;

    try {
      let svgString: string;

      if (useCache) {
        svgString = await getCachedSvg(absUrl, opts);
      } else {
        svgString = await loadAndProcess(absUrl, opts);
      }

      // Parse fresh for each injection
      let svgElem = buildSvgElement(svgString, false);
      if (svgElem) {
        if (opts.sanitize) sanitizeSvg(svgElem);
        if (doMakeIdsUnique) makeIdsUnique(svgElem);
      }

      inject(imgElem, svgElem, absUrl, opts);
    } catch (err) {
      const status = (err instanceof SvgError) ? err.status : LOAD_FAIL;
      imgElem.removeAttribute('onload');
      fail(imgElem, status, opts);
    } finally {
      resolve();
    }
  }

  async function loadAndProcess(absUrl: string, opts: SVGInjectOptions): Promise<string> {
    let svgString: string;
    try {
      svgString = await loadSvg(absUrl);
    } catch {
      throw new SvgError(LOAD_FAIL);
    }

    // Verify it's valid SVG
    const svgElem = buildSvgElement(svgString, true);
    if (!svgElem || !isSvgElement(svgElem)) {
      throw new SvgError(SVG_INVALID);
    }

    // afterLoad hook
    if (opts.afterLoad) {
      const result = opts.afterLoad(svgElem as SVGSVGElement, svgString);
      if (result) {
        if (typeof result === 'string') {
          svgString = result;
        } else {
          svgString = svgElemToSvgString(result);
        }
      } else {
        // afterLoad may have modified svgElem in place
        svgString = svgElemToSvgString(svgElem);
      }
    }

    return svgString;
  }

  async function getCachedSvg(absUrl: string, opts: SVGInjectOptions): Promise<string> {
    const cached = svgLoadCache.get(absUrl);

    if (cached) {
      if (cached.type === 'loaded') {
        return cached.svgString;
      }
      if (cached.type === 'failed') {
        throw new SvgError(cached.status);
      }
      // Pending — wait for it
      return new Promise<string>((resolve, reject) => {
        cached.callbacks.push((entry: CacheEntry) => {
          if (entry.type === 'loaded') resolve(entry.svgString);
          else if (entry.type === 'failed') reject(new SvgError(entry.status));
        });
      });
    }

    // Not in cache — load it
    const pending: CacheEntry = { type: 'pending', callbacks: [] };
    svgLoadCache.set(absUrl, pending);

    try {
      const svgString = await loadAndProcess(absUrl, opts);
      const loaded: CacheEntry = { type: 'loaded', svgString };
      svgLoadCache.set(absUrl, loaded);
      pending.callbacks.forEach(cb => cb(loaded));
      return svgString;
    } catch (err) {
      const status = (err instanceof SvgError) ? err.status : LOAD_FAIL;
      const failed: CacheEntry = { type: 'failed', status };
      svgLoadCache.set(absUrl, failed);
      pending.callbacks.forEach(cb => cb(failed));
      throw err;
    }
  }

  // --- Public API ---

  function SVGInject(
    img: HTMLImageElement | HTMLImageElement[] | NodeListOf<HTMLImageElement>,
    options?: SVGInjectOptions,
  ): Promise<void> {
    const opts = mergeOptions(defaultOptions, options);

    const elements: HTMLImageElement[] = img instanceof HTMLImageElement
      ? [img]
      : Array.from(img as ArrayLike<HTMLImageElement>);

    const promises = elements.map(el => injectElement(el, opts));
    return Promise.all(promises).then(() => {
      if (opts.onAllFinish) opts.onAllFinish();
    });
  }

  SVGInject.setOptions = function (options: SVGInjectOptions): void {
    defaultOptions = mergeOptions(defaultOptions, options);
  };

  SVGInject.create = createSVGInject;

  SVGInject.err = function (img: HTMLImageElement, fallbackSrc?: string): void {
    if (!img) {
      errorMessage('no img element');
      return;
    }

    if ((img as any)[__SVGINJECT] === FAIL) return;

    img.onload = null;
    img.onerror = null;
    img.removeAttribute('onload');

    if (typeof SVGRect === 'undefined') {
      fail(img, SVG_NOT_SUPPORTED, defaultOptions);
    } else {
      fail(img, LOAD_FAIL, defaultOptions);
    }

    if (fallbackSrc) {
      img.src = fallbackSrc;
    }
  };

  // Assign to window for onload="Name(this)" usage in HTML (v1 compat)
  if (_assignToWindow && typeof window !== 'undefined') {
    (window as any)[globalName] = SVGInject;
  }

  return SVGInject;
}

// --- Helper types ---

class SvgError extends Error {
  constructor(public status: FailStatus) {
    super(status);
  }
}

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>(r => { resolve = r; });
  return { promise, resolve };
}

// Create the default instance — no window assignment here; the IIFE footer handles that.
// User-created instances via SVGInject.create() DO assign to window (v1 compat).
export const SVGInject = createSVGInject('SVGInject', undefined, false);

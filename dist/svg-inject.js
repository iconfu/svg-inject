"use strict";
var SVGInjectModule = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var src_exports = {};
  __export(src_exports, {
    SVGInject: () => SVGInject,
    createSVGInject: () => createSVGInject,
    default: () => SVGInject
  });

  // src/copy-attributes.ts
  var SVG_CASE_MAP = {
    viewbox: "viewBox",
    preserveaspectratio: "preserveAspectRatio",
    basefrequency: "baseFrequency",
    baseprofile: "baseProfile",
    calcmode: "calcMode",
    clippathunits: "clipPathUnits",
    diffuseconstant: "diffuseConstant",
    edgemode: "edgeMode",
    filterunits: "filterUnits",
    glyphref: "glyphRef",
    gradienttransform: "gradientTransform",
    gradientunits: "gradientUnits",
    kernelmatrix: "kernelMatrix",
    kernelunitlength: "kernelUnitLength",
    keypoints: "keyPoints",
    keysplines: "keySplines",
    keytimes: "keyTimes",
    lengthadjust: "lengthAdjust",
    limitingconeangle: "limitingConeAngle",
    markerheight: "markerHeight",
    markerunits: "markerUnits",
    markerwidth: "markerWidth",
    maskcontentunits: "maskContentUnits",
    maskunits: "maskUnits",
    numoctaves: "numOctaves",
    pathlength: "pathLength",
    patterncontentunits: "patternContentUnits",
    patterntransform: "patternTransform",
    patternunits: "patternUnits",
    pointsatx: "pointsAtX",
    pointsaty: "pointsAtY",
    pointsatz: "pointsAtZ",
    primitiveunits: "primitiveUnits",
    refx: "refX",
    refy: "refY",
    repeatcount: "repeatCount",
    repeatdur: "repeatDur",
    requiredextensions: "requiredExtensions",
    requiredfeatures: "requiredFeatures",
    specularconstant: "specularConstant",
    specularexponent: "specularExponent",
    spreadmethod: "spreadMethod",
    startoffset: "startOffset",
    stddeviation: "stdDeviation",
    stitchtiles: "stitchTiles",
    surfacescale: "surfaceScale",
    systemlanguage: "systemLanguage",
    tablevalues: "tableValues",
    targetx: "targetX",
    targety: "targetY",
    textlength: "textLength",
    xchannelselector: "xChannelSelector",
    ychannelselector: "yChannelSelector",
    zoomandpan: "zoomAndPan"
  };
  var EXCLUDED_ATTRIBUTES = /* @__PURE__ */ new Set(["src", "alt", "onload", "onerror"]);
  function mergeStyles(svgStyle, imgStyle) {
    const declarations = /* @__PURE__ */ new Map();
    for (const style of [svgStyle, imgStyle]) {
      if (!style) continue;
      for (const decl of style.split(";")) {
        const colon = decl.indexOf(":");
        if (colon === -1) continue;
        const prop = decl.substring(0, colon).trim();
        const val = decl.substring(colon + 1).trim();
        if (prop) {
          declarations.set(prop, val);
        }
      }
    }
    if (declarations.size === 0) return "";
    return Array.from(declarations.entries()).map(([prop, val]) => `${prop}: ${val}`).join("; ");
  }
  function copyAttributes(imgElem, svgElem) {
    const alt = imgElem.getAttribute("alt");
    if (alt === "") {
      svgElem.setAttribute("role", "none");
      svgElem.setAttribute("aria-hidden", "true");
    } else {
      svgElem.setAttribute("role", "img");
      if (alt !== null) {
        svgElem.setAttribute("aria-label", alt);
      }
    }
    const attributes = imgElem.attributes;
    for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      let attributeName = attribute.name;
      if (EXCLUDED_ATTRIBUTES.has(attributeName)) continue;
      const attributeValue = attribute.value;
      if (attributeName === "title") {
        const firstChild = svgElem.firstElementChild;
        let titleElem;
        if (firstChild && firstChild.localName.toLowerCase() === "title") {
          titleElem = firstChild;
        } else {
          titleElem = (svgElem.ownerDocument || document).createElementNS("http://www.w3.org/2000/svg", "title");
          svgElem.insertBefore(titleElem, firstChild);
        }
        titleElem.textContent = attributeValue;
      } else if (attributeName === "style") {
        const svgStyle = svgElem.getAttribute("style") || "";
        const merged = mergeStyles(svgStyle, attributeValue);
        if (merged) {
          svgElem.setAttribute("style", merged);
        }
      } else {
        attributeName = SVG_CASE_MAP[attributeName] || attributeName;
        svgElem.setAttribute(attributeName, attributeValue);
      }
    }
  }

  // src/make-ids-unique.ts
  var ID_SUFFIX = "--inject-";
  var IRI_TAG_PROPERTIES_MAP = {
    clipPath: ["clip-path"],
    "color-profile": null,
    cursor: null,
    filter: null,
    linearGradient: ["fill", "stroke"],
    marker: ["marker", "marker-end", "marker-mid", "marker-start"],
    mask: null,
    pattern: ["fill", "stroke"],
    radialGradient: ["fill", "stroke"]
  };
  var ARIA_ID_REF_ATTRIBUTES = [
    "aria-labelledby",
    "aria-describedby",
    "aria-controls",
    "aria-owns",
    "aria-flowto",
    "aria-activedescendant",
    "aria-errormessage",
    "aria-details"
  ];
  var FUNC_IRI_REGEX = /url\(["']?#([a-zA-Z][\w:.-]*)["']?\)/g;
  var uniqueIdCounter = 1;
  function makeIdsUnique(svgElem) {
    const idSuffix = ID_SUFFIX + uniqueIdCounter++;
    const idElements = svgElem.querySelectorAll("[id]");
    if (idElements.length === 0) return false;
    const existingIds = /* @__PURE__ */ new Set();
    const iriTagNames = /* @__PURE__ */ new Set();
    for (let i = 0; i < idElements.length; i++) {
      existingIds.add(idElements[i].id);
      const tagName = idElements[i].localName;
      if (tagName in IRI_TAG_PROPERTIES_MAP) {
        iriTagNames.add(tagName);
      }
    }
    const iriProperties = [];
    for (const tagName of iriTagNames) {
      const mapped = IRI_TAG_PROPERTIES_MAP[tagName] || [tagName];
      for (const prop of mapped) {
        if (!iriProperties.includes(prop)) {
          iriProperties.push(prop);
        }
      }
    }
    if (iriProperties.length > 0) {
      iriProperties.push("style");
    }
    const replaceIriRef = (_match, id) => {
      return "url(#" + id + idSuffix + ")";
    };
    const descendants = svgElem.getElementsByTagName("*");
    for (let i = -1; i < descendants.length; i++) {
      const element = i === -1 ? svgElem : descendants[i];
      if (element.localName === "style") {
        const text = element.textContent;
        if (text) {
          const newText = text.replace(FUNC_IRI_REGEX, replaceIriRef);
          if (newText !== text) {
            element.textContent = newText;
          }
        }
      } else if (element.hasAttributes()) {
        for (const propertyName of iriProperties) {
          const value = element.getAttribute(propertyName);
          if (value) {
            const newValue = value.replace(FUNC_IRI_REGEX, replaceIriRef);
            if (newValue !== value) {
              element.setAttribute(propertyName, newValue);
            }
          }
        }
        for (const refAttr of ["xlink:href", "href"]) {
          const iri = element.getAttribute(refAttr);
          if (iri && /^\s*#/.test(iri)) {
            element.setAttribute(refAttr, iri.trim() + idSuffix);
          }
        }
        for (const ariaAttr of ARIA_ID_REF_ATTRIBUTES) {
          const value = element.getAttribute(ariaAttr);
          if (value) {
            const ids = value.split(/\s+/);
            const newIds = ids.map((id) => existingIds.has(id) ? id + idSuffix : id);
            const newValue = newIds.join(" ");
            if (newValue !== value) {
              element.setAttribute(ariaAttr, newValue);
            }
          }
        }
      }
    }
    for (let i = 0; i < idElements.length; i++) {
      idElements[i].id += idSuffix;
    }
    return true;
  }

  // src/sanitize.ts
  var DANGEROUS_ELEMENTS = /* @__PURE__ */ new Set([
    "script",
    "foreignobject"
  ]);
  var DANGEROUS_URI = /^\s*(javascript|data|vbscript)\s*:/i;
  function sanitizeSvg(svgElem) {
    var _a;
    const allElements = svgElem.getElementsByTagName("*");
    const toRemove = [];
    for (let i = 0; i < allElements.length; i++) {
      if (DANGEROUS_ELEMENTS.has(allElements[i].localName.toLowerCase())) {
        toRemove.push(allElements[i]);
      }
    }
    for (const el of toRemove) {
      (_a = el.parentNode) == null ? void 0 : _a.removeChild(el);
    }
    const remaining = svgElem.getElementsByTagName("*");
    for (let i = -1; i < remaining.length; i++) {
      const el = i === -1 ? svgElem : remaining[i];
      if (!el.hasAttributes()) continue;
      const attrsToRemove = [];
      for (let j = 0; j < el.attributes.length; j++) {
        const attr = el.attributes[j];
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          attrsToRemove.push(attr.name);
          continue;
        }
        if ((name === "href" || name === "xlink:href") && DANGEROUS_URI.test(attr.value)) {
          attrsToRemove.push(attr.name);
        }
      }
      for (const attrName of attrsToRemove) {
        el.removeAttribute(attrName);
      }
    }
  }

  // src/svg-inject.ts
  var LOAD_FAIL = "LOAD_FAIL";
  var SVG_NOT_SUPPORTED = "SVG_NOT_SUPPORTED";
  var SVG_INVALID = "SVG_INVALID";
  var __SVGINJECT = "__svgInject";
  var INJECTED = 1;
  var FAIL = 2;
  var DEFAULT_OPTIONS = {
    useCache: true,
    copyAttributes: true,
    makeIdsUnique: true,
    sanitize: false,
    injectStyleTag: true
  };
  var domParser = null;
  var xmlSerializer = null;
  var aElement = null;
  function getAbsoluteUrl(url) {
    aElement = aElement || document.createElement("a");
    aElement.href = url;
    return aElement.href;
  }
  function svgStringToSvgDoc(svgStr) {
    domParser = domParser || new DOMParser();
    return domParser.parseFromString(svgStr, "text/xml");
  }
  function svgElemToSvgString(svgElement) {
    xmlSerializer = xmlSerializer || new XMLSerializer();
    return xmlSerializer.serializeToString(svgElement);
  }
  function buildSvgElement(svgStr, verify) {
    let svgDoc;
    try {
      svgDoc = svgStringToSvgDoc(svgStr);
    } catch (e) {
      return null;
    }
    if (verify && svgDoc.getElementsByTagName("parsererror").length) {
      return null;
    }
    return document.adoptNode(svgDoc.documentElement);
  }
  async function loadSvg(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.status}`);
    }
    return (await response.text()).trim();
  }
  function mergeOptions(base, override) {
    if (!override) return base;
    return { ...base, ...override };
  }
  function addStyleToHead(css) {
    const head = document.getElementsByTagName("head")[0];
    if (head) {
      const style = document.createElement("style");
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    }
  }
  function isSvgElement(el) {
    return el != null && typeof el === "object" && "localName" in el && el.localName === "svg";
  }
  function errorMessage(msg) {
    console.error("SVGInject: " + msg);
  }
  function createSVGInject(globalName, options, _assignToWindow = true) {
    let defaultOptions = mergeOptions({ ...DEFAULT_OPTIONS }, options);
    const svgLoadCache = /* @__PURE__ */ new Map();
    if (defaultOptions.injectStyleTag && typeof document !== "undefined") {
      addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');
    }
    function fail(imgElem, status, opts) {
      imgElem[__SVGINJECT] = FAIL;
      if (opts.onFail) {
        opts.onFail(imgElem, status);
      } else {
        errorMessage(status);
      }
    }
    function inject(imgElem, svgElem, absUrl, opts) {
      if (!svgElem) {
        imgElem.removeAttribute("onload");
        fail(imgElem, SVG_INVALID, opts);
        return;
      }
      svgElem.setAttribute("data-inject-url", absUrl);
      const parentNode = imgElem.parentNode;
      if (!parentNode) return;
      if (opts.copyAttributes) {
        copyAttributes(imgElem, svgElem);
      }
      const injectElem = opts.beforeInject && opts.beforeInject(imgElem, svgElem) || svgElem;
      parentNode.replaceChild(injectElem, imgElem);
      imgElem[__SVGINJECT] = INJECTED;
      imgElem.removeAttribute("onload");
      if (opts.afterInject) {
        opts.afterInject(imgElem, injectElem);
      }
    }
    async function injectElement(imgElem, opts) {
      if (!imgElem) {
        errorMessage("no img element");
        return;
      }
      const svgInjectValue = imgElem[__SVGINJECT];
      if (!svgInjectValue) {
        imgElem.onload = null;
        imgElem.onerror = null;
      }
      if (svgInjectValue) {
        if (svgInjectValue instanceof Promise) {
          await svgInjectValue;
        }
        return;
      }
      if (typeof SVGRect === "undefined") {
        imgElem.removeAttribute("onload");
        fail(imgElem, SVG_NOT_SUPPORTED, opts);
        return;
      }
      const beforeLoad = opts.beforeLoad;
      const src = beforeLoad && beforeLoad(imgElem) || imgElem.getAttribute("src");
      if (src === null || src === void 0) {
        return;
      }
      if (src === "") {
        fail(imgElem, LOAD_FAIL, opts);
        return;
      }
      const absUrl = getAbsoluteUrl(src);
      const useCache = opts.useCache;
      const doMakeIdsUnique = opts.makeIdsUnique;
      const { promise, resolve } = createDeferred();
      imgElem[__SVGINJECT] = promise;
      try {
        let svgString;
        if (useCache) {
          svgString = await getCachedSvg(absUrl, opts);
        } else {
          svgString = await loadAndProcess(absUrl, opts);
        }
        let svgElem = buildSvgElement(svgString, false);
        if (svgElem) {
          if (opts.sanitize) sanitizeSvg(svgElem);
          if (doMakeIdsUnique) makeIdsUnique(svgElem);
        }
        inject(imgElem, svgElem, absUrl, opts);
      } catch (err) {
        const status = err instanceof SvgError ? err.status : LOAD_FAIL;
        imgElem.removeAttribute("onload");
        fail(imgElem, status, opts);
      } finally {
        resolve();
      }
    }
    async function loadAndProcess(absUrl, opts) {
      let svgString;
      try {
        svgString = await loadSvg(absUrl);
      } catch (e) {
        throw new SvgError(LOAD_FAIL);
      }
      const svgElem = buildSvgElement(svgString, true);
      if (!svgElem || !isSvgElement(svgElem)) {
        throw new SvgError(SVG_INVALID);
      }
      if (opts.afterLoad) {
        const result = opts.afterLoad(svgElem, svgString);
        if (result) {
          if (typeof result === "string") {
            svgString = result;
          } else {
            svgString = svgElemToSvgString(result);
          }
        } else {
          svgString = svgElemToSvgString(svgElem);
        }
      }
      return svgString;
    }
    async function getCachedSvg(absUrl, opts) {
      const cached = svgLoadCache.get(absUrl);
      if (cached) {
        if (cached.type === "loaded") {
          return cached.svgString;
        }
        if (cached.type === "failed") {
          throw new SvgError(cached.status);
        }
        return new Promise((resolve, reject) => {
          cached.callbacks.push((entry) => {
            if (entry.type === "loaded") resolve(entry.svgString);
            else if (entry.type === "failed") reject(new SvgError(entry.status));
          });
        });
      }
      const pending = { type: "pending", callbacks: [] };
      svgLoadCache.set(absUrl, pending);
      try {
        const svgString = await loadAndProcess(absUrl, opts);
        const loaded = { type: "loaded", svgString };
        svgLoadCache.set(absUrl, loaded);
        pending.callbacks.forEach((cb) => cb(loaded));
        return svgString;
      } catch (err) {
        const status = err instanceof SvgError ? err.status : LOAD_FAIL;
        const failed = { type: "failed", status };
        svgLoadCache.set(absUrl, failed);
        pending.callbacks.forEach((cb) => cb(failed));
        throw err;
      }
    }
    function SVGInject2(img, options2) {
      const opts = mergeOptions(defaultOptions, options2);
      const elements = img instanceof HTMLImageElement ? [img] : Array.from(img);
      const promises = elements.map((el) => injectElement(el, opts));
      return Promise.all(promises).then(() => {
        if (opts.onAllFinish) opts.onAllFinish();
      });
    }
    SVGInject2.setOptions = function(options2) {
      defaultOptions = mergeOptions(defaultOptions, options2);
    };
    SVGInject2.create = createSVGInject;
    SVGInject2.err = function(img, fallbackSrc) {
      if (!img) {
        errorMessage("no img element");
        return;
      }
      if (img[__SVGINJECT] === FAIL) return;
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("onload");
      if (typeof SVGRect === "undefined") {
        fail(img, SVG_NOT_SUPPORTED, defaultOptions);
      } else {
        fail(img, LOAD_FAIL, defaultOptions);
      }
      if (fallbackSrc) {
        img.src = fallbackSrc;
      }
    };
    if (_assignToWindow && typeof window !== "undefined") {
      window[globalName] = SVGInject2;
    }
    return SVGInject2;
  }
  var SvgError = class extends Error {
    constructor(status) {
      super(status);
      this.status = status;
    }
  };
  function createDeferred() {
    let resolve;
    const promise = new Promise((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }
  var SVGInject = createSVGInject("SVGInject", void 0, false);
  return __toCommonJS(src_exports);
})();
if(typeof window!=="undefined"&&SVGInjectModule&&SVGInjectModule.SVGInject){window.SVGInject=SVGInjectModule.SVGInject;}

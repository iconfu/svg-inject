// Maps lowercased HTML attribute names to correct SVG casing.
// HTML parsers lowercase all attributes, but SVG requires specific casing.
const SVG_CASE_MAP: Record<string, string> = {
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
  basefrequency: 'baseFrequency',
  baseprofile: 'baseProfile',
  calcmode: 'calcMode',
  clippathunits: 'clipPathUnits',
  diffuseconstant: 'diffuseConstant',
  edgemode: 'edgeMode',
  filterunits: 'filterUnits',
  glyphref: 'glyphRef',
  gradienttransform: 'gradientTransform',
  gradientunits: 'gradientUnits',
  kernelmatrix: 'kernelMatrix',
  kernelunitlength: 'kernelUnitLength',
  keypoints: 'keyPoints',
  keysplines: 'keySplines',
  keytimes: 'keyTimes',
  lengthadjust: 'lengthAdjust',
  limitingconeangle: 'limitingConeAngle',
  markerheight: 'markerHeight',
  markerunits: 'markerUnits',
  markerwidth: 'markerWidth',
  maskcontentunits: 'maskContentUnits',
  maskunits: 'maskUnits',
  numoctaves: 'numOctaves',
  pathlength: 'pathLength',
  patterncontentunits: 'patternContentUnits',
  patterntransform: 'patternTransform',
  patternunits: 'patternUnits',
  pointsatx: 'pointsAtX',
  pointsaty: 'pointsAtY',
  pointsatz: 'pointsAtZ',
  primitiveunits: 'primitiveUnits',
  refx: 'refX',
  refy: 'refY',
  repeatcount: 'repeatCount',
  repeatdur: 'repeatDur',
  requiredextensions: 'requiredExtensions',
  requiredfeatures: 'requiredFeatures',
  specularconstant: 'specularConstant',
  specularexponent: 'specularExponent',
  spreadmethod: 'spreadMethod',
  startoffset: 'startOffset',
  stddeviation: 'stdDeviation',
  stitchtiles: 'stitchTiles',
  surfacescale: 'surfaceScale',
  systemlanguage: 'systemLanguage',
  tablevalues: 'tableValues',
  targetx: 'targetX',
  targety: 'targetY',
  textlength: 'textLength',
  xchannelselector: 'xChannelSelector',
  ychannelselector: 'yChannelSelector',
  zoomandpan: 'zoomAndPan',
};

const EXCLUDED_ATTRIBUTES = new Set(['src', 'alt', 'onload', 'onerror']);

/**
 * Merges two semicolon-delimited inline style strings.
 * Properties from `imgStyle` win on conflicts.
 */
export function mergeStyles(svgStyle: string, imgStyle: string): string {
  const declarations = new Map<string, string>();

  for (const style of [svgStyle, imgStyle]) {
    if (!style) continue;
    for (const decl of style.split(';')) {
      const colon = decl.indexOf(':');
      if (colon === -1) continue;
      const prop = decl.substring(0, colon).trim();
      const val = decl.substring(colon + 1).trim();
      if (prop) {
        declarations.set(prop, val);
      }
    }
  }

  if (declarations.size === 0) return '';
  return Array.from(declarations.entries())
    .map(([prop, val]) => `${prop}: ${val}`)
    .join('; ');
}

/**
 * Copies attributes from an <img> element to an <svg> element.
 *
 * - Accessibility: role="img" + aria-label for meaningful images,
 *   role="none" + aria-hidden for decorative images (alt="") (#50, #47)
 * - Converts title to <title> child element
 * - Merges style instead of overwriting (#48)
 * - Remaps lowercased attribute names to correct SVG casing (#63)
 * - Skips src, alt, onload, onerror
 */
export function copyAttributes(imgElem: HTMLImageElement, svgElem: Element): void {
  const alt = imgElem.getAttribute('alt');

  if (alt === '') {
    // Decorative image — hide from assistive technology
    svgElem.setAttribute('role', 'none');
    svgElem.setAttribute('aria-hidden', 'true');
  } else {
    // Meaningful image
    svgElem.setAttribute('role', 'img');
    if (alt !== null) {
      svgElem.setAttribute('aria-label', alt);
    }
  }

  const attributes = imgElem.attributes;
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    let attributeName = attribute.name;

    if (EXCLUDED_ATTRIBUTES.has(attributeName)) continue;

    const attributeValue = attribute.value;

    if (attributeName === 'title') {
      // Convert title attribute to <title> SVG element
      const firstChild = svgElem.firstElementChild;
      let titleElem: Element;

      if (firstChild && firstChild.localName.toLowerCase() === 'title') {
        titleElem = firstChild;
      } else {
        titleElem = (svgElem.ownerDocument || document).createElementNS('http://www.w3.org/2000/svg', 'title');
        svgElem.insertBefore(titleElem, firstChild);
      }
      titleElem.textContent = attributeValue;
    } else if (attributeName === 'style') {
      // Merge styles instead of overwriting (#48)
      const svgStyle = svgElem.getAttribute('style') || '';
      const merged = mergeStyles(svgStyle, attributeValue);
      if (merged) {
        svgElem.setAttribute('style', merged);
      }
    } else {
      // Remap lowercased names to correct SVG casing (#63)
      attributeName = SVG_CASE_MAP[attributeName] || attributeName;
      svgElem.setAttribute(attributeName, attributeValue);
    }
  }
}

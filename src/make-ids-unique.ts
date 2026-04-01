const ID_SUFFIX = '--inject-';

// Map of IRI referenceable tag names to properties that can reference them.
// https://www.w3.org/TR/SVG11/linking.html#processingIRI
const IRI_TAG_PROPERTIES_MAP: Record<string, string[] | null> = {
  clipPath: ['clip-path'],
  'color-profile': null,
  cursor: null,
  filter: null,
  linearGradient: ['fill', 'stroke'],
  marker: ['marker', 'marker-end', 'marker-mid', 'marker-start'],
  mask: null,
  pattern: ['fill', 'stroke'],
  radialGradient: ['fill', 'stroke'],
};

// ARIA attributes that contain space-separated ID references (#52)
const ARIA_ID_REF_ATTRIBUTES = [
  'aria-labelledby',
  'aria-describedby',
  'aria-controls',
  'aria-owns',
  'aria-flowto',
  'aria-activedescendant',
  'aria-errormessage',
  'aria-details',
];

// Regex for url() references with optional single or double quotes (#64)
// Matches: url(#id), url("#id"), url('#id')
const FUNC_IRI_REGEX = /url\(["']?#([a-zA-Z][\w:.-]*)["']?\)/g;

let uniqueIdCounter = 1;

/**
 * Resets the unique ID counter. Primarily for testing.
 */
export function resetIdCounter(value = 1): void {
  uniqueIdCounter = value;
}

/**
 * Makes all IDs in the SVG element unique by appending "--inject-N" suffix.
 * Updates all references to those IDs (url(), href, xlink:href, ARIA attributes).
 *
 * Returns true if any IDs were found and modified.
 */
export function makeIdsUnique(svgElem: Element): boolean {
  const idSuffix = ID_SUFFIX + uniqueIdCounter++;
  const idElements = svgElem.querySelectorAll('[id]');

  if (idElements.length === 0) return false;

  // Collect all IDs that exist in the SVG
  const existingIds = new Set<string>();
  const iriTagNames = new Set<string>();

  for (let i = 0; i < idElements.length; i++) {
    existingIds.add(idElements[i].id);
    const tagName = idElements[i].localName;
    if (tagName in IRI_TAG_PROPERTIES_MAP) {
      iriTagNames.add(tagName);
    }
  }

  // Build list of CSS/SVG properties that may contain url(#id) references
  const iriProperties: string[] = [];
  for (const tagName of iriTagNames) {
    const mapped = IRI_TAG_PROPERTIES_MAP[tagName] || [tagName];
    for (const prop of mapped) {
      if (!iriProperties.includes(prop)) {
        iriProperties.push(prop);
      }
    }
  }
  if (iriProperties.length > 0) {
    iriProperties.push('style');
  }

  // Replace function for url(#id) references
  const replaceIriRef = (_match: string, id: string): string => {
    return 'url(#' + id + idSuffix + ')';
  };

  // Process all descendant elements + the SVG root itself
  const descendants = svgElem.getElementsByTagName('*');

  // Process svgElem first (index -1), then all descendants
  for (let i = -1; i < descendants.length; i++) {
    const element = i === -1 ? svgElem : descendants[i];

    if (element.localName === 'style') {
      // Replace IDs in <style> text content
      const text = element.textContent;
      if (text) {
        const newText = text.replace(FUNC_IRI_REGEX, replaceIriRef);
        if (newText !== text) {
          element.textContent = newText;
        }
      }
    } else if (element.hasAttributes()) {
      // Replace url(#id) in IRI-referencing properties
      for (const propertyName of iriProperties) {
        const value = element.getAttribute(propertyName);
        if (value) {
          const newValue = value.replace(FUNC_IRI_REGEX, replaceIriRef);
          if (newValue !== value) {
            element.setAttribute(propertyName, newValue);
          }
        }
      }

      // Replace internal #id references in href and xlink:href
      for (const refAttr of ['xlink:href', 'href']) {
        const iri = element.getAttribute(refAttr);
        if (iri && /^\s*#/.test(iri)) {
          element.setAttribute(refAttr, iri.trim() + idSuffix);
        }
      }

      // Replace IDs in ARIA attributes (#52)
      for (const ariaAttr of ARIA_ID_REF_ATTRIBUTES) {
        const value = element.getAttribute(ariaAttr);
        if (value) {
          const ids = value.split(/\s+/);
          const newIds = ids.map(id => existingIds.has(id) ? id + idSuffix : id);
          const newValue = newIds.join(' ');
          if (newValue !== value) {
            element.setAttribute(ariaAttr, newValue);
          }
        }
      }
    }
  }

  // Suffix all element IDs
  for (let i = 0; i < idElements.length; i++) {
    idElements[i].id += idSuffix;
  }

  return true;
}


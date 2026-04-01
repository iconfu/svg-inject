// Elements that can execute scripts or embed arbitrary HTML
const DANGEROUS_ELEMENTS = new Set([
  'script',
  'foreignobject',
]);

// URI schemes that can execute code
const DANGEROUS_URI = /^\s*(javascript|data|vbscript)\s*:/i;

/**
 * Removes dangerous elements and attributes from a parsed SVG element.
 * This is a lightweight sanitizer — it catches common XSS vectors but is
 * not a replacement for a full sanitizer like DOMPurify on untrusted content.
 */
export function sanitizeSvg(svgElem: Element): void {
  // Remove dangerous elements
  const allElements = svgElem.getElementsByTagName('*');
  // Collect first, then remove (live collection changes during removal)
  const toRemove: Element[] = [];
  for (let i = 0; i < allElements.length; i++) {
    if (DANGEROUS_ELEMENTS.has(allElements[i].localName.toLowerCase())) {
      toRemove.push(allElements[i]);
    }
  }
  for (const el of toRemove) {
    el.parentNode?.removeChild(el);
  }

  // Remove event handler attributes and dangerous URIs from all remaining elements
  const remaining = svgElem.getElementsByTagName('*');
  for (let i = -1; i < remaining.length; i++) {
    const el = i === -1 ? svgElem : remaining[i];
    if (!el.hasAttributes()) continue;

    // Collect attributes to remove (can't modify during iteration)
    const attrsToRemove: string[] = [];
    for (let j = 0; j < el.attributes.length; j++) {
      const attr = el.attributes[j];
      const name = attr.name.toLowerCase();

      // Remove on* event handlers (onclick, onload, onerror, etc.)
      if (name.startsWith('on')) {
        attrsToRemove.push(attr.name);
        continue;
      }

      // Remove dangerous URIs in href/xlink:href
      if ((name === 'href' || name === 'xlink:href') && DANGEROUS_URI.test(attr.value)) {
        attrsToRemove.push(attr.name);
      }
    }

    for (const attrName of attrsToRemove) {
      el.removeAttribute(attrName);
    }
  }
}

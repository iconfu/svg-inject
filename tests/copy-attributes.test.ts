import { describe, it, expect } from 'vitest';
import { copyAttributes, mergeStyles } from '../src/copy-attributes';

function createImg(attrs: Record<string, string> = {}): HTMLImageElement {
  const img = document.createElement('img');
  for (const [k, v] of Object.entries(attrs)) {
    img.setAttribute(k, v);
  }
  return img;
}

function createSvg(attrs: Record<string, string> = {}, inner = ''): Element {
  const div = document.createElement('div');
  const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
  div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" ${attrStr}>${inner}</svg>`;
  return div.firstElementChild!;
}

describe('copyAttributes', () => {
  it('copies class and data-* attributes', () => {
    const img = createImg({ src: 'test.svg', class: 'icon', 'data-id': '42' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('class')).toBe('icon');
    expect(svg.getAttribute('data-id')).toBe('42');
  });

  it('does not copy src, alt, onload, onerror', () => {
    const img = createImg({ src: 'test.svg', alt: 'An icon', onload: 'SVGInject(this)', onerror: 'SVGInject.err(this)' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.hasAttribute('src')).toBe(false);
    expect(svg.hasAttribute('alt')).toBe(false);
    expect(svg.hasAttribute('onload')).toBe(false);
    expect(svg.hasAttribute('onerror')).toBe(false);
  });

  it('converts title attribute to <title> child element', () => {
    const img = createImg({ title: 'My Icon' });
    const svg = createSvg({}, '<circle cx="10" cy="10" r="5"/>');
    copyAttributes(img, svg);
    const titleEl = svg.firstElementChild!;
    expect(titleEl.localName).toBe('title');
    expect(titleEl.textContent).toBe('My Icon');
    // circle should now be second child
    expect(svg.children[1].localName).toBe('circle');
  });

  it('replaces existing <title> element text', () => {
    const img = createImg({ title: 'New Title' });
    const svg = createSvg({}, '<title>Old Title</title><rect/>');
    copyAttributes(img, svg);
    expect(svg.querySelectorAll('title').length).toBe(1);
    expect(svg.firstElementChild!.textContent).toBe('New Title');
  });

  it('maps viewbox to viewBox (#63)', () => {
    const img = createImg({ viewbox: '0 0 100 100' });
    const svg = createSvg();
    copyAttributes(img, svg);
    // jsdom may or may not distinguish case — check the value was set
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('maps preserveaspectratio to preserveAspectRatio (#63)', () => {
    const img = createImg({ preserveaspectratio: 'xMidYMid meet' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  });

  it('merges styles — img wins on conflict (#48)', () => {
    const img = createImg({ style: 'color: red; width: 50px' });
    const svg = createSvg({ style: 'color: blue; height: 30px' });
    copyAttributes(img, svg);
    const style = svg.getAttribute('style')!;
    expect(style).toContain('color: red');
    expect(style).toContain('height: 30px');
    expect(style).toContain('width: 50px');
    expect(style).not.toContain('blue');
  });

  it('copies style when SVG has no existing style', () => {
    const img = createImg({ style: 'fill: green' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('style')).toContain('fill: green');
  });

  it('sets role="img" when no alt present (#50)', () => {
    const img = createImg({});
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('role')).toBe('img');
  });

  it('sets role="img" when alt has content (#50)', () => {
    const img = createImg({ alt: 'Icon' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('role')).toBe('img');
  });

  it('converts alt to aria-label (#47)', () => {
    const img = createImg({ alt: 'A chart' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('aria-label')).toBe('A chart');
  });

  it('decorative image (alt="") gets role="none" + aria-hidden', () => {
    const img = createImg({ alt: '' });
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.getAttribute('role')).toBe('none');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.hasAttribute('aria-label')).toBe(false);
  });

  it('does not add aria-label when no alt present', () => {
    const img = createImg({});
    const svg = createSvg();
    copyAttributes(img, svg);
    expect(svg.hasAttribute('aria-label')).toBe(false);
  });
});

describe('mergeStyles', () => {
  it('merges two style strings', () => {
    const result = mergeStyles('color: blue; height: 30px', 'color: red; width: 50px');
    expect(result).toContain('color: red');
    expect(result).toContain('height: 30px');
    expect(result).toContain('width: 50px');
  });

  it('handles empty strings', () => {
    expect(mergeStyles('', 'color: red')).toBe('color: red');
    expect(mergeStyles('color: blue', '')).toBe('color: blue');
    expect(mergeStyles('', '')).toBe('');
  });
});

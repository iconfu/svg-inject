import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from '../src/sanitize';

function parseSvg(html: string): Element {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild!;
}

describe('sanitizeSvg', () => {
  it('removes <script> elements', () => {
    const svg = parseSvg('<svg><script>alert("xss")</script><rect/></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('script')).toBeNull();
    expect(svg.querySelector('rect')).not.toBeNull();
  });

  it('removes <foreignObject> elements', () => {
    const svg = parseSvg('<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><div>xss</div></body></foreignObject><rect/></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('foreignobject')).toBeNull();
    expect(svg.querySelector('rect')).not.toBeNull();
  });

  it('removes on* event handler attributes', () => {
    const svg = parseSvg('<svg><rect onclick="alert(1)" onmouseover="alert(2)" width="10"/></svg>');
    sanitizeSvg(svg);
    const rect = svg.querySelector('rect')!;
    expect(rect.hasAttribute('onclick')).toBe(false);
    expect(rect.hasAttribute('onmouseover')).toBe(false);
    expect(rect.getAttribute('width')).toBe('10');
  });

  it('removes on* attributes from the SVG root', () => {
    const svg = parseSvg('<svg onload="alert(1)"><rect/></svg>');
    sanitizeSvg(svg);
    expect(svg.hasAttribute('onload')).toBe(false);
  });

  it('removes javascript: URIs from href', () => {
    const svg = parseSvg('<svg><a href="javascript:alert(1)"><text>click</text></a></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('a')!.hasAttribute('href')).toBe(false);
  });

  it('removes data: URIs from href', () => {
    const svg = parseSvg('<svg><a href="data:text/html,<script>alert(1)</script>"><text>click</text></a></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('a')!.hasAttribute('href')).toBe(false);
  });

  it('preserves safe href values', () => {
    const svg = parseSvg('<svg><a href="https://example.com"><text>link</text></a></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('a')!.getAttribute('href')).toBe('https://example.com');
  });

  it('preserves internal #id references in href', () => {
    const svg = parseSvg('<svg><use href="#mySymbol"/></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('use')!.getAttribute('href')).toBe('#mySymbol');
  });

  it('preserves safe elements and attributes', () => {
    const svg = parseSvg('<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red"/></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('circle')).not.toBeNull();
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('handles nested dangerous elements', () => {
    const svg = parseSvg('<svg><g><g><script>alert(1)</script></g></g><rect/></svg>');
    sanitizeSvg(svg);
    expect(svg.querySelector('script')).toBeNull();
    expect(svg.querySelector('rect')).not.toBeNull();
  });

  it('handles SVG with no dangerous content (no-op)', () => {
    const svg = parseSvg('<svg><rect x="0" y="0" width="100" height="100"/></svg>');
    const before = svg.innerHTML;
    sanitizeSvg(svg);
    expect(svg.innerHTML).toBe(before);
  });
});

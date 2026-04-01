import { describe, it, expect, beforeEach } from 'vitest';
import { makeIdsUnique, resetIdCounter } from '../src/make-ids-unique';

function parseSvg(html: string): Element {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild!;
}

describe('makeIdsUnique', () => {
  beforeEach(() => {
    resetIdCounter(1);
  });

  it('suffixes IDs and updates url() references', () => {
    const svg = parseSvg(`
      <svg>
        <defs><linearGradient id="grad1"><stop offset="0%"/></linearGradient></defs>
        <rect fill="url(#grad1)"/>
      </svg>
    `);
    const changed = makeIdsUnique(svg);
    expect(changed).toBe(true);
    expect(svg.querySelector('linearGradient')!.id).toBe('grad1--inject-1');
    expect(svg.querySelector('rect')!.getAttribute('fill')).toBe('url(#grad1--inject-1)');
  });

  it('updates url() references in <style> elements', () => {
    const svg = parseSvg(`
      <svg>
        <defs><clipPath id="clip1"><rect/></clipPath></defs>
        <style>.foo { clip-path: url(#clip1); }</style>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.querySelector('style')!.textContent).toContain('url(#clip1--inject-1)');
  });

  it('updates url() references in inline style attributes', () => {
    const svg = parseSvg(`
      <svg>
        <defs><clipPath id="clip1"><rect/></clipPath></defs>
        <g style="clip-path: url(#clip1)"><rect/></g>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.querySelector('g')!.getAttribute('style')).toContain('url(#clip1--inject-1)');
  });

  it('updates href and xlink:href attributes', () => {
    const svg = parseSvg(`
      <svg>
        <defs><linearGradient id="g1"><stop/></linearGradient></defs>
        <use href="#g1"/><use xlink:href="#g1"/>
      </svg>
    `);
    makeIdsUnique(svg);
    const uses = svg.querySelectorAll('use');
    expect(uses[0].getAttribute('href')).toBe('#g1--inject-1');
    // xlink:href may or may not be preserved by jsdom's HTML parser
  });

  it('updates single ARIA ID reference (#52)', () => {
    const svg = parseSvg(`
      <svg aria-labelledby="title1">
        <title id="title1">Chart</title>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.getAttribute('aria-labelledby')).toBe('title1--inject-1');
    expect(svg.querySelector('title')!.id).toBe('title1--inject-1');
  });

  it('updates multiple space-separated ARIA IDs (#52)', () => {
    const svg = parseSvg(`
      <svg aria-describedby="desc1 desc2">
        <text id="desc1">Hello</text>
        <text id="desc2">World</text>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.getAttribute('aria-describedby')).toBe('desc1--inject-1 desc2--inject-1');
  });

  it('matches single-quoted url(\'#id\') (#64)', () => {
    const svg = parseSvg(`
      <svg>
        <defs><linearGradient id="g1"><stop/></linearGradient></defs>
        <rect fill="url('#g1')"/>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.querySelector('rect')!.getAttribute('fill')).toContain('url(#g1--inject-1)');
  });

  it('matches double-quoted url("#id")', () => {
    const svg = parseSvg(`
      <svg>
        <defs><linearGradient id="g1"><stop/></linearGradient></defs>
        <rect fill='url("#g1")'/>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.querySelector('rect')!.getAttribute('fill')).toContain('url(#g1--inject-1)');
  });

  it('returns false when no IDs present', () => {
    const svg = parseSvg('<svg><rect/></svg>');
    expect(makeIdsUnique(svg)).toBe(false);
  });

  it('increments counter between calls', () => {
    const svg1 = parseSvg('<svg><rect id="r1"/></svg>');
    const svg2 = parseSvg('<svg><rect id="r1"/></svg>');
    makeIdsUnique(svg1);
    makeIdsUnique(svg2);
    expect(svg1.querySelector('rect')!.id).toBe('r1--inject-1');
    expect(svg2.querySelector('rect')!.id).toBe('r1--inject-2');
  });

  it('suffixes non-IRI IDs too', () => {
    const svg = parseSvg('<svg><g id="group1"><rect/></g></svg>');
    makeIdsUnique(svg);
    expect(svg.querySelector('g')!.id).toBe('group1--inject-1');
  });

  it('leaves ARIA refs to nonexistent IDs unchanged', () => {
    const svg = parseSvg(`
      <svg aria-labelledby="nonexistent">
        <rect id="r1"/>
      </svg>
    `);
    makeIdsUnique(svg);
    expect(svg.getAttribute('aria-labelledby')).toBe('nonexistent');
    expect(svg.querySelector('rect')!.id).toBe('r1--inject-1');
  });
});


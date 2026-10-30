/* Drawings written by the AI (tutor answers, classroom board), cleaned down
   to a short list of shapes before they're shown. */

const SVG_TAGS = new Set(['svg', 'g', 'line', 'rect', 'circle', 'ellipse', 'path', 'polyline', 'polygon', 'text', 'tspan', 'defs', 'marker', 'title']);
const SVG_ATTRS = new Set([
  'viewbox', 'xmlns', 'width', 'height', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points',
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'fill-opacity',
  'transform', 'font-size', 'font-weight', 'font-style', 'text-anchor', 'dominant-baseline', 'dx', 'dy', 'id',
  'marker-end', 'marker-start', 'marker-mid', 'markerwidth', 'markerheight', 'refx', 'refy', 'orient', 'markerunits',
]);
const STROKED = new Set(['line', 'rect', 'circle', 'ellipse', 'path', 'polyline', 'polygon']);

/**
 * The drawing as clean SVG markup, or null if it isn't one. Only the shapes
 * and attributes above survive: no scripts, styles, links, images or event
 * handlers. With `draw`, each shape gets pathLength="1" and a --i index so CSS
 * can draw it stroke by stroke.
 */
export function cleanSvg(raw: string, { draw = false, font = 'Outfit, Segoe UI, Roboto, Arial, sans-serif' } = {}): string | null {
  const source = raw.replace(/^```[a-z]*\s*|```\s*$/gi, '').trim();
  if (!source.startsWith('<svg')) return null;
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  const svg = doc.documentElement;
  if (svg.nodeName !== 'svg' || doc.getElementsByTagName('parsererror').length) return null;

  let n = 0;
  const clean = (el: Element) => {
    for (const child of [...el.children]) {
      if (!SVG_TAGS.has(child.nodeName.toLowerCase())) child.remove();
      else clean(child);
    }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      // url(#id) is how markers attach; any other url() could reach outside.
      const outside = /url\(\s*(?!#)/i.test(attr.value);
      if (!SVG_ATTRS.has(name) || outside) el.removeAttribute(attr.name);
    }
    const tag = el.nodeName.toLowerCase();
    if (draw && (STROKED.has(tag) || tag === 'text') && !el.closest('defs')) {
      if (STROKED.has(tag)) el.setAttribute('pathLength', '1');
      el.setAttribute('style', `--i:${n++}`);
    }
  };
  clean(svg);

  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('font-family', font);
  const box = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
  if (box.length === 4 && box.every(Number.isFinite)) {
    svg.setAttribute('width', String(box[2]));
    svg.setAttribute('height', String(box[3]));
  } else if (!svg.getAttribute('width')) {
    svg.setAttribute('viewBox', '0 0 320 180');
    svg.setAttribute('width', '320');
    svg.setAttribute('height', '180');
  }
  return new XMLSerializer().serializeToString(svg);
}

/** As an image URL: an SVG in an <img> can't run scripts or load anything. */
export const svgUrl = (raw: string) => {
  const svg = cleanSvg(raw);
  return svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : null;
};

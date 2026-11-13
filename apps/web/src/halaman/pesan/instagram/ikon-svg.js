export function IkonInstagram() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  for (const [name, value] of Object.entries({
    width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', 'stroke-width': '2', 'aria-hidden': 'true',
  })) svg.setAttribute(name, value);
  for (const [tag, attrs] of [
    ['rect', { x: '3', y: '3', width: '18', height: '18', rx: '5' }],
    ['circle', { cx: '12', cy: '12', r: '4' }],
    ['circle', { cx: '17.5', cy: '6.5', r: '.7', fill: 'currentColor' }],
  ]) {
    const node = document.createElementNS(ns, tag);
    for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
    svg.append(node);
  }
  return svg;
}

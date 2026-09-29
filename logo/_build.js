// LarkyGO Logo production generator — outputs all SVG assets (v2 fixed layout)
const fs = require('fs');
const path = require('path');
const OUT = __dirname;

const C = {
  ink: '#1C1726',
  cream: '#F7F2E9',
  purple: '#6C4DFF',
  coral: '#FF5A36',
  lime: '#A8E829'
};
const FONT = 'Inter, Helvetica Neue, Helvetica, Arial, sans-serif';

function sparklePath(R = 100, r = 28, tipRound = 8, waistRound = 4, tExtra = 10) {
  const Rtop = R + tExtra;
  const v = [
    { x: 0, y: -Rtop, isTip: true },
    { x: r, y: -r, isTip: false },
    { x: R, y: 0, isTip: true },
    { x: r, y: r, isTip: false },
    { x: 0, y: R, isTip: true },
    { x: -r, y: r, isTip: false },
    { x: -R, y: 0, isTip: true },
    { x: -r, y: -r, isTip: false }
  ];
  const n = v.length;
  const seg = (a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy);
    return { ux: dx / L, uy: dy / L, L };
  };
  let d = '';
  for (let i = 0; i < n; i++) {
    const prev = v[(i - 1 + n) % n];
    const cur = v[i];
    const next = v[(i + 1) % n];
    const e1 = seg(prev, cur);
    const e2 = seg(cur, next);
    const rad = cur.isTip ? tipRound : waistRound;
    const dot = e1.ux * e2.ux + e1.uy * e2.uy;
    const angle = Math.acos(Math.min(1, Math.max(-1, dot)));
    const ins = rad / Math.tan(angle / 2);
    const cIn = Math.min(ins, e1.L * 0.45, e2.L * 0.45);
    const p1 = { x: cur.x - e1.ux * cIn, y: cur.y - e1.uy * cIn };
    const p2 = { x: cur.x + e2.ux * cIn, y: cur.y + e2.uy * cIn };
    if (i === 0) d += `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `;
    else d += `L ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} `;
    d += `Q ${cur.x.toFixed(2)} ${cur.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  d += 'Z';
  return d;
}

// sparkle group: shadow + body + accent dot, scaled, centered at (0,0)
function sparkleGroup(d, { scale = 1, color = C.purple, shadowColor = C.ink, shadowOffset = 10, accent = true } = {}) {
  const s = (n) => (n * scale).toFixed(1);
  let out = `<g transform="translate({X},{Y})">`;
  if (shadowColor !== 'none') out += `\n   <path d="${d}" fill="${shadowColor}" transform="translate(${s(shadowOffset)},${s(shadowOffset)}) scale(${scale})"/>`;
  out += `\n   <path d="${d}" fill="${color}" transform="scale(${scale})"/>`;
  if (accent) out += `\n   <circle cx="${(110 * 0.62 * 0).toFixed(0)}" cy="0" r="0" fill="none"/>`; // placeholder removed below
  out += `\n  </g>`;
  return out;
}

// Simpler: full sparkle group with accent sized relative to R
function mark({ R = 110, r = 30, tipRound = 10, waistRound = 5, tExtra = 12, scale = 1, color = C.purple, shadow = true, shadowOffset = 10, accent = true, shadowColor = C.ink }) {
  const d = sparklePath(R, r, tipRound, waistRound, tExtra);
  const s = (n) => (n * scale).toFixed(1);
  let out = '';
  if (shadow) out += `\n   <path d="${d}" fill="${shadowColor}" transform="translate(${s(shadowOffset)},${s(shadowOffset)}) scale(${scale})"/>`;
  out += `\n   <path d="${d}" fill="${color}" transform="scale(${scale})"/>`;
  if (accent) out += `\n   <circle cx="${s(R * 0.62)}" cy="${s(-(R + tExtra) * 0.62)}" r="${s(R * 0.16)}" fill="${C.coral}"/>`;
  return out;
}

function symbolSVG({ R = 110, r = 30, tipRound = 10, waistRound = 5, tExtra = 12, shadow = true, shadowOffset = 10, accent = true, color = C.purple, shadowColor = C.ink, viewBoxPad = 40 }) {
  const ext = R + tExtra;
  const pad = viewBoxPad + (shadow ? shadowOffset : 0);
  const w = 2 * (R + pad);
  const h = 2 * (ext + pad);
  const cx = R + pad;
  const cy = ext + pad;
  const inner = mark({ R, r, tipRound, waistRound, tExtra, color, shadow, shadowOffset, accent, shadowColor });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
 <g transform="translate(${cx},${cy})">${inner}
 </g>
</svg>
`;
}

function appIconSVG({ withRounded = true }) {
  const SIZE = 1024, RAD = 230;
  const d = sparklePath(220, 60, 20, 10, 26);
  const clipPath = withRounded ? `
  <defs><clipPath id="ic"><rect width="${SIZE}" height="${SIZE}" rx="${RAD}" ry="${RAD}"/></clipPath></defs>` : '';
  const clipAttr = withRounded ? ' clip-path="url(#ic)"' : '';
  const clipRect = withRounded ? `rx="${RAD}" ry="${RAD}"` : '';
  const border = withRounded ? `
  <rect x="6" y="6" width="${SIZE - 12}" height="${SIZE - 12}" rx="${RAD - 6}" ry="${RAD - 6}" fill="none" stroke="${C.ink}" stroke-width="12"/>` : '';
  let dots = '';
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++)
    dots += `<circle cx="${90 + i * 120}" cy="${90 + j * 120}" r="4" fill="${C.ink}" opacity=".14"/>`;
  // mark: R=220 → bottom tip 220, shadow 22; center at (512, 420)
  const markInner = mark({ R: 220, r: 60, tipRound: 20, waistRound: 10, tExtra: 26, shadowOffset: 22 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
 ${clipPath}
 <g${clipAttr}>
  <rect width="${SIZE}" height="${SIZE}" ${clipRect} fill="${C.cream}"/>
  <g opacity=".14">${dots}</g>
  <g transform="translate(512,415)">${markInner}
  </g>
  <text x="512" y="835" text-anchor="middle" font-family="${FONT}" font-weight="900" font-size="164" letter-spacing="4"><tspan fill="${C.purple}">Larky</tspan><tspan fill="${C.coral}">GO</tspan></text>
  <text x="512" y="905" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="46" letter-spacing="14" fill="${C.ink}" opacity=".68">GO OUT · PLAY NOW</text>${border}
 </g>
</svg>
`;
}

function horizontalSVG() {
  const W = 1180, H = 380;
  const d = sparklePath(130, 36, 12, 6, 14);
  const mi = mark({ R: 130, r: 36, tipRound: 12, waistRound: 6, tExtra: 14, shadowOffset: 12 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
 <g transform="translate(190,175)">${mi}
 </g>
 <text x="380" y="225" font-family="${FONT}" font-weight="900" font-size="195" letter-spacing="3"><tspan fill="${C.purple}">Larky</tspan><tspan fill="${C.coral}">GO</tspan></text>
 <text x="388" y="295" font-family="${FONT}" font-weight="800" font-size="35" letter-spacing="11" fill="${C.ink}" opacity=".72">GO OUT · PLAY NOW</text>
</svg>
`;
}

function stackedSVG() {
  const W = 680, H = 680;
  const mi = mark({ R: 150, r: 42, tipRound: 14, waistRound: 7, tExtra: 18, shadowOffset: 14 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
 <g transform="translate(${W / 2},270)">${mi}
 </g>
 <text x="${W / 2}" y="570" text-anchor="middle" font-family="${FONT}" font-weight="900" font-size="145" letter-spacing="4"><tspan fill="${C.purple}">Larky</tspan><tspan fill="${C.coral}">GO</tspan></text>
 <text x="${W / 2}" y="632" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="33" letter-spacing="11" fill="${C.ink}" opacity=".72">GO OUT · PLAY NOW</text>
</svg>
`;
}

function boardSVG() {
  const W = 1680, H = 1320;
  const chip = (x, y, w, h, fill, name, hex, textFill) =>
    `<g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" ry="24" fill="${fill}" stroke="${C.ink}" stroke-width="4"/>
      <text x="${x + w / 2}" y="${y + h / 2 - 6}" text-anchor="middle" font-family="${FONT}" font-weight="900" font-size="28" fill="${textFill || C.ink}">${name}</text>
      <text x="${x + w / 2}" y="${y + h / 2 + 28}" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="21" fill="${textFill || C.ink}" opacity=".7">${hex}</text>
    </g>`;

  let heroDots = '';
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++)
    heroDots += `<circle cx="${50 + i * 105}" cy="${50 + j * 105}" r="3" fill="${C.ink}"/>`;

  const heroMark = mark({ R: 220, r: 60, tipRound: 20, waistRound: 10, tExtra: 26, scale: 0.62, shadowOffset: 22 });
  const hzMark = mark({ R: 130, r: 36, tipRound: 12, waistRound: 6, tExtra: 14, scale: 0.62, shadowOffset: 12 });
  const stMark = mark({ R: 150, r: 42, tipRound: 14, waistRound: 7, tExtra: 18, scale: 0.78, shadowOffset: 14 });
  const symMark = mark({ R: 110, r: 30, tipRound: 10, waistRound: 5, tExtra: 12, shadowOffset: 10 });
  const sm = (R, rr, extra = {}) => mark({ R, r: rr, tipRound: 10, waistRound: 5, tExtra: 12, shadowOffset: 8, ...extra });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}">
 <rect width="${W}" height="${H}" fill="#E9E2D2"/>

 <text x="80" y="90" font-weight="900" font-size="54" fill="${C.ink}" letter-spacing="1">LarkyGO · Brand Mark</text>
 <text x="80" y="133" font-weight="700" font-size="25" fill="${C.ink}" opacity=".6">GO OUT · PLAY NOW</text>
 <line x1="80" y1="160" x2="${W - 80}" y2="160" stroke="${C.ink}" stroke-width="3" opacity=".2"/>

 <!-- LEFT: hero icon -->
 <g transform="translate(80,200)">
   <defs><clipPath id="hb"><rect width="500" height="500" rx="105" ry="105"/></clipPath></defs>
   <rect width="500" height="500" rx="105" ry="105" fill="${C.cream}" stroke="${C.ink}" stroke-width="9"/>
   <g clip-path="url(#hb)">
     <rect width="500" height="500" fill="${C.cream}"/>
     <g opacity=".14">${heroDots}</g>
     <g transform="translate(250,198)">${heroMark}
     </g>
     <text x="250" y="408" text-anchor="middle" font-weight="900" font-size="82" letter-spacing="3"><tspan fill="${C.purple}">Larky</tspan><tspan fill="${C.coral}">GO</tspan></text>
   </g>
 </g>

 <!-- LEFT: small sizes -->
 <g transform="translate(80,760)">
   <text font-weight="900" font-size="30" fill="${C.ink}">Small sizes</text>
   <g transform="translate(80,150)">${sm(80, 22)}</g>
   <g transform="translate(260,150)">${sm(68, 19)}</g>
   <g transform="translate(400,150)">${sm(54, 15)}</g>
   <g transform="translate(520,150)">${sm(42, 12, { accent: false })}</g>
 </g>

 <!-- LEFT: palette (2 rows, fits left column) -->
 <g transform="translate(80,1010)">
   <text font-weight="900" font-size="30" fill="${C.ink}">Palette</text>
   ${chip(0, 48, 170, 96, C.cream, 'CREAM', '#F7F2E9')}
   ${chip(186, 48, 170, 96, C.ink, 'INK', '#1C1726', C.cream)}
   ${chip(372, 48, 170, 96, C.purple, 'PURPLE', '#6C4DFF', C.cream)}
   ${chip(0, 162, 170, 96, C.coral, 'CORAL', '#FF5A36')}
   ${chip(186, 162, 170, 96, C.lime, 'LIME', '#A8E829')}
   ${chip(372, 162, 170, 96, '#FFFFFF', 'WHITE', '#FFFFFF')}
 </g>

 <!-- RIGHT: symbol + meaning -->
 <g transform="translate(680,200)">
   <text font-weight="900" font-size="32" fill="${C.ink}">Symbol · The Spark</text>
   <text y="42" font-size="24" fill="${C.ink}" opacity=".65">Sparkle burst with an off-centre spark —</text>
   <text y="76" font-size="24" fill="${C.ink}" opacity=".65">energy that jumped off the chart.</text>
   <g transform="translate(100,270)">${symMark}</g>
 </g>

 <!-- RIGHT: horizontal lockup -->
 <g transform="translate(680,590)">
   <rect width="920" height="200" rx="36" ry="36" fill="${C.cream}" stroke="${C.ink}" stroke-width="5"/>
   <g transform="translate(135,100)">${hzMark}
   </g>
   <text x="235" y="128" font-weight="900" font-size="100" letter-spacing="3"><tspan fill="${C.purple}">Larky</tspan><tspan fill="${C.coral}">GO</tspan></text>
   <text x="242" y="172" font-weight="800" font-size="23" letter-spacing="8" fill="${C.ink}" opacity=".7">GO OUT · PLAY NOW</text>
 </g>

 <!-- RIGHT: stacked lockup -->
 <g transform="translate(680,830)">
   <rect width="920" height="380" rx="36" ry="36" fill="${C.cream}" stroke="${C.ink}" stroke-width="5"/>
   <g transform="translate(460,155)">${stMark}
   </g>
   <text x="460" y="310" text-anchor="middle" font-weight="900" font-size="96" letter-spacing="4"><tspan fill="${C.purple}">Larky</tspan><tspan fill="${C.coral}">GO</tspan></text>
 </g>

 <text x="80" y="1290" font-size="22" fill="${C.ink}" opacity=".55">LarkyGO brand mark · Neo-Pop · 2026</text>
</svg>
`;
}

const files = {
  'symbol.svg': () => symbolSVG({}),
  'symbol-white.svg': () => symbolSVG({ color: '#FFFFFF', shadow: false, accent: false, shadowColor: 'none', shadowOffset: 0 }),
  'symbol-mono.svg': () => symbolSVG({ color: C.ink, shadow: false, accent: false, shadowColor: 'none', shadowOffset: 0 }),
  'symbol-coral.svg': () => symbolSVG({ color: C.coral, shadow: false, accent: false, shadowColor: 'none', shadowOffset: 0 }),
  'app-icon.svg': () => appIconSVG({ withRounded: true }),
  'app-icon-square.svg': () => appIconSVG({ withRounded: false }),
  'horizontal-lockup.svg': () => horizontalSVG(),
  'stacked-lockup.svg': () => stackedSVG(),
  'board.svg': () => boardSVG()
};

for (const [name, gen] of Object.entries(files)) {
  fs.writeFileSync(path.join(OUT, name), gen());
  console.log('OK:', name);
}
console.log('All SVGs written to', OUT);

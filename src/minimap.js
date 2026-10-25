// Minimap (sağ altta) ve M tuşuyla açılan dünya haritası.
// Adaların şekli kıyı çizgilerinden gelir (Lumière, Yùlóng, konumlu adalar: islands.mapShapes()); oyuncu ok olarak çizilir.
import { CHINA } from './china.js';
import { CAGE } from './sanctuary.js';

const LAND = '#a8b585', COAST = '#efe3b4', SHALLOW = 'rgba(70,160,180,.55)', WATER = '#164c68', GOLD = '#d4af37';

const CSS = `
#minimap{position:fixed;right:16px;bottom:16px;width:176px;height:176px;border-radius:50%;border:2px solid ${GOLD};box-shadow:0 4px 18px rgba(0,0,0,.55),inset 0 0 22px rgba(0,0,0,.45);background:${WATER};overflow:hidden;cursor:pointer;pointer-events:auto;z-index:6}
#minimap canvas{width:100%;height:100%;display:block}
#minimap .mm-n{position:absolute;left:50%;top:5px;transform:translateX(-50%);font:600 11px/1 var(--f-body,system-ui);letter-spacing:.08em;color:#fff;text-shadow:0 1px 3px #000;pointer-events:none}
#worldmap{position:fixed;inset:0;z-index:30;background:rgba(6,12,20,.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;backdrop-filter:blur(6px)}
#worldmap[hidden]{display:none}
#worldmap h2{margin:0;font-family:var(--f-display,serif);font-weight:400;font-size:26px;letter-spacing:.06em;color:${GOLD}}
#worldmap canvas{max-width:100%;border:1px solid ${GOLD};border-radius:3px;background:${WATER}}
#worldmap p{margin:0;font:12px/1.4 var(--f-body,system-ui);color:#cfd6df}
@media (pointer:coarse){#minimap{width:128px;height:128px;bottom:150px}}
`;

export function createMinimap({hero, getLook, getMode, sea, china, islands}){
  const hud = document.getElementById('hud');
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  const mini = document.createElement('div'); mini.id = 'minimap'; mini.title = 'Harita (M)';
  const mc = document.createElement('canvas'); mini.appendChild(mc);
  const n = document.createElement('span'); n.className = 'mm-n'; n.textContent = 'K'; mini.appendChild(n);
  hud.appendChild(mini);

  const big = document.createElement('div'); big.id = 'worldmap'; big.hidden = true;
  big.innerHTML = '<h2 id="wmTitle">Harita</h2>';
  const bc = document.createElement('canvas'); big.appendChild(bc);
  const hint = document.createElement('p'); hint.textContent = 'M ya da Esc: kapat · altın ok: sen · kuzey yukarıda'; big.appendChild(hint);
  document.body.appendChild(big);

  // başlık çubuğuna düğme (dokunmatik ve fare için)
  const tr = document.querySelector('.hud-tr');
  if (tr){ const b = document.createElement('button'); b.className = 'icon-btn'; b.type = 'button'; b.setAttribute('aria-label', 'Harita'); b.innerHTML = 'Harita <kbd>M</kbd>'; b.addEventListener('click', () => toggle()); tr.insertBefore(b, tr.firstChild); }

  const circle = c => { const pts = []; for (let i = 0; i < 120; i++) pts.push(c.point(i / 120 * Math.PI * 2, 0)); return pts; };
  const HOME = [
    {id:'lumiere', name:'Lumière Adası', rings:[circle(sea.coast)], pins:[{name:'Lumière Şatosu', x:0, z:-40}, {name:'Ejderha Kafesi', x:CAGE.x, z:CAGE.z}, {name:'Liman', x:sea.pier.end[0], z:sea.pier.end[1]}]},
    {id:'china', name:CHINA.name, rings:[circle(china.coast)], pins:[]},
  ];
  const shapes = () => islands.current === 'lumiere' ? HOME.concat(islands.mapShapes()) : islands.mapShapes();

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  function sizeCanvas(c, w, h){ if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)){ c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); } const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g; }

  /** Kara poligonlarını (halo + dolgu + kıyı) verilen dönüşümle çizer. */
  function drawLand(g, list, X, Y, s){
    g.lineJoin = 'round';
    list.forEach(sh => sh.rings.forEach(r => {
      g.beginPath(); r.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.closePath();
      g.strokeStyle = SHALLOW; g.lineWidth = Math.max(4, 36 * s); g.stroke();
    }));
    list.forEach(sh => sh.rings.forEach(r => {
      g.beginPath(); r.forEach((p, i) => i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))); g.closePath();
      g.fillStyle = LAND; g.fill(); g.strokeStyle = COAST; g.lineWidth = 1.4; g.stroke();
    }));
  }
  function drawArrow(g, x, y, ang, size){
    const dx = Math.sin(ang), dy = Math.cos(ang), px = -dy, py = dx;
    g.beginPath();
    g.moveTo(x + dx * size, y + dy * size);
    g.lineTo(x - dx * size * 0.7 + px * size * 0.62, y - dy * size * 0.7 + py * size * 0.62);
    g.lineTo(x - dx * size * 0.3, y - dy * size * 0.3);
    g.lineTo(x - dx * size * 0.7 - px * size * 0.62, y - dy * size * 0.7 - py * size * 0.62);
    g.closePath(); g.fillStyle = GOLD; g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#fff'; g.stroke();
  }

  function drawMini(){
    const W = 176, H = 176, g = sizeCanvas(mc, W, H), flying = getMode() === 'fly';
    const range = flying ? 650 : 280, s = (W / 2 - 4) / range, px = hero.pos.x, pz = hero.pos.z;
    g.fillStyle = WATER; g.fillRect(0, 0, W, H);
    const X = x => W / 2 + (x - px) * s, Y = z => H / 2 + (z - pz) * s;
    drawLand(g, shapes(), X, Y, s);
    drawArrow(g, W / 2, H / 2, getLook(), 8);
  }

  function drawBig(){
    const list = shapes();
    const w = Math.min(window.innerWidth - 32, 1100), h = Math.min(window.innerHeight - 120, w * 0.72);
    const g = sizeCanvas(bc, w, h); bc.style.width = w + 'px'; bc.style.height = h + 'px';
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    list.forEach(sh => sh.rings.forEach(r => r.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); })));
    const pad = 0.06, bw = (x1 - x0) * (1 + pad * 2), bh = (z1 - z0) * (1 + pad * 2), s = Math.min(w / bw, h / bh), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const X = x => w / 2 + (x - cx) * s, Y = z => h / 2 + (z - cz) * s;
    g.fillStyle = WATER; g.fillRect(0, 0, w, h);
    // 500 m'lik ızgara
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
    for (let gx = Math.ceil(x0 / 500) * 500; gx <= x1; gx += 500){ g.beginPath(); g.moveTo(X(gx), 0); g.lineTo(X(gx), h); g.stroke(); }
    for (let gz = Math.ceil(z0 / 500) * 500; gz <= z1; gz += 500){ g.beginPath(); g.moveTo(0, Y(gz)); g.lineTo(w, Y(gz)); g.stroke(); }
    drawLand(g, list, X, Y, s);
    g.font = '600 11px system-ui,sans-serif'; g.textBaseline = 'middle';
    const label = (txt, x, y, strong) => {
      g.font = (strong ? '700 14px' : '600 11px') + ' system-ui,sans-serif';
      const tw = g.measureText(txt).width; g.fillStyle = 'rgba(8,14,22,.72)'; g.fillRect(x - tw / 2 - 4, y - 9, tw + 8, 18);
      g.fillStyle = strong ? GOLD : '#fff'; g.textAlign = 'center'; g.fillText(txt, x, y);
    };
    list.forEach(sh => {
      sh.pins.forEach(p => { g.beginPath(); g.arc(X(p.x), Y(p.z), 3, 0, Math.PI * 2); g.fillStyle = '#e8483a'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1; g.stroke(); });
      sh.pins.forEach(p => { if (s * 1 > 0.05 || sh.pins.length < 6) label(p.name, X(p.x), Y(p.z) - 12, false); });
      let ax = 0, az = 0, c = 0; sh.rings.forEach(r => r.forEach(p => { ax += p[0]; az += p[1]; c++; })); ax /= c; az /= c;
      if (sh.id === 'china') label(sh.name, X(CHINA.x), Y(CHINA.z), true);
      else if (sh.id === 'lumiere') label(sh.name, X(0), Y(-472), true);
      else label(sh.name, X(ax), Y(az) + 24, true);
    });
    // 500 m ölçek çubuğu
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, h - 18); g.lineTo(14 + 500 * s, h - 18); g.stroke();
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '11px system-ui,sans-serif'; g.fillText('500 m', 14, h - 28);
    drawArrow(g, X(hero.pos.x), Y(hero.pos.z), getLook(), 12);
    document.getElementById('wmTitle').textContent = islands.current === 'lumiere' ? 'Lumière Takımadası' : (islands.list().find(d => d.id === islands.current) || {}).name || 'Harita';
  }

  function toggle(force){
    const open = force != null ? force : big.hidden;
    if (open && (hud.hidden || !['play', 'fly'].includes(getMode()))) return;
    big.hidden = !open; if (open) drawBig();
  }
  mini.addEventListener('click', () => toggle());
  big.addEventListener('click', e => { if (e.target === big) toggle(false); });
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (e.code === 'KeyM' && !e.repeat) toggle();
    else if (e.code === 'Escape' && !big.hidden){ toggle(false); e.stopPropagation(); }
  }, true);
  addEventListener('resize', () => { if (!big.hidden) drawBig(); });

  let acc = 0;
  return {
    toggle,
    update(dt){
      mini.style.display = hud.hidden || getMode() === 'cinematic' ? 'none' : '';
      acc += dt; if (acc < 0.09) return; acc = 0;
      if (!hud.hidden) drawMini();
      if (!big.hidden) drawBig();
    },
  };
}

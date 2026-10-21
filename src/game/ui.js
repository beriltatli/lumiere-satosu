// HUD, diyaloglar, görev günlüğü, pusula ve geçişler
import { RUNES, COIN_TOTAL } from './content.js';
import { PLACES } from '../court.js';

const $ = id => document.getElementById(id);
export const fmtTime = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60; return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0'); };

export class UI {
  constructor(audio){
    this.audio = audio; this.dialogOpen = false; this.closedAt = 0;
    const runes = $('runes');
    RUNES.forEach(r => { const d = document.createElement('div'); d.className = 'rune'; d.id = 'rn-' + r.id; d.style.setProperty('--c', r.color); d.title = r.name; runes.appendChild(d); });
    this.strip = $('compassStrip');
    const CARD = [['K', Math.PI, 1], ['KD', Math.PI * 0.75, 0], ['D', Math.PI / 2, 1], ['GD', Math.PI / 4, 0], ['G', 0, 1], ['GB', -Math.PI / 4, 0], ['B', -Math.PI / 2, 1], ['KB', -Math.PI * 0.75, 0]];
    this.cards = CARD.map(([t, a, big]) => { const e = document.createElement('span'); e.className = 'c-lbl' + (big ? ' card' : ''); e.textContent = t; this.strip.appendChild(e); return {e, a}; });
    this.mk = new Map();
    $('dialog').addEventListener('click', e => { if (e.target.closest('button')) return; this._advance && this._advance(); });
    // Yakalama aşamasında dinler; diyalog açıkken tuş oyun girdisine ulaşmaz (aynı E basışı konuşmayı yeniden başlatmasın)
    addEventListener('keydown', e => {
      if (!this.dialogOpen) return;
      if (['KeyE', 'Space', 'Enter', 'KeyF'].includes(e.code)){ e.preventDefault(); e.stopImmediatePropagation(); this._advance && this._advance(); }
      const m = /^Digit([1-4])$/.exec(e.code); if (m && this._choose){ e.stopImmediatePropagation(); this._choose(+m[1] - 1); }
    }, true);
  }
  toast(msg, ms = 2600){
    const t = $('toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(this._th); this._th = setTimeout(() => t.classList.remove('on'), ms);
  }
  setRunes(S){ RUNES.forEach(r => $('rn-' + r.id).classList.toggle('on', !!S.runes[r.id])); }
  runeFound(r, n){
    const e = $('rn-' + r.id); e.classList.add('on', 'pop'); setTimeout(() => e.classList.remove('pop'), 1000);
    this.toast(r.name + ' bulundu · ' + n + '/5', 3200);
  }
  coins(n, total = COIN_TOTAL){ $('coins').textContent = '⚜ ' + n + '/' + total; }
  stats(elapsed, weatherName){ $('clock').textContent = fmtTime(elapsed); $('weatherLbl').textContent = weatherName; }
  prompt(label, key = 'E'){
    const p = $('prompt'); if (!label){ p.hidden = true; return; }
    p.hidden = false; $('promptText').textContent = label; $('promptKey').textContent = key;
  }
  compass(lookAng, px, pz, markers){
    const W = this.strip.clientWidth, half = W / 2;
    const place = (e, a) => { let rel = Math.atan2(Math.sin(a - lookAng), Math.cos(a - lookAng)); const x = half - rel / (Math.PI / 2) * half; e.style.left = x + 'px'; e.style.display = Math.abs(rel) < Math.PI / 2 ? '' : 'none'; return rel; };
    this.cards.forEach(c => place(c.e, c.a));
    let best = null; const seen = new Set();
    markers.forEach(m => {
      seen.add(m.id);
      let e = this.mk.get(m.id);
      if (!m.show()){ if (e) e.style.display = 'none'; return; }
      if (!e){ e = document.createElement('span'); e.className = 'c-mk'; e.innerHTML = '<i></i><b></b>'; e.style.setProperty('--c', m.color); this.strip.appendChild(e); this.mk.set(m.id, e); }
      const a = Math.atan2(m.x - px, m.z - pz), d = Math.hypot(m.x - px, m.z - pz);
      place(e, a); e.querySelector('b').textContent = Math.round(d) + ' m';
      if (!m.minor && (!best || d < best.d)) best = {m, d};
    });
    this.mk.forEach((e, id) => { if (!seen.has(id)) e.style.display = 'none'; });
    $('objective').innerHTML = best ? '<b>' + best.m.label + '</b> · ' + Math.round(best.d) + ' m' : '';
  }
  journal(S, open){
    const j = $('journal'); if (open !== undefined) j.hidden = !open;
    if (j.hidden) return;
    const L = $('questList'); L.innerHTML = '';
    const add = (title, hint, done, color) => {
      const li = document.createElement('li'); if (done) li.className = 'done';
      li.innerHTML = '<span class="q-mark"></span><div><div class="q-title"></div><div class="q-hint"></div></div>';
      if (color) li.style.setProperty('--c', color);
      li.querySelector('.q-title').textContent = title; li.querySelector('.q-hint').innerHTML = hint; L.appendChild(li);
    };
    add('Ahır ustası Gaston ile konuş', 'Batıdaki ahırın önünde, at çitinin yanında bekliyor.', S.met, '#e8d3a0');
    if (S.met){
      RUNES.forEach(r => {
        let hint = r.hint;
        if (r.id === 'yakut' && S.notes.yakutRain && !S.runes.yakut) hint += ' <em>Yağmur dinince tekrar bak.</em>';
        if (r.id === 'ametist' && S.notes.gateDay && !S.runes.ametist) hint += ' <em>Güneş saatiyle zamanı geceye ilerletebilirsin.</em>';
        if (r.id === 'safir' && !S.runes.safir) hint += ' <em>Kapı terasın doğu ucunda.</em>';
        add(r.name, hint, S.runes[r.id], r.color);
      });
      const n = RUNES.filter(r => S.runes[r.id]).length;
      add('Kılıcı uyandır', 'Tapınaktaki kaideye beş rünü yerleştir. (' + n + '/5)', S.finished, '#ffffff');
      if (S.notes.cookQuest) add('Aşçı Marcel için portakal', 'Portakal serasında yere düşmüş olgun portakalları topla ve şatonun mutfağına götür. (' + Math.min(3, (S.notes.oranges || []).length) + '/3)', !!S.notes.coinMap, '#ff8a1a');
      if ((S.notes.places || []).length) add('Saray bahçelerini keşfet', 'Gül labirenti, gondol iskelesi, Zafer Takı, Ayna Galerisi, av köşkü, gizli geçitler… Pusuladaki altın işaretleri izle. (' + S.notes.places.length + '/' + PLACES.length + ')', S.notes.places.length >= PLACES.length, '#d4af37');
      if (S.notes.princess) add('Pyra\'nın yumurtası', S.notes.egg === 'tasiniyor' ? 'Mor yumurta sende. Doğudaki kubbeli ejderha kafesinin batı kapısına götür.' : 'Prenses Aurélie, ejderha Pyra\'nın kayıp mor yumurtasının Kelebek Vadisi\'ndeki şelalenin yanında olduğunu söyledi.', S.notes.egg === 'yuvada', '#b08aff');
    }
    $('journalFoot').innerHTML = '<span>⚜ Madalyon ' + S.coins.length + '/' + COIN_TOTAL + '</span><span>Süre ' + fmtTime(S.elapsed) + '</span>';
  }
  /** Satır satır diyalog; son seçilen seçeneğin sırasını döndürür. */
  dialog(lines){
    return new Promise(resolve => {
      const box = $('dialog'), nameEl = $('dlgName'), textEl = $('dlgText'), ch = $('dlgChoices'), next = $('dlgNext');
      this.dialogOpen = true; box.hidden = false; let i = -1, last = -1, typing = null;
      const show = () => {
        i++; if (i >= lines.length){ box.hidden = true; this.dialogOpen = false; this.closedAt = performance.now(); this._advance = this._choose = null; resolve(last); return; }
        const L = lines[i]; nameEl.textContent = L.name || ''; ch.innerHTML = ''; next.hidden = true;
        let k = 0; const full = L.text; textEl.textContent = '';
        clearInterval(typing);
        const done = () => {
          clearInterval(typing); typing = null; textEl.textContent = full;
          if (L.choices){
            L.choices.forEach((c, idx) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = '<kbd>' + (idx + 1) + '</kbd>'; b.append(document.createTextNode(c)); b.addEventListener('click', () => this._choose(idx)); ch.appendChild(b); });
            this._choose = idx => { if (idx >= L.choices.length) return; last = idx; this.audio.sfx('blip'); show(); };
          } else { next.hidden = false; this._choose = null; }
        };
        typing = setInterval(() => { k += 2; textEl.textContent = full.slice(0, k); if (k % 6 === 0) this.audio.sfx('blip'); if (k >= full.length) done(); }, 22);
        this._advance = () => { if (typing){ done(); return; } if (!L.choices) show(); };
      };
      show();
    });
  }
  async fade(fn){
    const f = $('fade'); f.classList.add('on'); await new Promise(r => setTimeout(r, 480));
    await fn(); await new Promise(r => setTimeout(r, 120)); f.classList.remove('on');
  }
  chipGroup(el, entries, startKey, onPick, swatch){
    el.innerHTML = '';
    const btns = entries.map(([key, p]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.id = el.id + '-' + key;
      if (swatch){ const s = document.createElement('span'); s.className = 'sw'; s.style.background = swatch(p); b.append(s); }
      b.append(document.createTextNode(p.name || p));
      b.addEventListener('click', () => { select(key); onPick(key); });
      el.appendChild(b); return [key, b];
    });
    const select = k => btns.forEach(([key, b]) => b.setAttribute('aria-pressed', key === k ? 'true' : 'false'));
    select(startKey); return {select};
  }
}

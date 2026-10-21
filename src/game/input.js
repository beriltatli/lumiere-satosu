// Klavye, fare ve dokunmatik girişi tek bir durumda toplar
export class Input {
  constructor(canvas){
    this.keys = new Set();
    this.move = {x:0, y:0};        // -1..1 (x: sağ, y: ileri)
    this.look = {dx:0, dy:0};      // bu karedeki kamera dönüşü (piksel)
    this.zoom = 0;
    this.run = false;
    this.pressed = new Set();      // bu karede basılan eylemler: interact, jump, journal, pause
    this.enabled = true;
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.joy = {id:null, ox:0, oy:0, x:0, y:0};
    this.lookTouch = null;
    this.touchRun = false;

    const ACT = {KeyE:'interact', Enter:'interact', Space:'jump', KeyJ:'journal', Tab:'journal', Escape:'pause', KeyP:'pause', KeyF:'interact', KeyV:'view', KeyH:'whistle', KeyC:'camera', KeyT:'time', KeyO:'photo'};
    addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (!e.repeat && ACT[e.code]) this.pressed.add(ACT[e.code]);
      if (/^Digit[1-4]$/.test(e.code)) this.pressed.add('choice' + e.code.slice(5));
      this.keys.add(e.code);
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    // fare: sürükleyerek kamera döndürme
    let drag = null;
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      drag = {x:e.clientX, y:e.clientY}; canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drag || e.pointerType === 'touch') return;
      this.look.dx += e.clientX - drag.x; this.look.dy += e.clientY - drag.y; drag = {x:e.clientX, y:e.clientY};
    });
    const end = e => { if (e.pointerType !== 'touch') drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('wheel', e => { this.zoom += Math.sign(e.deltaY); e.preventDefault(); }, {passive:false});

    // dokunmatik: sol yarı joystick, sağ yarı kamera
    const joyEl = document.getElementById('joy'), knob = document.getElementById('joyKnob');
    canvas.addEventListener('touchstart', e => {
      for (const t of e.changedTouches){
        if (t.clientX < innerWidth * 0.45 && this.joy.id === null){
          this.joy = {id:t.identifier, ox:t.clientX, oy:t.clientY, x:0, y:0};
          joyEl.style.left = t.clientX + 'px'; joyEl.style.top = t.clientY + 'px'; joyEl.classList.add('on');
        } else if (!this.lookTouch){ this.lookTouch = {id:t.identifier, x:t.clientX, y:t.clientY}; }
      }
      e.preventDefault();
    }, {passive:false});
    canvas.addEventListener('touchmove', e => {
      for (const t of e.changedTouches){
        if (t.identifier === this.joy.id){
          let dx = t.clientX - this.joy.ox, dy = t.clientY - this.joy.oy; const d = Math.hypot(dx, dy), R = 52;
          if (d > R){ dx *= R / d; dy *= R / d; }
          this.joy.x = dx / R; this.joy.y = -dy / R; knob.style.transform = `translate(${dx}px, ${dy}px)`;
        } else if (this.lookTouch && t.identifier === this.lookTouch.id){
          this.look.dx += (t.clientX - this.lookTouch.x) * 1.3; this.look.dy += (t.clientY - this.lookTouch.y) * 1.3;
          this.lookTouch.x = t.clientX; this.lookTouch.y = t.clientY;
        }
      }
      e.preventDefault();
    }, {passive:false});
    const tend = e => {
      for (const t of e.changedTouches){
        if (t.identifier === this.joy.id){ this.joy = {id:null, ox:0, oy:0, x:0, y:0}; knob.style.transform = ''; joyEl.classList.remove('on'); }
        if (this.lookTouch && t.identifier === this.lookTouch.id) this.lookTouch = null;
      }
    };
    canvas.addEventListener('touchend', tend); canvas.addEventListener('touchcancel', tend);

    // ekran butonları
    document.querySelectorAll('[data-act]').forEach(b => {
      const act = b.dataset.act;
      b.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        if (act === 'run'){ this.touchRun = !this.touchRun; b.setAttribute('aria-pressed', String(this.touchRun)); }
        else this.pressed.add(act);
      });
    });
  }
  /** Her karenin başında çağrılır. */
  poll(){
    const k = this.keys;
    let x = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let y = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0);
    if (this.joy.id !== null){ x = this.joy.x; y = this.joy.y; }
    const len = Math.hypot(x, y); if (len > 1){ x /= len; y /= len; }
    this.move.x = this.enabled ? x : 0; this.move.y = this.enabled ? y : 0;
    this.run = k.has('ShiftLeft') || k.has('ShiftRight') || this.touchRun || (this.joy.id !== null && Math.hypot(this.joy.x, this.joy.y) > 0.95);
  }
  /** Karenin sonunda tek seferlik girdileri temizler. */
  endFrame(){ this.pressed.clear(); this.look.dx = this.look.dy = 0; this.zoom = 0; }
  take(act){ if (this.pressed.has(act)){ this.pressed.delete(act); return true; } return false; }
}

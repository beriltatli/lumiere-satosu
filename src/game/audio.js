// Tüm sesler Web Audio ile üretilir: ortam, adımlar, efektler ve barok tarzda müzik
export class Audio {
  constructor(){ this.ctx = null; this.music = 0.5; this.sfxVol = 0.8; this.started = false; }
  start(){
    if (this.ctx){ this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = this.ctx = new AC();
    this.master = c.createGain(); this.master.gain.value = 0.9; this.master.connect(c.destination);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.music * 0.55; this.musicBus.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxVol; this.sfxBus.connect(this.master);
    // oda yankısı (müzik için)
    const conv = c.createConvolver(); conv.buffer = this.impulse(2.2); const wet = c.createGain(); wet.gain.value = 0.35;
    this.musicBus.connect(conv); conv.connect(wet); wet.connect(this.master);
    this.noiseBuf = this.makeNoise(2);
    this.amb = {
      wind: this.loopNoise('bandpass', 420, 0.6),
      rain: this.loopNoise('highpass', 1800, 0.4),
      water: this.loopNoise('bandpass', 1100, 0.9),
    };
    this.started = true;
    this.nextNote = c.currentTime + 0.3; this.step = 0; this.bar = 0;
    this.birdT = 2;
  }
  setVolumes(music, sfx){
    this.music = music; this.sfxVol = sfx;
    if (!this.ctx) return;
    this.musicBus.gain.setTargetAtTime(music * 0.55, this.ctx.currentTime, 0.1);
    this.sfxBus.gain.setTargetAtTime(sfx, this.ctx.currentTime, 0.1);
  }
  impulse(sec){
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++){ const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    return b;
  }
  makeNoise(sec){
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let last = 0; for (let i = 0; i < n; i++){ const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.6 + last * 3; }
    return b;
  }
  loopNoise(type, freq, q){
    const c = this.ctx, src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start();
    return {g, f};
  }
  /** Ortam seslerini dünyaya göre ayarla (her kare). */
  ambience(dt, {wind, rain, fountainDist, night, indoorsHigh, indoor, city = 0, surf = 0}){
    if (!this.ctx) return;
    if (indoor){ wind *= 0.18; rain *= 0.3; fountainDist = 999; }
    const t = this.ctx.currentTime, A = this.amb;
    A.wind.g.gain.setTargetAtTime(0.05 + wind * 0.22 + (indoorsHigh ? 0.12 : 0), t, 0.3);
    A.wind.f.frequency.setTargetAtTime(300 + wind * 500 + Math.sin(t * 0.7) * 80, t, 0.5);
    A.rain.g.gain.setTargetAtTime(rain * 0.35, t, 0.4);
    A.water.g.gain.setTargetAtTime(Math.max(0, 1 - fountainDist / 22) * 0.25, t, 0.2);
    // Yeni Dünya: şehir uğultusu (alçak geçiren gürültü) ve kıyıda dalga (yavaş dalgalanan bant geçiren gürültü)
    if (!A.city){ A.city = this.loopNoise('lowpass', 160, 0.7); A.surf = this.loopNoise('bandpass', 520, 0.6); }
    A.city.g.gain.setTargetAtTime(indoor ? 0 : city * 0.16, t, 0.6);
    A.surf.g.gain.setTargetAtTime(indoor ? 0 : surf * (0.08 + 0.07 * Math.sin(t * 0.55) ** 2), t, 0.3);
    // kuşlar: gündüz ve yağmursuz
    this.birdT -= dt;
    if (this.birdT < 0){ this.birdT = 1.5 + Math.random() * 5; if (night < 0.4 && rain < 0.3 && !indoor) this.chirp(); }
    this.schedule(night, rain);
  }
  env(g, t, a, d, peak){ g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  tone(freq, dur, type = 'sine', vol = 0.2, when = 0, bus){
    const c = this.ctx, t = c.currentTime + when, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.connect(g); g.connect(bus || this.sfxBus);
    this.env(g, t, 0.008, dur, vol); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  burst(freq, q, dur, vol, type = 'bandpass', when = 0){
    const c = this.ctx, t = c.currentTime + when, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); s.connect(f); f.connect(g); g.connect(this.sfxBus);
    this.env(g, t, 0.004, dur, vol); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  chirp(){
    const c = this.ctx, n = 2 + Math.floor(Math.random() * 4), base = 2600 + Math.random() * 1600;
    for (let i = 0; i < n; i++){
      const t = c.currentTime + i * 0.11, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), t + 0.07);
      o.connect(g); g.connect(this.sfxBus); this.env(g, t, 0.01, 0.07, 0.025); o.start(t); o.stop(t + 0.1);
    }
  }
  sfx(name, opt){
    if (!this.ctx) return;
    switch (name){
      case 'step': this.burst(opt && opt.soft ? 700 : 2400, opt && opt.soft ? 1.2 : 0.8, 0.07, opt && opt.soft ? 0.12 : 0.16); break;
      case 'hoof': this.tone(180, 0.06, 'triangle', 0.25); this.burst(1500, 2, 0.04, 0.12, 'bandpass', 0.07); break;
      case 'gallop': [0, 0.06, 0.12].forEach((w, i) => this.tone(160 + i * 15, 0.05, 'triangle', 0.22, w)); break;
      case 'jump': this.burst(900, 1, 0.12, 0.08, 'lowpass'); break;
      case 'land': this.burst(400, 1, 0.12, 0.2, 'lowpass'); break;
      case 'coin': [1318, 1760, 2637].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.12, i * 0.06)); break;
      case 'rune': [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => { this.tone(f, 0.9, 'sine', 0.12, i * 0.09); this.tone(f * 2, 0.5, 'triangle', 0.04, i * 0.09); }); break;
      case 'blip': this.tone(880 + Math.random() * 120, 0.03, 'square', 0.025); break;
      case 'open': this.tone(110, 1.2, 'sawtooth', 0.06); this.burst(300, 0.6, 1.4, 0.12, 'lowpass'); break;
      case 'wrong': this.tone(220, 0.25, 'square', 0.06); this.tone(185, 0.35, 'square', 0.06, 0.18); break;
      case 'quest': [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.1, i * 0.12)); break;
      case 'awaken': [130.8, 164.8, 196, 261.6, 329.6, 392, 523.3].forEach((f, i) => { this.tone(f, 3.2, 'sawtooth', 0.035, i * 0.18, this.musicBus); this.tone(f * 2, 2.6, 'sine', 0.05, i * 0.18); }); break;
      case 'roar': {
        const c = this.ctx, t = c.currentTime;
        [[70, 'sawtooth', 0.16], [104, 'square', 0.06], [52, 'sawtooth', 0.12]].forEach(([f, ty, v]) => {
          const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(260, t + 2.2);
          o.type = ty; o.frequency.setValueAtTime(f * 1.4, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.5); o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 2.2);
          o.connect(lp); lp.connect(g); g.connect(this.sfxBus); this.env(g, t, 0.15, 2.1, v); o.start(t); o.stop(t + 2.4);
        });
        this.burst(500, 0.7, 2.0, 0.22, 'lowpass'); this.burst(1800, 1.5, 1.6, 0.08, 'bandpass', 0.3); break;
      }
      case 'whistle': this.tone(1900, 0.18, 'sine', 0.1); this.tone(2500, 0.32, 'sine', 0.1, 0.2); break;
      case 'whoosh': this.burst(600, 0.5, 0.6, 0.15, 'bandpass'); break;
      // Yùlóng Adası: gong, tapınak çanı, davul, rüzgâr çanı, bambu tıkırtısı
      case 'gong': [[98, 2.4, 0.16], [151, 2.0, 0.08], [233, 1.6, 0.05], [367, 1.2, 0.03]].forEach(([f, d, v]) => this.tone(f, d * 1.6, 'sine', v)); this.burst(300, 0.8, 0.5, 0.1, 'lowpass'); break;
      case 'bell': [[62, 5, 0.18], [124.6, 4, 0.08], [171, 3.5, 0.05], [262, 2.6, 0.035], [418, 1.8, 0.02]].forEach(([f, d, v]) => this.tone(f, d, 'sine', v)); this.burst(180, 1, 0.3, 0.12, 'lowpass'); break;
      case 'drum': this.tone(70, 0.22, 'triangle', 0.22); this.tone(52, 0.3, 'sine', 0.2); this.burst(220, 1, 0.12, 0.12, 'lowpass'); break;
      case 'chime': [1568, 2093, 2349, 2637, 3136].forEach((f, i) => this.tone(f * (1 + (Math.random() - 0.5) * 0.01), 1.2, 'sine', 0.035, i * 0.09 + Math.random() * 0.05)); break;
      case 'wood': this.tone(420 + Math.random() * 260, 0.05, 'triangle', 0.05); this.burst(1200, 3, 0.04, 0.05); break;
    }
  }
  /** Klavsen benzeri kısa nota (müzik veriyolunda). */
  pluck(freq, t, vol = 0.12, dur = 0.9){
    const c = this.ctx, o = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = freq; o2.frequency.value = freq * 2.001;
    f.type = 'lowpass'; f.frequency.setValueAtTime(Math.min(freq * 9, 18000), t); f.frequency.exponentialRampToValueAtTime(freq * 1.5, t + dur * 0.6);
    const g2 = c.createGain(); g2.gain.value = 0.25;
    o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.musicBus);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  /** Yeni Dünya: sallantılı (swing) caz. Yürüyen bas, ride zili, 2. ve 4. vuruşta piyano akorları; ii–V–I–VI. */
  jazz(night, mtof){
    const c = this.ctx, bpm = night > 0.5 ? 92 : 118, beat = 60 / bpm;
    const PROG = [[55, 58, 62, 65], [48, 52, 55, 58], [53, 57, 60, 64], [50, 54, 57, 60]];   // Gm7, C7, Fmaj7, D7
    while (this.nextNote < c.currentTime + 0.25){
      const bar = this.bar, b = this.step % 4, ch = PROG[Math.floor(bar / 1) % PROG.length], t = this.nextNote;
      // yürüyen bas: kök, üçlü, beşli, bir sonrakine yaklaşan nota
      const nextRoot = PROG[(Math.floor(bar) + 1) % PROG.length][0];
      const bassNote = [ch[0], ch[1], ch[2], nextRoot + (nextRoot > ch[2] ? -1 : 1)][b] - 12;
      this.pluck(mtof(bassNote), t, 0.08, beat * 0.9);
      // ride zili: düz ve sallantılı sekizlik (2/3 – 1/3)
      this.burstAt(t, 7000, 0.04, 0.025); if (b % 2 === 1) this.burstAt(t + beat * 2 / 3, 7000, 0.03, 0.018);
      // piyano: 2 ve 4'te kısa akor
      if (b === 1 || b === 3) ch.slice(1).forEach(n => this.pluck(mtof(n + 12), t + (b === 3 ? beat * 0.66 : 0), 0.022, beat * 0.6));
      this.nextNote += beat; this.step++; if (this.step % 4 === 0) this.bar++;
    }
  }
  burstAt(t, freq, dur, vol){
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = c.createGain(); s.connect(f); f.connect(g); g.connect(this.musicBus);
    this.env(g, t, 0.002, dur, vol); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  schedule(night, rain){
    const c = this.ctx; if (this.music <= 0.001) { this.nextNote = c.currentTime + 0.2; return; }
    const minor = night > 0.5 || rain > 0.5;
    const bpm = minor ? 66 : 84, s16 = 60 / bpm / 4;
    // akor dizisi (Re majör / Si minör)
    const MAJ = [[62, 66, 69], [67, 71, 74], [69, 73, 76], [62, 66, 69], [71, 74, 78], [67, 71, 74], [64, 67, 71], [69, 73, 76]];
    const MIN = [[59, 62, 66], [55, 59, 62], [54, 57, 61], [59, 62, 66], [52, 55, 59], [55, 59, 62], [54, 58, 61], [59, 62, 66]];
    // Yùlóng Adası'nda pentatonik (Re-Mi-Fa#-La-Si), guzheng benzeri seyrek tellemeler
    const PENT = [[62, 64, 69], [57, 62, 66], [59, 64, 66], [62, 66, 69], [64, 69, 71], [57, 64, 66], [59, 62, 66], [62, 64, 69]];
    const cin = this.style === 'cin';
    const prog = cin ? PENT : minor ? MIN : MAJ;
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    if (this.style === 'amerika'){ this.jazz(night, mtof); return; }
    while (this.nextNote < c.currentTime + 0.25){
      const chord = prog[this.bar % prog.length], st = this.step % 16;
      const pat = [0, 1, 2, 1, 0, 1, 2, 3, 0, 1, 2, 1, 2, 1, 0, 3];
      const idx = pat[st], note = idx === 3 ? chord[0] + 12 : chord[idx];
      if (cin ? (st % 4 !== 3 || this.bar % 2) : (!minor || st % 2 === 0)) this.pluck(mtof(note + 12), this.nextNote, cin ? 0.05 : 0.06, cin ? 1.5 : minor ? 1.2 : 0.7);
      if (st === 0 || st === 8) this.pluck(mtof(chord[0] - 12), this.nextNote, 0.09, 1.6);
      if (st === 0 && this.bar % 2 === 0) this.pluck(mtof(chord[2] + 24), this.nextNote + s16 * 2, 0.035, 1.4);
      this.nextNote += s16; this.step++; if (this.step % 16 === 0) this.bar++;
    }
  }
}

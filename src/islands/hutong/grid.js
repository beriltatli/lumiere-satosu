// Yerleşim matrisi: adayı kare hücrelere böler, her hücre tek bir etiket taşır.
// Yapılar önce matristen yer "ayırır", sonra çizilir; böylece hiçbir şey üst üste binmez ve kıyıya taşmaz.
// Sıra önemlidir: anıtlar → meydanlar → sokaklar → parseller → doğa. Önce ayıran kazanır.

export const TAG = {FREE:0, SEA:1, STREET:2, LOT:3, LANDMARK:4, WATER:5, NATURE:6, PLAZA:7, CANAL:8, QUAY:9};

export class SiteGrid {
  /** coast.dist(x, z) > -margin olan hücreler SEA olur: kıyıya margin metreden yakın yere yapı konmaz. */
  constructor({size = 560, cell = 2, coast = null, margin = 25} = {}){
    this.cell = cell; this.half = size / 2; this.n = Math.ceil(size / cell);
    this.cells = new Uint8Array(this.n * this.n);
    if (coast) for (let j = 0; j < this.n; j++) for (let i = 0; i < this.n; i++)
      if (coast.dist(this.cx(i), this.cx(j)) > -margin) this.cells[j * this.n + i] = TAG.SEA;
  }
  ix(v){ return Math.max(0, Math.min(this.n - 1, Math.floor((v + this.half) / this.cell))); }
  cx(i){ return (i + 0.5) * this.cell - this.half; }
  get(x, z){ return this.cells[this.ix(z) * this.n + this.ix(x)]; }

  /** Dikdörtgenin kapladığı hücreleri gezer; fn false döndürürse durur. */
  each(x0, z0, x1, z1, fn){
    const i0 = this.ix(Math.min(x0, x1)), i1 = this.ix(Math.max(x0, x1) - 1e-6);
    const j0 = this.ix(Math.min(z0, z1)), j1 = this.ix(Math.max(z0, z1) - 1e-6);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (fn(j * this.n + i) === false) return false;
    return true;
  }
  /** Bütün hücreler allow listesindeyse true. */
  isFree(x0, z0, x1, z1, allow = [TAG.FREE]){ return this.each(x0, z0, x1, z1, k => allow.includes(this.cells[k])); }
  fill(x0, z0, x1, z1, tag){ this.each(x0, z0, x1, z1, k => { this.cells[k] = tag; }); }
  /** Yalnız "over" etiketli hücreleri boyar (sokak meydanı ezmesin, denize taşmasın). */
  paint(x0, z0, x1, z1, tag, over = [TAG.FREE]){ this.each(x0, z0, x1, z1, k => { if (over.includes(this.cells[k])) this.cells[k] = tag; }); }
  /** Ya hepsi ya hiçbiri: alan boşsa etiketler ve true döner, değilse hiçbir hücreye dokunmaz. */
  reserve(x0, z0, x1, z1, tag, allow = [TAG.FREE]){
    if (!this.isFree(x0, z0, x1, z1, allow)) return false;
    this.fill(x0, z0, x1, z1, tag); return true;
  }
  /** Daire biçimli ayırma (tulou, tapınak, gölet). */
  reserveCircle(x, z, r, tag, allow = [TAG.FREE]){
    const cells = [];
    this.each(x - r, z - r, x + r, z + r, k => { const i = k % this.n, j = (k / this.n) | 0; if (Math.hypot(this.cx(i) - x, this.cx(j) - z) <= r) cells.push(k); });
    if (!cells.every(k => allow.includes(this.cells[k]))) return false;
    cells.forEach(k => { this.cells[k] = tag; }); return true;
  }

  /** Su kanalı hücresi mi? Kanal kenarı dizilimi (water.js) bununla kıyıyı bulur. */
  isWaterChannel(x, z){ return this.get(x, z) === TAG.CANAL; }
  /** Bir noktadan verilen yöne (dx, dz) ilerleyince kanala kaç metrede varılır (maxD içinde yoksa Infinity). */
  toChannel(x, z, dx, dz, maxD = 12){
    for (let d = 0; d <= maxD; d += this.cell / 2) if (this.isWaterChannel(x + dx * d, z + dz * d)) return d;
    return Infinity;
  }

  /** Hata ayıklama: matrisi küçük bir tuvale çizer. Konsolda görmek için:
   *  document.body.appendChild(grid.toCanvas()).style.cssText = 'position:fixed;left:8px;top:8px;z-index:99;image-rendering:pixelated;width:420px' */
  toCanvas(){
    const COL = ['#d8d3b8', '#2a6f9a', '#6d6f73', '#b8463a', '#e2a82a', '#3aa4a0', '#5f8f3a', '#c9a86a', '#2f8fd0', '#a9a39a'];
    const c = document.createElement('canvas'); c.width = c.height = this.n; const g = c.getContext('2d');
    for (let j = 0; j < this.n; j++) for (let i = 0; i < this.n; i++){ g.fillStyle = COL[this.cells[j * this.n + i]]; g.fillRect(i, j, 1, 1); }
    return c;
  }
}

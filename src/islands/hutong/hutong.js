// Hutong mahallesi planlayıcısı. Yalnız veri üretir (sokaklar, parseller, adresler); çizim arch.js'te.
// Böylece aynı plan 3B sahnede, haritada ya da görev mantığında (adres bulma) kullanılabilir.
//
//   x = 0'da kuzey-güney ana cadde (dàjiē), ondan doğuya ve batıya doğu-batı hutonglar uzanır:
//
//   hutong 0 ═══════════════════════════════════  (z = zTop)
//     │ kuzey sıra: kapı kuzeye, hutong 0'a açılır (kapı KB köşede) · çift numara
//     │ güney sıra: kapı güneye, hutong 1'e açılır (kapı GD köşede) · tek numara
//   hutong 1 ═══════════════════════════════════  (z = zTop + pitch)
//     ...
//
//   Sıraları dar ara sokaklar (xiàng) keser: "geçit" olanlar iki hutongu bağlar, "çıkmaz" olanlar
//   tek sırayı keser ve bir duvarda biter (死胡同). Her bant ve yanda en az bir geçit vardır, ana cadde
//   de bütün hutongları kestiği için ağ her zaman bağlıdır.
//   Siheyuan'ın ana salonu (正房) kapı hangi yönde olursa olsun avlunun kuzeyinde durur ve güneye bakar.
import { TAG } from './grid.js';

export function planHutong(grid, rnd, o){
  const {xMax, zTop, zEnd, bands, rowDepth, hutongW, dajieW, xiangW, lotMin, lotMax, names, plazas = []} = o;
  const pitch = rowDepth * 2 + hutongW, inner = dajieW / 2;
  const streets = [], lots = [];
  // her kenar hücre sınırına oturmalı, yoksa komşu iki parsel aynı hücreyi ister ve biri düşer
  const q = v => Math.round(v / grid.cell) * grid.cell;

  // 1. meydanlar ve ana cadde
  plazas.forEach(p => grid.paint(p.x0, p.z0, p.x1, p.z1, TAG.PLAZA));
  streets.push({id:'dajie', kind:'dajie', name:'Dàjiē', x0:-inner, x1:inner, z0:zTop - hutongW / 2, z1:zEnd});
  grid.paint(-inner, zTop - hutongW / 2, inner, zEnd, TAG.STREET);

  // 2. hutonglar: her biri ana caddenin iki yanında ayrı bir sokak (Xī = batı, Dōng = doğu)
  const hut = [];
  for (let k = 0; k <= bands; k++){
    const z = zTop + k * pitch;
    hut[k] = {};
    [-1, 1].forEach(side => {
      // denize ya da başka bir alana çarpana dek dışarı uzan
      let reach = inner;
      while (reach < xMax && grid.get(side * (reach + grid.cell / 2), z) !== TAG.SEA) reach += grid.cell;
      const s = {id:'h' + k + (side < 0 ? 'w' : 'e'), kind:'hutong', k, side, reach,
        name:(side < 0 ? 'Xī ' : 'Dōng ') + names[k].py + ' Hútòng', tr:(side < 0 ? 'Batı ' : 'Doğu ') + names[k].tr + ' Hutongu',
        x0:side < 0 ? -reach : inner, x1:side < 0 ? -inner : reach, z0:z - hutongW / 2, z1:z + hutongW / 2};
      grid.paint(s.x0, s.z0, s.x1, s.z1, TAG.STREET);
      streets.push(s); hut[k][side] = s;
    });
  }

  // 3. bantlar: iki sıra parsel, ara sokaklarla kesilmiş
  const partition = len => {
    const out = []; let rem = len;
    while (rem >= lotMin){
      let w = q(lotMin + rnd() * (lotMax - lotMin));
      if (rem - w < lotMin) w = rem <= lotMax * 1.3 ? rem : q(rem / 2);
      out.push(w); rem -= w;
    }
    return {widths:out, rest:rem};
  };
  for (let b = 0; b < bands; b++){
    const zA = zTop + b * pitch + hutongW / 2, zB = zA + rowDepth * 2;
    [-1, 1].forEach(side => {
      const outer = Math.min(hut[b][side].reach, hut[b + 1][side].reach);
      if (outer - inner < lotMin) return;
      const through = [];
      for (let u = inner + 26 + rnd() * 20; u < outer - 22; u += 34 + rnd() * 30) through.push(q(u));
      if (!through.length && outer - inner > lotMin * 2 + xiangW) through.push(q((inner + outer) / 2));
      through.forEach(u => addXiang(side, u, zA, zB, false));

      const rows = [
        {z0:zA, z1:zA + rowDepth, gate:'N', street:hut[b][side]},        // kuzey sıra → kuzeydeki hutong
        {z0:zA + rowDepth, z1:zB, gate:'S', street:hut[b + 1][side]},    // güney sıra → güneydeki hutong
      ];
      rows.forEach(row => {
        // çıkmaz sokaklar: yalnız bu sırayı keser, hutongdan girip arka duvarda biter
        const cuts = through.slice();
        for (let i = 0; i <= through.length; i++){
          const a = i === 0 ? inner : through[i - 1], c = i < through.length ? through[i] : outer;
          if (c - a > lotMin * 2 + xiangW * 2 && rnd() < 0.45){ const u = q(a + (c - a) * (0.35 + rnd() * 0.3)); cuts.push(u); addXiang(side, u, row.z0, row.z1, true, row.gate); }
        }
        cuts.sort((p, q) => p - q);
        const edges = [inner, ...cuts.flatMap(u => [u - xiangW / 2, u + xiangW / 2]), outer];
        for (let e = 0; e < edges.length; e += 2){
          let a = edges[e]; const {widths} = partition(edges[e + 1] - a);
          widths.forEach(w => {
            const x0 = side > 0 ? a : -(a + w), x1 = side > 0 ? a + w : -a; a += w;
            if (!grid.reserve(x0, row.z0, x1, row.z1, TAG.LOT)) return;    // meydana, denize ya da anıta denk geldi: boş arsa kalır
            lots.push({id:'p' + lots.length, x0, x1, z0:row.z0, z1:row.z1, gate:row.gate, street:row.street, side, band:b});
          });
        }
      });
    });
  }

  function addXiang(side, u, z0, z1, dead, gate){
    const x0 = side > 0 ? u - xiangW / 2 : -(u + xiangW / 2);
    streets.push({id:'x' + streets.length, kind:'xiang', dead, gate, side, x0, x1:x0 + xiangW, z0, z1});
    grid.paint(x0, z0, x0 + xiangW, z1, TAG.STREET);
  }

  // 4. kapı noktası ve adres: kapının hutong tarafındaki dış noktası; numaralar ana caddeden dışarı artar,
  //    hutongun kuzey yakası tek, güney yakası çift numara alır
  lots.forEach(l => {
    const gx = l.gate === 'S' ? l.x1 - 2.4 : l.x0 + 2.4;
    l.door = {x:gx, z:l.gate === 'S' ? l.z1 : l.z0};
  });
  streets.filter(s => s.kind === 'hutong').forEach(s => {
    const mine = lots.filter(l => l.street === s).sort((p, q) => Math.abs(p.door.x) - Math.abs(q.door.x));
    let odd = 1, even = 2;
    mine.forEach(l => {
      if (l.gate === 'S'){ l.no = odd; odd += 2; } else { l.no = even; even += 2; }
      l.address = s.name + ' No. ' + l.no;
    });
  });
  return {streets, lots, pitch};
}

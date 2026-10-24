// Bitki örtüsü: her tür ve parça tek InstancedMesh (Batcher.instance). Rüzgârda sallanan tepeler world.windMat ile.
//  palmiye (Miami, NOLA), yosunlu meşe (New Orleans: İspanyol yosunu sarkar), sonbahar ağacı (Boston),
//  park ağacı, çam (Rushmore), saguaro kaktüsü (Route 66), muz (avlular).
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function makeFlora(THREE, M, windMat){
  const lin = M.lin, nonIdx = g => (g.index ? g.toNonIndexed() : g);
  const merge = list => mergeBufferGeometries(list.map(nonIdx));
  const leafTex = M.tex(64, 128, (g) => { g.clearRect(0, 0, 64, 128); g.fillStyle = '#ffffff'; g.fillRect(30, 0, 4, 128); for (let y = 6; y < 124; y += 5){ const w = 26 * Math.sin(y / 128 * Math.PI); g.beginPath(); g.moveTo(32, y); g.lineTo(32 - w, y + 9); g.lineTo(32 - w + 3, y + 11); g.lineTo(32, y + 4); g.moveTo(32, y); g.lineTo(32 + w, y + 9); g.lineTo(32 + w - 3, y + 11); g.lineTo(32, y + 4); g.fill(); } }, [1, 1], true);
  leafTex.wrapS = leafTex.wrapT = THREE.ClampToEdgeWrapping;
  const mossTex = M.tex(64, 128, (g) => { g.clearRect(0, 0, 64, 128); for (let i = 0; i < 40; i++){ const x = 4 + Math.random() * 56, l = 40 + Math.random() * 80; g.strokeStyle = `rgba(${170 + Math.random() * 40 | 0},${180 + Math.random() * 30 | 0},${160 | 0},.9)`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + (Math.random() - 0.5) * 12, l / 2, x + (Math.random() - 0.5) * 8, l); g.stroke(); } }, [1, 1], true);
  mossTex.wrapS = mossTex.wrapT = THREE.ClampToEdgeWrapping;
  const mats = {
    bark:new THREE.MeshStandardMaterial({color:lin(0x5a4636), roughness:0.95}),
    palmBark:new THREE.MeshStandardMaterial({color:lin(0x8a7458), roughness:0.9}),
    leaf:windMat(new THREE.MeshStandardMaterial({map:leafTex, color:0xffffff, alphaTest:0.4, side:THREE.DoubleSide, roughness:0.8}), 0.8),
    crown:windMat(new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.85, flatShading:true}), 0.6),
    moss:windMat(new THREE.MeshStandardMaterial({map:mossTex, color:0xffffff, alphaTest:0.35, side:THREE.DoubleSide, roughness:1}), 1.2),
    cactus:new THREE.MeshStandardMaterial({color:lin(0x4f7a3a), roughness:0.8}),
  };
  // geometriler (bir kez)
  const G = {};
  {
    const curve = new THREE.CatmullRomCurve3([[0, 0, 0], [0.3, 3, 0], [0.9, 6, 0], [1.6, 8.4, 0]].map(p => new THREE.Vector3(...p)));
    G.palmTrunk = new THREE.TubeGeometry(curve, 10, 0.2, 6);
    const fr = []; for (let i = 0; i < 9; i++){ const a = i / 9 * Math.PI * 2, p = new THREE.PlaneGeometry(1.0, 3.6, 1, 3); const pos = p.attributes.position; for (let k = 0; k < pos.count; k++){ const y = pos.getY(k) + 1.8; pos.setY(k, y); pos.setZ(k, -y * y * 0.12); } p.rotateX(-1.0); p.rotateY(a); p.translate(1.6, 8.4, 0); fr.push(p); }
    G.palmFronds = merge(fr);
    G.oakTrunk = merge([new THREE.CylinderGeometry(0.35, 0.6, 3, 7).translate(0, 1.5, 0), new THREE.CylinderGeometry(0.18, 0.28, 4, 6).rotateZ(1.1).translate(1.6, 3.4, 0), new THREE.CylinderGeometry(0.18, 0.28, 4, 6).rotateZ(-1.0).translate(-1.5, 3.3, 0.3)]);
    G.oakCrown = merge([[0, 0, 0, 2.6], [2.4, -0.3, 0.6, 2.0], [-2.4, -0.2, -0.4, 2.1], [0.6, 0.4, 2.0, 1.8], [-0.4, 0.2, -2.1, 1.9]].map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 1).scale(1, 0.55, 1).translate(x, y + 4.6, z)));
    const ms = []; for (let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2, r = 1.2 + (i % 3) * 0.9, p = new THREE.PlaneGeometry(0.9, 2.2); p.translate(0, -1.1, 0); p.rotateY(a); p.translate(Math.sin(a) * r, 4.2, Math.cos(a) * r); ms.push(p); }
    G.moss = merge(ms);
    G.trunk = new THREE.CylinderGeometry(0.16, 0.26, 3.2, 6).translate(0, 1.6, 0);
    G.round = merge([[0, 0, 0, 1.9], [0.9, -0.3, 0.4, 1.3], [-0.8, -0.2, -0.3, 1.4], [0.2, 0.8, -0.4, 1.2]].map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, 1).translate(x, y + 4.2, z)));
    G.pine = merge([[0, 3.2, 2.2, 3], [0, 5.0, 1.7, 2.6], [0, 6.6, 1.2, 2.2]].map(([x, y, r, h]) => new THREE.ConeGeometry(r, h, 7).translate(x, y, 0)));
    G.cactus = merge([new THREE.CylinderGeometry(0.35, 0.4, 5, 8).translate(0, 2.5, 0), new THREE.CylinderGeometry(0.22, 0.22, 1.4, 6).rotateZ(Math.PI / 2).translate(0.7, 2.2, 0), new THREE.CylinderGeometry(0.22, 0.22, 1.8, 6).translate(1.3, 3.0, 0), new THREE.CylinderGeometry(0.2, 0.2, 1.0, 6).rotateZ(Math.PI / 2).translate(-0.55, 3.0, 0), new THREE.CylinderGeometry(0.2, 0.2, 1.4, 6).translate(-1.0, 3.6, 0)]);
    const bl = []; for (let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2, p = new THREE.PlaneGeometry(0.9, 2.6); p.translate(0, 1.3, 0); p.rotateX(-0.7); p.rotateY(a); p.translate(0, 2.4, 0); bl.push(p); }
    G.banana = merge(bl);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
  const put = (B, key, geo, mat, x, y, z, k, rot, color) => { m4.compose(p.set(x, y, z), q.setFromEuler(e.set(0, rot, 0)), s.set(k, k, k)); B.instance('mass', key, geo, mat, m4, color); };
  /** kind: palmiye | mese | sonbahar | park | cam | kaktus | muz */
  function plant(B, kind, x, y, z, k = 1, rnd = Math.random){
    const rot = rnd() * Math.PI * 2;
    if (kind === 'palmiye'){ put(B, 'palm:t', G.palmTrunk, mats.palmBark, x, y, z, k, rot); put(B, 'palm:f', G.palmFronds, mats.leaf, x, y, z, k, rot, c.setHSL(0.28 + rnd() * 0.04, 0.5, 0.32 + rnd() * 0.08).convertSRGBToLinear().clone()); }
    else if (kind === 'mese'){ put(B, 'oak:t', G.oakTrunk, mats.bark, x, y, z, k, rot); put(B, 'oak:c', G.oakCrown, mats.crown, x, y, z, k, rot, c.setHSL(0.26, 0.38, 0.22 + rnd() * 0.05).convertSRGBToLinear().clone()); put(B, 'oak:m', G.moss, mats.moss, x, y, z, k, rot); }
    else if (kind === 'kaktus') put(B, 'cactus', G.cactus, mats.cactus, x, y, z, k, rot);
    else if (kind === 'muz'){ put(B, 'banana:t', G.trunk, mats.palmBark, x, y, z, k * 0.7, rot); put(B, 'banana:l', G.banana, mats.leaf, x, y, z, k, rot, c.setHSL(0.3, 0.55, 0.38).convertSRGBToLinear().clone()); }
    else {
      put(B, 'tree:t', G.trunk, mats.bark, x, y, z, k, rot);
      const geo = kind === 'cam' ? G.pine : G.round;
      const col = kind === 'sonbahar' ? c.setHSL([0.02, 0.06, 0.1, 0.13][Math.floor(rnd() * 4)], 0.75, 0.42 + rnd() * 0.1) : kind === 'cam' ? c.setHSL(0.32, 0.4, 0.16 + rnd() * 0.05) : c.setHSL(0.26 + rnd() * 0.04, 0.45, 0.28 + rnd() * 0.07);
      put(B, kind === 'cam' ? 'pine:c' : 'tree:c', geo, mats.crown, x, y, z, k, rot, col.convertSRGBToLinear().clone());
    }
  }
  return {plant, mats};
}

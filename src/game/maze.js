// Doğudaki çit labirenti: tohumlu "recursive backtracker" ile üretilir
export const MAZE = { x0: 52, z0: -14, cell: 4, n: 11 };

export function buildMaze(world, C){
  const { THREE, scene, materials } = world;
  const { x0, z0, cell, n } = MAZE;
  let seed = 4242; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // duvarlar: h[r][c] = hücrenin kuzey duvarı, v[r][c] = batı duvarı
  const H = Array.from({length:n + 1}, () => Array(n).fill(true));
  const V = Array.from({length:n}, () => Array(n + 1).fill(true));
  const seen = Array.from({length:n}, () => Array(n).fill(false));
  const stack = [[Math.floor(n / 2), Math.floor(n / 2)]]; seen[stack[0][0]][stack[0][1]] = true;
  while (stack.length){
    const [r, c] = stack[stack.length - 1];
    const opts = [[r - 1, c, 'N'], [r + 1, c, 'S'], [r, c - 1, 'W'], [r, c + 1, 'E']].filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < n && cc < n && !seen[rr][cc]);
    if (!opts.length){ stack.pop(); continue; }
    const [rr, cc, d] = opts[Math.floor(rnd() * opts.length)];
    if (d === 'N') H[r][c] = false; if (d === 'S') H[r + 1][c] = false; if (d === 'W') V[r][c] = false; if (d === 'E') V[r][c + 1] = false;
    seen[rr][cc] = true; stack.push([rr, cc]);
  }
  const entryRow = Math.floor(n / 2);
  V[entryRow][0] = false; // batı girişi (bahçeye bakar)

  const segs = [];
  for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) if (H[r][c]) segs.push([x0 + c * cell + cell / 2, z0 + r * cell, cell + 0.8, 0.8]);
  for (let r = 0; r < n; r++) for (let c = 0; c <= n; c++) if (V[r][c]) segs.push([x0 + c * cell, z0 + r * cell + cell / 2, 0.8, cell + 0.8]);

  const HGT = 2.7;
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), materials.hedgeMat, segs.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  segs.forEach(([x, z, w, d], i) => {
    m.compose(p.set(x, HGT / 2, z), q, s.set(w, HGT, d)); im.setMatrixAt(i, m);
    C.box(x, z, w / 2, d / 2, 0, 'labirent');
  });
  im.castShadow = true; im.receiveShadow = true; im.name = 'Labirent'; scene.add(im);

  // giriş kemeri: iki taş sütun ve üstte demir kemer
  const ex = x0, ez = z0 + entryRow * cell + cell / 2;
  [-1, 1].forEach(sd => {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.4, 0.9), materials.stoneMat); col.position.set(ex - 0.2, 1.7, ez + sd * 2.3); col.castShadow = true; scene.add(col);
    const urn = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 10), materials.stoneMat); urn.position.set(ex - 0.2, 3.7, ez + sd * 2.3); scene.add(urn);
  });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.07, 8, 40, Math.PI), materials.darkMetal); arch.rotation.y = Math.PI / 2; arch.position.set(ex - 0.2, 3.4, ez); scene.add(arch);
  // çakıl zemin
  const g = new THREE.Mesh(new THREE.PlaneGeometry(n * cell + 2, n * cell + 2), materials.gravelMat);
  g.rotation.x = -Math.PI / 2; g.position.set(x0 + n * cell / 2, 0.03, z0 + n * cell / 2); g.receiveShadow = true; scene.add(g);

  // çıkmaz sokaklar (madalyon yerleşimi için)
  const deadEnds = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){
    const walls = (H[r][c] ? 1 : 0) + (H[r + 1][c] ? 1 : 0) + (V[r][c] ? 1 : 0) + (V[r][c + 1] ? 1 : 0);
    if (walls === 3) deadEnds.push([x0 + c * cell + cell / 2, z0 + r * cell + cell / 2, Math.hypot(r - n / 2, c - n / 2)]);
  }
  deadEnds.sort((a, b) => b[2] - a[2]);
  return {
    center:[x0 + Math.floor(n / 2) * cell + cell / 2, z0 + Math.floor(n / 2) * cell + cell / 2],
    entry:[ex - 3, ez],
    deadEnds,
  };
}

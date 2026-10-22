// Birinci şahıs okçuluk: fareyle nişan al, sol tuşu basılı tutarak yayı ger, bırakınca ok fırlar.
// Gerdikçe güç artar ve görüş daralır; uzun süre gergin tutunca kol titrer. Ok gerçek bir mermi gibi uçar
// (yerçekimi, rüzgâr), hedeflere, zemine ve engellere saplanır. Poligonda 5 oklu tur sayılır; serbest modda
// (B tuşu) adanın her yerinde atış yapılır.
export function createArchery({world, hero, input, ui, audio, hooks}){
  const { THREE, camera, scene, renderer } = world;
  const canvas = renderer.domElement;
  const $ = id => document.getElementById(id);
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  const st = {active:false, yaw:0, pitch:0, draw:0, drawing:false, hold:0, range:null, shots:0, score:0, fov:42, t:0, sway:new THREE.Vector2(), cooldown:0, locked:false, msgT:0};
  const flying = [], stuck = [];
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), fwd = new THREE.Vector3(), eye = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0), WIND = new THREE.Vector3(0.82, 0, 0.57).normalize();

  /* ---------- yay, ok ve eller (kamera uzayında) ---------- */
  const bow = new THREE.Group(); bow.visible = false; bow.userData.shared = true; scene.add(bow);
  const wood = new THREE.MeshStandardMaterial({color:lin(0x5a3418), roughness:0.55});
  const horn = new THREE.MeshStandardMaterial({color:lin(0x2a1a10), roughness:0.4});
  const leather = new THREE.MeshStandardMaterial({color:lin(0x6a2a1a), roughness:0.8});
  const gold = world.materials.goldMat;
  const stringMat = new THREE.MeshBasicMaterial({color:0xe8e0cc});
  const skin = new THREE.MeshStandardMaterial({color:lin(0xe0b094), roughness:0.65});
  const glove = new THREE.MeshStandardMaterial({color:lin(0x4a2a18), roughness:0.8});
  const arrowMat = new THREE.MeshStandardMaterial({color:lin(0xd8c8a0), roughness:0.6});
  const featherMat = new THREE.MeshStandardMaterial({color:lin(0xc8102e), roughness:0.8, side:THREE.DoubleSide});
  const headMat = new THREE.MeshStandardMaterial({color:0xb8bcc4, metalness:1, roughness:0.3});
  const P = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  // kabza (bow yerel: +y yukarı, -z ileri, +z oyuncuya doğru)
  P(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 10), leather, 0, 0, 0, bow);
  P(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), gold, 0, 0.09, 0, bow); P(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 10), gold, 0, -0.09, 0, bow);
  // iki kol: kabzadan uçlara kavisli (kompozit Türk yayı gibi uçları geriye kıvrık)
  const limbs = [1, -1].map(sd => {
    const L = new THREE.Group(); L.position.y = sd * 0.08; bow.add(L);
    const pts = [[0, 0, 0], [0, 0.18, -0.03], [0, 0.36, -0.02], [0, 0.5, 0.04], [0, 0.58, 0.13], [0, 0.6, 0.19]].map(([x, y, z]) => new THREE.Vector3(x, y * sd, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.014, 6, false), wood); L.add(tube);
    // sırt şeridi ve uç kapakları
    const back = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.slice(0, 4).map(p => p.clone().add(new THREE.Vector3(0, 0, -0.012)))), 16, 0.008, 5, false), horn); L.add(back);
    P(new THREE.ConeGeometry(0.012, 0.05, 6), horn, 0, sd * 0.62, 0.2, L).rotation.x = sd > 0 ? 0.6 : Math.PI - 0.6;
    return {L, sd, tip:new THREE.Vector3(0, sd * 0.6, 0.19)};
  });
  // kiriş: iki ince silindir (uç → çentik → uç)
  const strings = [0, 1].map(() => P(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 4), stringMat, 0, 0, 0, bow));
  // ok (ileri -z): gövde, demir uç, üç tüy
  function makeArrow(){
    const a = new THREE.Group();
    const shaft = P(new THREE.CylinderGeometry(0.0055, 0.0055, 0.8, 6), arrowMat, 0, 0, -0.4, a); shaft.rotation.x = Math.PI / 2;
    const head = P(new THREE.ConeGeometry(0.014, 0.06, 6), headMat, 0, 0, -0.82, a); head.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 3; i++){ const f = P(new THREE.PlaneGeometry(0.02, 0.11), featherMat, 0, 0, -0.07, a); f.rotation.set(Math.PI / 2, 0, i * Math.PI * 2 / 3); f.position.x = Math.cos(i * 2.094) * 0.011; f.position.y = Math.sin(i * 2.094) * 0.011; }
    P(new THREE.CylinderGeometry(0.007, 0.007, 0.012, 6), gold, 0, 0, -0.004, a).rotation.x = Math.PI / 2;
    a.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return a;
  }
  const nocked = makeArrow(); bow.add(nocked);
  // eller: sol kabzada, sağ kirişte
  const handL = new THREE.Group(); bow.add(handL);
  P(new THREE.BoxGeometry(0.07, 0.11, 0.08), skin, -0.005, 0, 0.01, handL);
  P(new THREE.BoxGeometry(0.06, 0.1, 0.22), new THREE.MeshStandardMaterial({color:lin(0x0c2a1f), roughness:0.7}), 0.0, -0.04, 0.14, handL).rotation.x = 0.35;
  const handR = new THREE.Group(); bow.add(handR);
  P(new THREE.BoxGeometry(0.06, 0.07, 0.09), glove, 0.012, 0, 0.03, handR);
  P(new THREE.BoxGeometry(0.055, 0.09, 0.26), new THREE.MeshStandardMaterial({color:lin(0x0c2a1f), roughness:0.7}), 0.035, -0.02, 0.17, handR).rotation.x = 0.2;
  bow.traverse(o => { if (o.isMesh){ o.castShadow = false; o.frustumCulled = false; } });

  const setSeg = (m, a, b) => { tmp.subVectors(b, a); const len = tmp.length(); m.position.copy(a).addScaledVector(tmp, 0.5); m.scale.set(1, len, 1); m.quaternion.setFromUnitVectors(UP, tmp.normalize()); };
  function poseBow(k){
    // gerildikçe kollar oyuncuya doğru bükülür, çentik geri gelir
    limbs.forEach(({L, sd}) => { L.rotation.x = sd * k * 0.22; });
    const tips = limbs.map(({L, tip}) => { L.updateMatrix(); return tip.clone().applyMatrix4(L.matrix); });
    const nock = new THREE.Vector3(0, 0, 0.17 + k * 0.32);
    setSeg(strings[0], tips[0], nock); setSeg(strings[1], nock, tips[1]);
    nocked.position.set(0.012, 0, nock.z); nocked.visible = st.cooldown <= 0;
    handR.position.set(0.005, 0, nock.z);
  }

  /* ---------- HUD ---------- */
  const hud = $('bowHud'), bar = $('bowPower'), info = $('bowInfo'), hint = $('bowHint'), pop = $('bowPop');
  function setInfo(){
    if (st.range) info.innerHTML = '<b>Ok ' + Math.min(5, st.shots) + '/5</b> · ' + st.score + ' puan' + (hooks.getBest() ? ' · en iyi ' + hooks.getBest() : '');
    else info.innerHTML = '<b>Serbest atış</b> · rüzgâr ' + Math.round(6 + world.state.wind * 40) + ' km/s';
  }
  function popup(text, good){ pop.textContent = text; pop.className = 'on' + (good ? ' good' : ''); clearTimeout(popup.t); popup.t = setTimeout(() => { pop.className = ''; }, 1100); }

  /* ---------- giriş: işaretçi kilidi, basılı tut / bırak ---------- */
  const locked = () => document.pointerLockElement === canvas;
  const lock = () => { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* bazı tarayıcılarda yok */ } };
  canvas.addEventListener('mousedown', e => {
    if (!st.active) return;
    if (!locked()){ lock(); if (e.button === 0) st.drawing = true; return; }
    if (e.button === 0 && st.cooldown <= 0) st.drawing = true;
    if (e.button === 2){ st.drawing = false; st.draw = 0; }
  });
  addEventListener('mouseup', e => { if (st.active && e.button === 0 && st.drawing) release(); });
  addEventListener('mousemove', e => {
    if (!st.active || !locked()) return;
    const k = 0.0021 * (hooks.sens ? hooks.sens() : 1) * (1 - st.draw * 0.35);
    st.yaw -= e.movementX * k; st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch - e.movementY * k));
  });
  canvas.addEventListener('contextmenu', e => { if (st.active) e.preventDefault(); });
  document.addEventListener('pointerlockchange', () => { st.locked = locked(); if (st.active) hint.hidden = st.locked; });
  // dokunmatik: sağ yarıda parmak bas = ger, kaldır = bırak; sürükleyerek nişan (input.look)
  canvas.addEventListener('touchstart', e => { if (!st.active) return; for (const t of e.changedTouches) if (t.clientX > innerWidth * 0.45 && st.cooldown <= 0){ st.drawing = true; st.touchId = t.identifier; } }, {passive:true});
  canvas.addEventListener('touchend', e => { if (!st.active) return; for (const t of e.changedTouches) if (t.identifier === st.touchId && st.drawing) release(); }, {passive:true});

  /* ---------- atış ---------- */
  function aimDir(out){
    const cp = Math.cos(st.pitch + st.sway.y);
    return out.set(Math.sin(st.yaw + st.sway.x) * cp, Math.sin(st.pitch + st.sway.y), Math.cos(st.yaw + st.sway.x) * cp).normalize();
  }
  function release(){
    st.drawing = false;
    const k = st.draw; st.draw = 0; st.hold = 0;
    if (k < 0.12) return;   // yeterince gerilmedi: ok düşmesin, vazgeç
    if (st.range && st.shots >= 5){ clearStuck(true); st.shots = 0; st.score = 0; }
    const dir = aimDir(new THREE.Vector3());
    const speed = 20 + 50 * Math.pow(k, 1.25);
    const a = makeArrow(); scene.add(a);
    // F.pos okun ucudur; model kuyruktan (çentik) çizilir
    const pos = eye.clone().addScaledVector(dir, 1.3).add(tmp.set(0, -0.05, 0));
    const F = {m:a, pos, vel:dir.multiplyScalar(speed), t:0, range:!!st.range};
    place(F); flying.push(F);
    if (st.range) st.shots++;
    st.cooldown = 0.45;
    audio.sfx('whoosh'); audio.tone && audio.tone(180, 0.08, 'triangle', 0.08);
    setInfo();
  }
  function clearStuck(onlyTargets){
    for (let i = stuck.length - 1; i >= 0; i--){ if (onlyTargets && !stuck[i].target) continue; scene.remove(stuck[i].m); stuck.splice(i, 1); }
  }
  // ok modelinin +z ekseni kuyruğa bakar: ucu hıza doğru çevir
  const pd = new THREE.Vector3(), pl = new THREE.Vector3();
  function place(F, tip = F.pos){ pd.copy(F.vel).normalize(); F.m.position.copy(tip).addScaledVector(pd, -0.82); F.m.lookAt(pl.copy(F.m.position).sub(pd)); }
  function stick(F, tip, target){
    place(F, tip);
    stuck.push({m:F.m, target}); if (stuck.length > 30){ const o = stuck.shift(); scene.remove(o.m); }
  }
  function targetsNow(){ return (st.range && st.range.targets) || (hooks.targets ? hooks.targets() : []); }
  function step(F, dt){
    const C = hooks.getC();
    const prev = tmp2.copy(F.pos);
    F.vel.y -= 9.81 * dt;
    F.vel.addScaledVector(WIND, world.state.wind * 1.2 * dt);
    F.pos.addScaledVector(F.vel, dt);
    // hedefler: ön yüz düzlemini geçen ok
    for (const T of targetsNow()){
      const n = T.n || tmp.set(T.nx ?? -1, T.ny ?? 0, T.nz ?? 0);
      const d0 = (prev.x - T.x) * n.x + (prev.y - T.y) * n.y + (prev.z - T.z) * n.z, d1 = (F.pos.x - T.x) * n.x + (F.pos.y - T.y) * n.y + (F.pos.z - T.z) * n.z;
      if (d0 > 0 && d1 <= 0){
        const k = d0 / (d0 - d1), hx = prev.x + (F.pos.x - prev.x) * k, hy = prev.y + (F.pos.y - prev.y) * k, hz = prev.z + (F.pos.z - prev.z) * k;
        const dist = Math.hypot(hx - T.x, hy - T.y, hz - T.z), R = T.r || 0.85;
        if (dist <= R){
          const pts = Math.max(1, 10 - Math.floor(dist / (R / 10)));
          stick(F, new THREE.Vector3(hx, hy, hz).addScaledVector(F.vel.clone().normalize(), 0.12), true);
          audio.sfx(pts >= 9 ? 'coin' : 'land');
          if (F.range){
            st.score += pts; popup(pts === 10 ? 'Tam isabet! 10' : pts + ' puan', pts >= 8);
            if (st.shots >= 5){ const best = Math.max(hooks.getBest() || 0, st.score); hooks.setBest(best); ui.toast('Tur bitti: ' + st.score + '/50 puan' + (st.score >= 40 ? ' · Usta okçu!' : '') + ' · yeni tur için yeniden ger', 3600); }
          } else popup(pts + ' puan', pts >= 8);
          setInfo(); return true;
        }
      }
    }
    // zemin ve engeller
    const gy = C.height(F.pos.x, F.pos.z, prev.y);
    if (F.pos.y <= gy){ stick(F, new THREE.Vector3(F.pos.x, gy - 0.1, F.pos.z), false); audio.sfx('land'); if (F.range) miss(); return true; }
    if (F.pos.y < gy + 7 && C.blocked(F.pos.x, F.pos.z, 0.03)){ stick(F, prev.clone(), false); audio.sfx('land'); if (F.range) miss(); return true; }
    if (F.t > 9 || F.pos.distanceTo(eye) > 500){ scene.remove(F.m); if (F.range) miss(); return true; }
    place(F);
    return false;
  }
  function miss(){
    popup('Iska!', false);
    if (st.shots >= 5){ const best = Math.max(hooks.getBest() || 0, st.score); hooks.setBest(best); ui.toast('Tur bitti: ' + st.score + '/50 puan', 3200); }
    setInfo();
  }

  /* ---------- mod ---------- */
  function start(range){
    if (st.active) return;
    if (hero.mounted) hero.dismount();
    st.active = true; st.range = range || null; st.draw = 0; st.drawing = false; st.hold = 0; st.cooldown = 0;
    if (range && range.yaw != null){ st.yaw = range.yaw; if (range.at) hero.teleport(range.at.x, hero.C.height(range.at.x, range.at.z), range.at.z, range.yaw); }
    else st.yaw = hero.yaw;
    st.pitch = 0.02; st.fov = camera.fov;
    hero.obj.visible = false; bow.visible = true;
    hooks.setMode('bow'); hud.hidden = false; hint.hidden = locked(); setInfo();
    lock();
    ui.toast(range ? 'Fareyi basılı tut: ger · bırak: at · E: yayı bırak' : 'Serbest atış · B ya da E: yayı bırak', 3200);
  }
  function stop(){
    if (!st.active) return;
    st.active = false; st.drawing = false; st.draw = 0;
    bow.visible = false; hero.obj.visible = true; hud.hidden = true;
    camera.fov = st.fov; camera.updateProjectionMatrix();
    hero.yaw = st.yaw; hero.camYaw = st.yaw + Math.PI; hero.camPitch = 0.25; hero.snapCamera = true;
    if (locked()) document.exitPointerLock();
    hooks.setMode('play');
  }
  function update(dt, t){
    st.t += dt; st.cooldown -= dt;
    if (st.active){
      // fare kilitli değilse sürükleyerek de nişan alınır (dokunmatik dahil)
      st.yaw -= input.look.dx * 0.004; st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch - input.look.dy * 0.004));
      if (st.drawing && st.cooldown <= 0){ st.draw = Math.min(1, st.draw + dt / 0.95 * (1.2 - st.draw * 0.5)); if (st.draw >= 1) st.hold += dt; }
      else if (!st.drawing) st.draw = Math.max(0, st.draw - dt * 3);
      // nefes ve yorgunluk: tam gergin tutunca titreme büyür
      const tremble = 0.0012 + st.draw * 0.0015 + Math.max(0, st.hold - 2.2) * 0.006;
      st.sway.set(Math.sin(t * 1.3) * tremble + Math.sin(t * 7.1) * tremble * 0.4, Math.sin(t * 0.9 + 1) * tremble + Math.sin(t * 6.3) * tremble * 0.4);
      eye.set(hero.pos.x, hero.pos.y + 1.62, hero.pos.z);
      camera.position.copy(eye); camera.lookAt(tmp.copy(eye).add(aimDir(fwd)));
      camera.fov += ((st.fov - st.draw * 12) - camera.fov) * Math.min(1, dt * 8); camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      // yay kameraya yapışık: sol alt, hafif yatık
      bow.position.copy(camera.position); bow.quaternion.copy(camera.quaternion);
      bow.translateX(-0.03 - st.draw * 0.01); bow.translateY(-0.12 + st.draw * 0.04); bow.translateZ(-0.76);
      bow.rotateZ(0.22 - st.draw * 0.12);
      poseBow(st.draw);
      hero.yaw = st.yaw;
      bar.style.transform = 'scaleX(' + st.draw.toFixed(3) + ')';
      bar.classList.toggle('full', st.draw >= 1); bar.classList.toggle('shake', st.hold > 2.2);
    }
    // uçan oklar (mod kapansa da yere düşene dek uçar)
    for (let i = flying.length - 1; i >= 0; i--){
      const F = flying[i]; F.t += dt;
      const n = 4; let done = false;
      for (let k = 0; k < n && !done; k++) done = step(F, dt / n);
      if (done) flying.splice(i, 1);
    }
  }
  /** Ada değişince ya da odaya girince yerdeki okları kaldır. */
  function clear(){ flying.forEach(F => scene.remove(F.m)); flying.length = 0; clearStuck(false); }
  return {start, stop, update, clear, get active(){ return st.active; }, state:st};
}

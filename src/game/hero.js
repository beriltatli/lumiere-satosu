// Oyuncu karakteri, binilebilir at ve üçüncü şahıs kamera
const WALK = 3.4, RUN = 6.4, HORSE = 8.5, GALLOP = 14, JUMP = 5.4, GRAV = 15, R = 0.4;

export function recolor(obj, from, to){
  obj.traverse(o => { if (o.isMesh && o.material === from) o.material = to; });
}
function hideHalberd(g){ g.userData.armR.children.forEach(c => { if (c.isGroup) c.visible = false; }); }

export function makeHero(world){
  const { THREE, materials:M } = world;
  const g = world.makeGuard();
  hideHalberd(g);
  const coat = new THREE.MeshStandardMaterial({color:0x1f4a3c, roughness:0.75, envMapIntensity:0.5});
  const hat = new THREE.MeshStandardMaterial({color:0x4a3222, roughness:0.75});
  const trousers = new THREE.MeshStandardMaterial({color:0x6b5a44, roughness:0.8});
  recolor(g, M.coatMat, coat); recolor(g, M.hatMat, hat); recolor(g, M.whiteMat, trousers);
  // pelerin
  const capeMat = new THREE.MeshStandardMaterial({color:0x4e0f1c, roughness:0.95, side:THREE.DoubleSide, envMapIntensity:0.35});
  const cape = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.95, 1, 4), capeMat);
  cape.geometry.translate(0, -0.47, 0); cape.position.set(0, 1.62, -0.16); cape.castShadow = true; g.add(cape);
  // çanta ve kemer tokası
  world.part(new THREE.BoxGeometry(0.18, 0.2, 0.1), hat, 0.27, 0.95, 0.05, g);
  world.part(new THREE.BoxGeometry(0.08, 0.08, 0.02), M.goldMat, 0, 1.0, 0.16, g);
  // tüy
  const plume = world.part(new THREE.ConeGeometry(0.05, 0.4, 6), new THREE.MeshStandardMaterial({color:0xf2efe6, roughness:0.6}), 0.18, 2.08, -0.02, g);
  plume.rotation.z = -0.9;
  // gece feneri
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({color:0xffc070, toneMapped:false}));
  lantern.position.set(0, -0.68, 0.08); g.userData.armL.add(lantern);
  const lanternLight = new THREE.PointLight(0xffb060, 0, 9, 2); lanternLight.position.copy(lantern.position); g.userData.armL.add(lanternLight);
  g.userData.cape = cape; g.userData.lantern = lantern; g.userData.lanternLight = lanternLight;
  g.name = 'Kahraman';
  return g;
}

export function makeRideHorse(world){
  const { THREE } = world;
  const h = world.makeHorse(0xf1ece2, 0xb8b0a2);
  const saddle = world.part(new THREE.BoxGeometry(0.62, 0.12, 0.72), world.materials.redMat, 0, 1.88, -0.05, h);
  const blanket = world.part(new THREE.BoxGeometry(0.9, 0.5, 0.9), new THREE.MeshStandardMaterial({color:0x1d3a8a, roughness:0.8}), 0, 1.66, -0.05, h);
  blanket.scale.set(1, 1, 1);
  h.userData.extra = [saddle, blanket];
  const procedural = h.children.filter(c => c !== saddle && c !== blanket);   // binici sonradan eklenir; onu gizleme
  world.horseModel.then(({src, clip}) => {
    procedural.forEach(c => { c.visible = false; });
    const m = src.clone(); m.scale.setScalar(0.0125); m.castShadow = true;
    m.material = src.material.clone(); m.material.color.set(0xfff6ea); h.add(m);
    saddle.position.set(0, 1.44, -0.1); blanket.position.set(0, 1.3, -0.1); blanket.scale.set(0.95, 0.5, 0.9);
    const mixer = new THREE.AnimationMixer(m); const act = mixer.clipAction(clip); act.play(); act.timeScale = 0;
    h.userData.mixer = mixer; h.userData.act = act; h.userData.glb = true;
  });
  h.name = 'Etoile';
  return h;
}

export class Hero {
  constructor(world, collision, input){
    this.w = world; this.C = collision; this.input = input;
    const { THREE } = world;
    this.THREE = THREE;
    this.obj = makeHero(world); this.obj.rotation.order = 'YXZ'; world.scene.add(this.obj);
    this.pos = new THREE.Vector3(0, 0, -14);
    this.vy = 0; this.ground = 0; this.onGround = true;
    this.yaw = 0;               // karakterin baktığı yön
    this.speed = 0; this.phase = 0;
    this.camYaw = Math.PI; this.camPitch = 0.32; this.camDist = 7.5; this.camDistT = 7.5;
    this.camPos = new THREE.Vector3(); this.camTarget = new THREE.Vector3();
    this.horse = null; this.mounted = false; this.horsePhase = 0;
    this.frozen = false; this.climb = 0; this.fp = false; this.fpPitch = -0.05;
    this.zone = null;           // 'kule' modu: kule balkonu
    this.stepT = 0; this.onStep = null;
  }
  spawnHorse(x, z, yaw){
    if (this.horse) return this.horse;
    const h = makeRideHorse(this.w); h.position.set(x, this.C.height(x, z), z); h.rotation.y = yaw || 0; this.w.scene.add(h);
    this.horse = h;
    const obstacle = inside => () => (this.mounted || !this.horse || (this.horse.position.y < -20) !== inside) ? [] : [{x:this.horse.position.x, z:this.horse.position.z, r:0.9}];
    this.C.dynamics.push(obstacle(false)); if (this.Cin) this.Cin.dynamics.push(obstacle(true)); this._horseObstacle = obstacle;
    return h;
  }
  mount(){
    if (!this.horse) return; this.mounted = true; this.horse.add(this.obj);
    const u = this.obj.userData;
    this.obj.position.set(0, this.horse.userData.glb ? 0.95 : 1.12, -0.1); this.obj.rotation.set(0, 0, 0);
    u.legL.rotation.set(-0.5, 0, -0.55); u.legR.rotation.set(-0.5, 0, 0.55);
    this.pos.copy(this.horse.position); this.yaw = this.horse.rotation.y; this.camDistT = 10;
    this.fp = true; this.fpPitch = -0.08; this.camYaw = this.yaw + Math.PI;
  }
  dismount(){
    if (!this.mounted) return; this.mounted = false; this.w.scene.add(this.obj);
    const u = this.obj.userData; u.legL.rotation.set(0, 0, 0); u.legR.rotation.set(0, 0, 0);
    const side = new this.THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).multiplyScalar(1.4);
    this.pos.copy(this.horse.position).add(side); (this.zone === 'ic' && this.Cin ? this.Cin : this.C).resolve(this.pos, R, this.pos.y);
    this.camDistT = 7.5; this.speed = 0; this.fp = false;
    if (this.horse.userData.act) this.horse.userData.act.timeScale = 0;
  }
  teleport(x, y, z, yaw){
    this.pos.set(x, y, z); this.vy = 0; if (yaw != null){ this.yaw = yaw; this.camYaw = yaw + Math.PI; }
    this.snapCamera = true;
  }
  update(dt, t, mods){
    const I = this.input, W = this.w.W;
    // kamera girişi
    this.camYaw -= I.look.dx * 0.005;
    if (this.fp) this.fpPitch = Math.max(-1.1, Math.min(0.9, this.fpPitch - I.look.dy * 0.004));
    else this.camPitch = Math.max(-0.15, Math.min(1.2, this.camPitch + I.look.dy * 0.004));
    if (I.zoom) this.camDistT = Math.max(this.zone === 'ic' ? 2 : 3, Math.min(this.mounted ? 18 : this.zone === 'ic' ? 7 : 14, this.camDistT + I.zoom * 0.8));
    const C = this.zone === 'ic' && this.Cin ? this.Cin : this.C;
    const mvx = this.frozen ? 0 : I.move.x, mvy = this.frozen ? 0 : I.move.y, mag = Math.min(1, Math.hypot(mvx, mvy));

    // hareket yönü kameraya göre
    const fwdX = -Math.sin(this.camYaw), fwdZ = -Math.cos(this.camYaw);
    const rightX = -fwdZ, rightZ = fwdX;
    let dx = fwdX * mvy + rightX * mvx, dz = fwdZ * mvy + rightZ * mvx;
    const dl = Math.hypot(dx, dz); if (dl > 1e-4){ dx /= dl; dz /= dl; }

    const wet = mods.rainSlow;      // yağmurda yavaşlama çarpanı
    let target;
    if (this.mounted) target = (I.run ? GALLOP : HORSE) * wet * mag;
    else target = (I.run ? RUN : WALK) * (0.9 + 0.1 * wet) * mag;
    if (this.zone === 'kule') target = Math.min(target, WALK);
    this.speed += (target - this.speed) * Math.min(1, dt * (this.mounted ? 2.2 : 9));

    if (mag > 0.05){
      const want = Math.atan2(dx, dz);
      let d = want - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      this.yaw += d * Math.min(1, dt * (this.mounted ? 3.5 : 12));
    }
    const step = this.speed * dt;
    const prev = {x:this.pos.x, z:this.pos.z}, prevY = this.pos.y;
    const nx = this.pos.x + Math.sin(this.yaw) * step, nz = this.pos.z + Math.cos(this.yaw) * step;
    const p = {x:nx, z:nz};

    if (this.zone === 'kule'){
      const k = mods.towerCenter, ddx = p.x - k.x, ddz = p.z - k.z, rr = Math.hypot(ddx, ddz), r = Math.max(4.15, Math.min(4.75, rr));
      p.x = k.x + ddx / rr * r; p.z = k.z + ddz / rr * r;
    } else {
      C.resolve(p, this.mounted ? 0.85 : R, this.pos.y);
      // basamak kuralı: 0.6 m'den yüksek bir basamağa/çıkıntıya yürüyerek çıkılmaz
      if (C.ledge(p.x, p.z, this.pos.y)){ p.x = prev.x; p.z = prev.z; }
      if (this.zone !== 'ic'){ const lim = 230, rr = Math.hypot(p.x, p.z - 10); if (rr > lim){ p.x *= lim / rr; p.z = 10 + (p.z - 10) * lim / rr; } }
    }
    this.pos.x = p.x; this.pos.z = p.z;
    const realSpeed = Math.hypot(this.pos.x - prev.x, this.pos.z - prev.z) / Math.max(dt, 1e-4);

    // dikey
    this.ground = this.zone === 'kule' ? mods.towerFloor : C.height(this.pos.x, this.pos.z, this.pos.y);
    if (I.take('jump') && this.onGround && !this.frozen && !this.mounted){ this.vy = JUMP; this.onGround = false; mods.sfx('jump'); }
    this.vy -= GRAV * dt; this.pos.y += this.vy * dt;
    if (this.pos.y <= this.ground){ if (!this.onGround && this.vy < -4) mods.sfx('land'); this.pos.y = this.ground; this.vy = 0; this.onGround = true; }
    else if (this.pos.y - this.ground > 0.08) this.onGround = false;
    if (this.onGround && this.pos.y < this.ground + 0.6) this.pos.y += (this.ground - this.pos.y) * Math.min(1, dt * 14);

    // görsel
    const u = this.obj.userData;
    if (this.mounted){
      const h = this.horse; h.position.set(this.pos.x, this.pos.y, this.pos.z); h.rotation.y = this.yaw;
      const s = realSpeed;
      if (h.userData.act){ h.userData.act.timeScale = Math.min(1.4, s / 9); h.userData.mixer.update(dt); }
      else { this.horsePhase += dt * s * 1.2; const a = Math.sin(this.horsePhase) * 0.45 * Math.min(1, s / 3); const L = h.userData.legs; L[0].rotation.x = a; L[3].rotation.x = a; L[1].rotation.x = -a; L[2].rotation.x = -a; }
      this.obj.position.y = (h.userData.glb ? 0.95 : 1.12) + Math.abs(Math.sin(t * s * 0.9)) * 0.06 * Math.min(1, s / 4);
      this.stepT += dt * s * 0.55; if (this.stepT > 1 && s > 1){ this.stepT = 0; mods.sfx(s > 10 ? 'gallop' : 'hoof'); }
      u.armL.rotation.x = -0.7; u.armR.rotation.x = -0.7;
    } else {
      this.obj.position.copy(this.pos); this.obj.rotation.y = this.yaw;
      const s = this.onGround ? realSpeed : 0;
      this.phase += dt * s * 2.6;
      const amp = Math.min(1, s / 3.4);
      // merdivende: dizler yukarı, gövde öne eğik
      const vyStep = (this.pos.y - prevY) / Math.max(dt, 1e-4);
      this.climb += (Math.max(-1, Math.min(1, vyStep / 1.6)) - this.climb) * Math.min(1, dt * 8);
      const up = Math.max(0, this.climb), sn = Math.sin(this.phase);
      u.legL.rotation.x = (sn * 0.6 - Math.max(0, -sn) * 0.75 * up) * amp - 0.25 * up * amp;
      u.legR.rotation.x = (-sn * 0.6 - Math.max(0, sn) * 0.75 * up) * amp - 0.25 * up * amp;
      this.obj.rotation.x = 0.16 * up - 0.08 * Math.max(0, -this.climb);
      u.armL.rotation.x = -Math.sin(this.phase) * 0.5 * amp - (W.night > 0.5 ? 0.6 : 0); u.armR.rotation.x = Math.sin(this.phase) * 0.5 * amp;
      if (!this.onGround){ u.legL.rotation.x = -0.5; u.legR.rotation.x = 0.3; }
      this.obj.position.y += Math.abs(Math.sin(this.phase)) * 0.04 * amp;
      const prevStep = this.stepT; this.stepT = Math.sin(this.phase);
      if (s > 0.6 && Math.sign(prevStep) !== Math.sign(this.stepT)) mods.sfx('step', this.pos);
    }
    u.cape.rotation.x = 0.1 + Math.min(0.9, realSpeed * 0.09) + Math.sin(t * 6) * 0.04 * (0.3 + this.w.state.wind);
    const lamp = W.night > 0.5 ? 1 : 0; u.lantern.visible = !!lamp; u.lanternLight.intensity = lamp * 2.2;

    // birinci şahıs: binicinin / karakterin gözünden
    this.obj.visible = !this.fp;
    if (this.fp){
      this.obj.updateMatrixWorld(true);
      const eye = this.obj.localToWorld(new this.THREE.Vector3(0, 1.8, 0.16));
      const ly = this.camYaw - Math.PI, cp2 = Math.cos(this.fpPitch);
      this.camTarget.set(eye.x + Math.sin(ly) * cp2 * 10, eye.y + Math.sin(this.fpPitch) * 10, eye.z + Math.cos(ly) * cp2 * 10);
      if (this.snapCamera){ this.camPos.copy(eye); this.snapCamera = false; } else this.camPos.lerp(eye, Math.min(1, dt * 18));
      this.w.camera.position.copy(this.camPos); this.w.camera.lookAt(this.camTarget);
      return realSpeed;
    }
    // kamera
    this.camDist += (this.camDistT - this.camDist) * Math.min(1, dt * 5);
    const headY = this.pos.y + (this.mounted ? 2.6 : 1.6);
    this.camTarget.set(this.pos.x, headY, this.pos.z);
    const cp = Math.cos(this.camPitch), sp = Math.sin(this.camPitch);
    const want = new this.THREE.Vector3(
      this.pos.x + Math.sin(this.camYaw) * cp * this.camDist,
      headY + sp * this.camDist,
      this.pos.z + Math.cos(this.camYaw) * cp * this.camDist);
    if (this.zone !== 'kule'){
      const f = C.rayClear(this.pos.x, this.pos.z, want.x, want.z, this.pos.y + 0.5);
      if (f < 1){ const k = Math.max(0.12, f); want.x = this.pos.x + (want.x - this.pos.x) * k; want.z = this.pos.z + (want.z - this.pos.z) * k; want.y = headY + (want.y - headY) * k; }
    }
    const gy = (this.zone === 'kule' ? mods.towerFloor : C.height(want.x, want.z, this.pos.y + 0.5)) + 0.4;
    if (this.zone === 'ic' && C.ceiling){ const cy = C.ceiling(this.pos.x, this.pos.z, this.pos.y) - 0.35; if (want.y > cy) want.y = Math.max(cy, headY - 0.2); }
    if (want.y < gy) want.y = gy;
    if (this.snapCamera){ this.camPos.copy(want); this.snapCamera = false; }
    else this.camPos.lerp(want, Math.min(1, dt * 10));
    this.w.camera.position.copy(this.camPos); this.w.camera.lookAt(this.camTarget);
    return realSpeed;
  }
}

// Ejderha Pyra'ya binip uçmak: kanat çırpan uçuş fiziği, binici gözü / takip kamerası,
// irtifa göstergesi, üzerinden geçilen yerlerin başlıkları, ateş püskürtme ve iniş.
import { PLACES } from './court.js';
import { CAGE } from './sanctuary.js';

// Malikânenin ana yerleri (saray bahçeleri listesi PLACES'ten gelir)
const CORE = [
  {name:'Lumière Şatosu', sub:'Île-de-France · 1724', x:0, z:-40},
  {name:'Barok Bahçe', sub:'Dört çiçek parteri', x:0, z:12},
  {name:'Kılıç Tapınağı', sub:'Uyuyan kılıcın yuvası', x:0, z:60},
  {name:'Haras de Lumière', sub:'Batı otlakları', x:-100, z:10},
  {name:'Kış Bahçesi', sub:'Cam ve demir rotunda', x:0, z:118},
  {name:'Ejderha Kafesi', sub:'Pyra\'nın yuvası', x:CAGE.x, z:CAGE.z},
  {name:'Kelebek Vadisi', sub:'Şelale ve botanik bahçe', x:80, z:122},
  {name:'Cennet Bağı', sub:'Asmalar ve pergola', x:136, z:122},
  {name:'Çit Labirenti', sub:'Zümrüt rünün saklandığı yer', x:74, z:8},
];
const subOf = p => p.z < -60 ? 'Kültür Mahallesi' : p.x < -90 ? 'Batı Arazisi' : p.x > 100 ? 'Doğu Arazisi' : p.z > 130 ? 'Güney Girişi' : 'Saray Bahçeleri';

export function createDragonRide({world, C, hero, input, ui, audio, sanctuary, hooks}){
  const { THREE, scene, camera } = world;
  const D = sanctuary.dragon;
  const $ = id => document.getElementById(id);
  const L = (x, y, z) => new THREE.Vector3(x, y, z);
  const st = {active:false, pos:L(0, 0, 0), yaw:0, pitch:0, roll:0, speed:0, vy:0, grounded:true, cam:'binici', phase:0, flapLast:0, title:null, titleT:0, fire:0, home:null, fov:0, yawRate:0, typed:'', flameMode:false, burst:0};
  const places = () => CORE.concat(PLACES.filter(p => p.r > 0).map(p => ({name:p.name, sub:subOf(p), x:p.x, z:p.z})));
  const camPos = L(0, 0, 0), camLook = L(0, 0, 0), tmp = L(0, 0, 0), fwd = L(0, 0, 1);
  const RIDER = L(0, 1.15, 0.85);       // gövde (body) yerel koordinatında eyer

  // kafes kapısının yanında: Pyra'ya bin
  sanctuary.interact.push({x:CAGE.x - CAGE.R - 1.2, z:CAGE.z + 3.2, r:2.8, label:'Pyra\'ya bin ve uç', show:() => !st.active, act:() => start()});

  // Gizli: uçarken klavyeden yazılan harfleri izle; "fire" yazılınca tıklayarak alev püskürtme açılır/kapanır.
  addEventListener('keydown', e => {
    if (!st.active || e.repeat || !/^Key[A-Z]$/.test(e.code)) return;
    st.typed = (st.typed + e.code.slice(3).toLowerCase()).slice(-8);
    if (st.typed.endsWith('fire')){
      st.typed = ''; st.flameMode = !st.flameMode;
      input.pressed.delete('interact');            // son harf E: inişi tetiklemesin
      if (st.flameMode){ audio.sfx('roar'); st.burst = 1.2; }
    }
  });
  world.renderer.domElement.addEventListener('pointerdown', e => {
    if (!st.active || !st.flameMode || e.button !== 0) return;
    if (st.burst <= 0.2) audio.sfx('roar');
    st.burst = 1.1;
  });

  async function start(){
    if (st.active) return;
    await ui.fade(() => {
      if (hero.mounted) hero.dismount();
      // ejderhayı kafesten çıkar: kapının önünde, batıya bakarak bekler
      st.home = {parent:D.root.parent, pos:D.root.position.clone(), rot:D.root.rotation.clone(), scale:D.root.scale.clone()};
      scene.attach(D.root); D.root.rotation.order = 'YXZ';
      st.pos.set(CAGE.x - CAGE.R - 9, 0, CAGE.z + 0.5); st.yaw = -Math.PI / 2; st.pitch = 0; st.roll = 0; st.speed = 0; st.vy = 0; st.grounded = true; st.mt = 0; st.mp = 0;
      D.riding = true;
      // oyuncu eyere oturur
      const u = hero.obj.userData;
      D.body.add(hero.obj); hero.obj.position.copy(RIDER); hero.obj.rotation.set(0, 0, 0);
      u.legL.rotation.set(-1.3, 0, -0.75); u.legR.rotation.set(-1.3, 0, 0.75); u.armL.rotation.x = -0.9; u.armR.rotation.x = -0.9;
      st.fov = camera.fov;
      place(0);
      snapCam();
    });
    st.active = true; hooks.setMode('fly');
    $('flyHud').hidden = false;
    showTitle('Pyra', 'Boşluk ile havalan');
    audio.sfx('roar');
  }
  async function stop(){
    if (!st.active) return;
    await ui.fade(() => {
      // oyuncu ejderhanın altındaki zemine iner
      const p = {x:st.pos.x, z:st.pos.z};
      C.resolve(p, 0.6, 0);
      if (C.bound) C.bound(p);   // deniz üstünde inilirse kıyıya
      scene.add(hero.obj); hero.obj.visible = true; const u = hero.obj.userData;
      u.legL.rotation.set(0, 0, 0); u.legR.rotation.set(0, 0, 0); u.armL.rotation.x = 0; u.armR.rotation.x = 0;
      hero.zone = null; hero.teleport(p.x, C.height(p.x, p.z), p.z, st.yaw); hero.camDistT = 7.5; hero.camPitch = 0.3; hero.snapCamera = true;
      // Pyra kafesine döner
      D.riding = false; D.roar = 0; D.vel = null; D.fireBoost = 1; D.fireDir = null; D.fire.material.size = 0.9;
      st.home.parent.attach(D.root); D.root.position.copy(st.home.pos); D.root.rotation.copy(st.home.rot); D.root.scale.copy(st.home.scale);
      D.legs.forEach(l => { l.rotation.x = 0; });
      camera.fov = st.fov; camera.updateProjectionMatrix();
    });
    st.active = false; $('flyHud').hidden = true; hooks.setMode('play');
    ui.toast('Pyra kafesine döndü', 2200);
  }

  function place(){
    D.root.position.copy(st.pos);
    D.root.rotation.set(-st.pitch * 0.85, st.yaw, st.roll, 'YXZ');
  }
  function forward(out){ const cp = Math.cos(st.pitch); return out.set(Math.sin(st.yaw) * cp, Math.sin(st.pitch), Math.cos(st.yaw) * cp); }
  function snapCam(){ computeCam(); camera.position.copy(camPos); camera.lookAt(camLook); }
  function computeCam(){
    D.root.updateMatrixWorld(true);
    forward(fwd);
    if (st.cam === 'binici'){
      // binici gözü: ejderhanın sağ omzunun üstünden; boyun ve baş görüşün sol altında kalır
      D.body.localToWorld(camPos.set(-1.7, 4.3, -1.6));
      camLook.copy(camPos).addScaledVector(fwd, 30); camLook.y -= 5.5;
      camLook.x -= Math.cos(st.yaw) * 2.5; camLook.z += Math.sin(st.yaw) * 2.5;   // bakış hafif sağa: boyun ve baş sol altta kalır
    } else {
      const back = 12 + st.speed * 0.08;
      camPos.copy(st.pos).addScaledVector(fwd.set(Math.sin(st.yaw), 0, Math.cos(st.yaw)), -back); camPos.y = st.pos.y + 5.5 + Math.max(0, -st.pitch) * 4;
      camLook.copy(st.pos); camLook.y += 3.5;
    }
  }
  function showTitle(name, sub){ const el = $('flyTitle'); el.querySelector('b').textContent = name; el.querySelector('span').textContent = sub; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); st.titleT = 4; }

  function update(dt, t){
    if (!st.active) return;
    const K = input.keys, mv = input.move;
    // tuşlar
    if (input.take('camera') || input.take('view')){ st.cam = st.cam === 'binici' ? 'takip' : 'binici'; ui.toast(st.cam === 'binici' ? 'Kamera: binici gözü' : 'Kamera: takip', 1400); }
    if (input.take('time')) hooks.nextWeather();
    if (input.take('photo')){ hooks.photo(); ui.toast('Fotoğraf kaydedildi', 1600); }
    const fireHeld = K.has('KeyF');
    if (input.take('interact') && !fireHeld){ stop(); return; }
    if (fireHeld){ if (st.fire <= 0) audio.sfx('roar'); D.roar = Math.max(D.roar, 0.8); st.fire = 0.4; } else st.fire -= dt;
    if (st.burst > 0){ st.burst -= dt; D.roar = Math.max(D.roar, 0.8); }
    D.fireBoost = st.flameMode ? 2.6 : 1.6;
    // uçarken alev ejderhanın baktığı yöne, hafif aşağı doğru çıkar; gizli modda daha iri
    D.fireDir = (D.fireDir || L(0, 0, 0)).copy(forward(tmp)); D.fireDir.y -= 0.38; D.fireDir.normalize();
    D.fire.material.size = st.flameMode ? 2.4 : 1.4;

    // dümen: A/D ve fareyle sürükleme yön verir; W hızlanır, S yavaşlar; Boşluk yükselir, Shift dalar
    // fare sürüklemesi birikir ve yavaşça söner: sürükledikçe döner/yükselir
    st.mt = Math.max(-1.4, Math.min(1.4, st.mt - input.look.dx * 0.006)) * (1 - Math.min(1, dt * 1.5));
    st.mp = Math.max(-0.6, Math.min(0.5, st.mp - input.look.dy * 0.004)) * (1 - Math.min(1, dt * 0.8));
    const turn = -mv.x * 1.25 + st.mt;
    st.yawRate += (turn - st.yawRate) * Math.min(1, dt * 3);
    st.yaw += st.yawRate * dt * (st.grounded ? 0.6 : 1);
    const climb = K.has('Space') ? 1 : 0, dive = (K.has('ShiftLeft') || K.has('ShiftRight')) ? 1 : 0;
    const pitchT = Math.max(-0.75, Math.min(0.6, (climb - dive) * 0.42 + (st.grounded ? 0 : st.mp)));
    st.pitch += (pitchT - st.pitch) * Math.min(1, dt * (climb || dive ? 2.2 : 1.4));
    const targetSpeed = mv.y > 0.1 ? 34 : mv.y < -0.1 ? 3 : 15;
    st.speed += (targetSpeed - st.speed) * Math.min(1, dt * (mv.y > 0 ? 0.6 : 0.9));
    if (st.pitch < -0.15) st.speed = Math.min(52, st.speed + dt * -st.pitch * 18);       // dalışta hızlanır
    // kalkış ve iniş
    const gy = Math.max(0, C.height(st.pos.x, st.pos.z));
    if (st.grounded){
      st.speed = Math.min(st.speed, mv.y > 0 ? 6 : 2.5);
      if (climb){ st.grounded = false; st.vy = 7; audio.sfx('whoosh'); }
    }
    forward(fwd);
    const lift = climb ? 7 : 0, sink = st.speed < 6 && !climb ? -2.2 : 0;
    st.vy += ((fwd.y * st.speed + lift + sink) - st.vy) * Math.min(1, dt * 2.5);
    st.pos.x += Math.sin(st.yaw) * Math.cos(st.pitch) * st.speed * dt;
    st.pos.z += Math.cos(st.yaw) * Math.cos(st.pitch) * st.speed * dt;
    if (!st.grounded) st.pos.y += st.vy * dt;
    // alçak uçuşta binalara çarpmasın; zemine değerse yere konar
    if (st.pos.y - gy < 14){ const p = {x:st.pos.x, z:st.pos.z}; C.resolve(p, 2.2, st.pos.y); st.pos.x = p.x; st.pos.z = p.z; }
    if (st.pos.y <= gy){ st.pos.y = gy; if (!st.grounded && st.vy < 0){ st.grounded = true; st.vy = 0; st.pitch = 0; audio.sfx('land'); } }
    if (st.grounded) st.pos.y = gy;
    st.pos.y = Math.min(st.pos.y, 420);
    // dünya sınırı: yumuşakça geri döndür
    const rr = Math.hypot(st.pos.x, st.pos.z - 10); if (rr > 900){ const k = 900 / rr; st.pos.x *= k; st.pos.z = 10 + (st.pos.z - 10) * k; st.yaw += dt * 1.2; }
    st.roll += ((-st.yawRate * 0.55 * Math.min(1, st.speed / 10)) - st.roll) * Math.min(1, dt * 3);
    place();

    // ejderha animasyonu
    const air = !st.grounded;
    const flapF = air ? (st.speed < 8 || climb ? 4.6 : st.pitch < -0.2 ? 0 : 2.4) : 0;
    st.phase += dt * flapF * Math.PI * 2 / 2.2;
    const amp = air ? (flapF === 0 ? 0.04 : 0.55 + climb * 0.2) : 0;
    D.wings.forEach(({w, sd}) => {
      const spread = air ? 1 : 0;
      w.rotation.y += ((-sd * (air ? 0.25 : 0.95)) - w.rotation.y) * Math.min(1, dt * 4);
      const base = air ? 0.05 + (st.pitch < -0.2 ? 0.25 : 0) : 0.5;
      w.rotation.z = sd * (base + Math.sin(st.phase) * amp * spread);
    });
    const s = Math.sin(st.phase); if (air && amp > 0.3 && s > 0.95 && t - st.flapLast > 0.35){ st.flapLast = t; if (st.pos.y - gy < 60) audio.sfx('whoosh'); }
    D.legs.forEach((l, i) => { l.rotation.x += ((air ? (i < 2 ? 0.9 : 1.2) : 0) - l.rotation.x) * Math.min(1, dt * 3); });
    D.neck.forEach((n, i) => { n.rotation.y += ((st.yawRate * 0.05) - n.rotation.y) * Math.min(1, dt * 3); n.rotation.x = (n.userData.bx ?? 0) + (air ? 0.07 : 0) + Math.sin(t * 1.2 + i * 0.4) * 0.02 - (D.roar > 0 ? 0.06 : 0); });
    D.tail.forEach((n, i) => { n.rotation.y = Math.sin(t * 1.6 - i * 0.45) * 0.08 - st.yawRate * 0.06; n.rotation.x = air ? -0.02 + Math.sin(st.phase - i * 0.4) * 0.03 : 0.05; });
    // alev parçacıkları ejderhanın hızını taşısın (yoksa uçarken başın arkasında kalır)
    forward(fwd); D.vel = (D.vel || L(0, 0, 0)).copy(fwd).multiplyScalar(st.grounded ? 0 : st.speed); D.vel.y = st.grounded ? 0 : st.vy;
    // oyuncunun konumu (gölgeler, keşifler, kayıt için)
    hero.pos.set(st.pos.x, gy, st.pos.z); hero.yaw = st.yaw;

    // kamera
    computeCam();
    const k = st.cam === 'binici' ? 1 : Math.min(1, dt * 5);
    hero.obj.visible = st.cam !== 'binici';
    camera.position.lerp(camPos, k); camera.lookAt(camLook);
    const wantFov = st.fov + Math.min(18, st.speed * 0.3);
    camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 2); camera.updateProjectionMatrix();

    // gösterge: irtifa, hız, yerden yükseklik, konum
    const ps = places(); let best = null, bd = 1e9;
    for (const p of ps){ const d = Math.hypot(p.x - st.pos.x, p.z - st.pos.z); if (d < bd){ bd = d; best = p; } }
    $('flyAlt').innerHTML = '<b>' + Math.round(st.pos.y) + '</b> m <span>· ' + st.speed.toFixed(1).replace('.', ',') + ' m/sn · yerden ' + Math.round(st.pos.y - gy) + ' m</span>';
    $('flyLoc').textContent = best && bd < 70 ? 'Konum: ' + best.name : 'Konum: Lumière arazisi';
    if (best && bd < 45 && best !== st.title && !st.grounded){ st.title = best; showTitle(best.name, best.sub); }
    st.titleT -= dt; if (st.titleT <= 0) $('flyTitle').classList.remove('on');
  }

  return {start, stop, update, get active(){ return st.active; }, state:st};
}

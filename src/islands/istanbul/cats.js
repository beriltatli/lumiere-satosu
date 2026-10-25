// İstanbul'un sokak kedileri: gerçekçi GLB kedi, mama kapları, sevme ve Kadıköy'ün maskotu Tombi.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const COAT = [0xe8a060, 0xb0aca8, 0x4a4644, 0xffffff, 0xf0d8b0];

export function buildCats(ctx, env){
  const { THREE, kit } = ctx;
  const store = env.store;
  const total = env.CATS.length;
  if (!Array.isArray(store.cats)) store.cats = [];
  const cats = [];      // sokak kedileri
  const all = [];       // güncellenecek bütün kediler (Tombi dahil)

  const clipOf = (anims, ad) => {
    for (let i = 0; i < anims.length; i++) if (anims[i].name.endsWith('|' + ad)) return anims[i];
    return null;
  };
  // uyuyan kedinin yalnız "Idle" animasyonu ağır çekim; beslenme/dans normal hızda
  const rateOf = (c, ad) => c.kind === 'sleep' && ad === 'Idle' ? 0.25 : 1;

  function setBase(c, ad, fade = 0.25){
    if (!c.acts) return;
    const key = c.acts[ad] ? ad : (c.acts.Idle ? 'Idle' : null);
    if (!key) return;
    const a = c.acts[key];
    c.base = a; c.baseName = key;
    if (a === c.act){
      a.enabled = true; a.setEffectiveWeight(1); a.setEffectiveTimeScale(rateOf(c, key));
      if (!a.isRunning()) a.play();
      return;
    }
    a.reset(); a.setLoop(THREE.LoopRepeat, Infinity); a.clampWhenFinished = false;
    a.enabled = true; a.setEffectiveWeight(1); a.setEffectiveTimeScale(rateOf(c, key));
    a.play();
    if (c.act) c.act.crossFadeTo(a, fade, false);
    else if (fade > 0) a.fadeIn(fade);
    c.act = a; c.one = null;
  }

  function headbutt(c){
    if (!c.acts || !c.acts.Headbutt) return;
    const h = c.acts.Headbutt;
    h.reset(); h.setLoop(THREE.LoopOnce, 1); h.clampWhenFinished = true;
    h.enabled = true; h.setEffectiveWeight(1); h.setEffectiveTimeScale(1);
    h.play();
    if (c.act && c.act !== h) c.act.crossFadeTo(h, 0.16, false);
    c.act = h; c.one = h;
  }

  function bindOneShot(c){
    c.mixer.addEventListener('finished', e => {
      if (e.action !== c.one) return;
      const b = c.base;
      c.one = null;
      if (!b){ e.action.fadeOut(0.25); return; }
      b.enabled = true; b.setEffectiveWeight(1); b.setEffectiveTimeScale(rateOf(c, c.baseName));
      b.play();
      e.action.crossFadeTo(b, 0.25, false);
      c.act = b;
    });
  }

  /* ---------- kedilerin yerleri ve etkileşimleri (yükleme beklenmeden) ---------- */
  const bowlGeo = new THREE.CylinderGeometry(0.13, 0.1, 0.06, 12);
  const bowlM = kit.mat(0x969692, {roughness:0.8});

  for (let i = 0; i < env.CATS.length; i++){
    const x = env.CATS[i][0], z = env.CATS[i][1];
    const q = ctx.rnd();
    const kind = q < 0.6 ? 'idle' : q < 0.85 ? 'walk' : 'sleep';
    const c = {i, x, z, kind, y:env.Hs(x, z), ry:0, baseName:kind === 'walk' ? 'Walk' : 'Idle', node:null,
      mixer:null, acts:null, base:null, act:null, one:null, dance:0, a:0, r:0, dir:1};
    if (kind === 'walk'){
      c.r = 1.5 + ctx.rnd() * 1.5;
      c.a = ctx.rnd() * Math.PI * 2;
      c.dir = ctx.rnd() < 0.5 ? -1 : 1;
    } else {
      c.ry = ctx.rnd() * Math.PI * 2;
    }
    if (kind === 'sleep') c.y -= 0.08;
    if (kind === 'idle'){
      if (ctx.rnd() < 0.5) c.baseName = 'Idle_Eating';
      // kedinin önüne küçük gri mama kabı
      const bx = x + Math.sin(c.ry) * 0.36, bz = z + Math.cos(c.ry) * 0.36;
      const by = env.Hs(bx, bz);
      kit.add(bowlGeo, bowlM, bx, by + 0.03, bz, env.reg(bx, bz));
      ctx.C.circle(bx, bz, 0.16).low = true;
    }
    if (kind !== 'walk') ctx.C.circle(x, z, 0.3).low = true;
    c.actFn = async () => {
      if (store.simit > 0){
        const pick = await ctx.ui.dialog([{name:'Sokak kedisi', text:'Miyav?', choices:['Sev', 'Simit kırıntısı ver', 'Vazgeç']}]);
        if (pick === 2) return;
        if (pick === 1){
          store.simit--;
          ctx.save();
          setBase(c, 'Idle_Eating');
          ctx.ui.toast('Kedi kırıntıları afiyetle yedi');
          return;
        }
      }
      ctx.sfx('chime');
      headbutt(c);
      if (!store.cats.includes(i)){ store.cats.push(i); ctx.save(); }
      const n = store.cats.length;
      if (n >= total) ctx.ui.say('İstanbul\'un kedileri', 'Mırrr... İstanbul\'un bütün kedileri seni tanıdı! (' + n + '/' + total + ') Artık bu şehrin bir parçasısın.');
      else ctx.ui.toast('Mırrr... Kedi mutlu (' + n + '/' + total + ')', 2200);
    };
    ctx.interact(x, z, 'Kediyi sev', c.actFn, 1.6);
    cats.push(c); all.push(c);
  }

  /* ---------- özel kedi Tombi: Kadıköy'ün maskotu ---------- */
  function tombiSpot(){
    const bx = env.PAD.x - 25, bz = env.PAD.z + 10;
    for (let ring = 0; ring <= 9; ring++){
      const rad = ring * 1.6, n = ring ? Math.max(8, ring * 8) : 1;
      for (let k = 0; k < n; k++){
        const a = k / n * Math.PI * 2;
        const x = bx + Math.sin(a) * rad, z = bz + Math.cos(a) * rad;
        if (!env.landG(x, z) || !env.inland(x, z, 1.5)) continue;
        if (env.occ.has(env.cell(x, z))) continue;
        if (env.roadDist(x, z) < 0.8) continue;
        return [x, z];
      }
    }
    return [bx, bz];
  }
  const tp = tombiSpot(), tx = tp[0], tz = tp[1], ty = env.Hs(tx, tz);
  const tombi = {x:tx, z:tz, y:ty, kind:'tombi', ry:Math.atan2(env.PAD.x - tx, env.PAD.z - tz), baseName:'Idle',
    node:null, mixer:null, acts:null, base:null, act:null, one:null, dance:0};
  all.push(tombi);
  env.occ.add(env.cell(tx, tz));
  ctx.C.circle(tx, tz, 0.3).low = true;
  {
    const c = Math.cos(tombi.ry), s = Math.sin(tombi.ry);
    const sx = tx + c * 0.85, sz = tz - s * 0.85, sy = env.Hs(sx, sz), G = env.reg(sx, sz);
    kit.signBoard('Tombi', sx, sy + 0.6, sz, tombi.ry, 0.8, G);
    kit.add(new THREE.BoxGeometry(0.05, 0.6, 0.05), kit.mat(0x5a4632, {roughness:0.9}), sx, sy + 0.3, sz, G);
    ctx.C.circle(sx, sz, 0.18).low = true;
  }
  ctx.interact(tx, tz, 'Tombi ile oyna', async () => {
    ctx.sfx('chime');
    await ctx.ui.dialog([
      {name:'Tombi', text:'Miyav! Ben Tombi. Kadıköy\'ün en tembel, en sevimli kedisiyim. Benimle dans eder misin?'},
      {name:'Küçük tabela', text:'"Tombi — Kadıköy\'ün maskot kedisi. Onu sevmeden bu meydandan geçilmez."'},
    ]);
    if (!tombi.acts || !tombi.acts.Dance) return;
    tombi.dance = 4;
    setBase(tombi, 'Dance', 0.2);
  }, 1.6);

  /* ---------- modeller: birer kez yükle, her kedi için klonla ---------- */
  function meshBody(node, scale){
    node.scale.setScalar(scale);
    node.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(node);
    if (Number.isFinite(b.min.y)) node.position.y = -b.min.y;
  }

  function loadKedi1(gltf){
    const src = gltf.scene;
    src.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
    const len = Math.max(size.x, size.z);
    const scale = len > 0.0001 ? 0.5 / len : 1;      // gövde ~0.5 m; model +z'ye bakar
    const srcMats = [], index = new Map();
    src.traverse(o => {
      if (!o.isMesh) return;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!index.has(m)){ index.set(m, srcMats.length); srcMats.push(m); } });
    });
    const palette = COAT.map(hex => srcMats.map(m => {
      const n = m.clone();
      n.color = new THREE.Color(hex).convertSRGBToLinear();
      return n;
    }));
    for (let i = 0; i < cats.length; i++){
      const c = cats[i];
      const node = SkeletonUtils.clone(src);
      meshBody(node, scale);
      const pal = palette[i % palette.length];
      node.traverse(o => {
        if (!o.isMesh) return;
        o.userData.keep = true;
        o.frustumCulled = false;
        o.castShadow = true; o.receiveShadow = true;
        if (Array.isArray(o.material)) o.material = o.material.map(m => pal[index.get(m)] || pal[0]);
        else o.material = pal[index.get(o.material)] || pal[0];
      });
      const wrap = new THREE.Group();
      wrap.userData.dyn = true;
      wrap.add(node);
      if (c.kind === 'walk'){
        const x = c.x + Math.sin(c.a) * c.r, z = c.z + Math.cos(c.a) * c.r;
        wrap.position.set(x, env.Hs(x, z), z);
        wrap.rotation.y = c.a + c.dir * Math.PI / 2;
      } else {
        wrap.position.set(c.x, c.y, c.z);
        wrap.rotation.y = c.ry;
      }
      ctx.root.add(wrap);
      if (ctx.world && ctx.world.atmo && ctx.world.atmo.patchScene) ctx.world.atmo.patchScene(node);
      c.node = wrap;
      c.mixer = new THREE.AnimationMixer(node);
      c.acts = {};
      ['Idle', 'Idle_Eating', 'Walk', 'Headbutt'].forEach(ad => {
        const clip = clipOf(gltf.animations, ad);
        if (clip) c.acts[ad] = c.mixer.clipAction(clip);
      });
      bindOneShot(c);
      setBase(c, c.baseName, 0);
    }
  }

  function loadTombi(gltf){
    const src = gltf.scene;
    src.updateMatrixWorld(true);
    const size = new THREE.Box3().setFromObject(src).getSize(new THREE.Vector3());
    const len = Math.max(size.x, size.z);
    const scale = len > 0.0001 ? 0.6 / len : 1;      // Tombi ~0.6 m
    const node = SkeletonUtils.clone(src);
    meshBody(node, scale);
    node.traverse(o => {
      if (!o.isMesh) return;
      o.userData.keep = true;
      o.frustumCulled = false;
      o.castShadow = true; o.receiveShadow = true;
    });
    const wrap = new THREE.Group();
    wrap.userData.dyn = true;
    wrap.add(node);
    wrap.position.set(tombi.x, tombi.y, tombi.z);
    wrap.rotation.y = tombi.ry;
    ctx.root.add(wrap);
    if (ctx.world && ctx.world.atmo && ctx.world.atmo.patchScene) ctx.world.atmo.patchScene(node);
    tombi.node = wrap;
    tombi.mixer = new THREE.AnimationMixer(node);
    tombi.acts = {};
    ['Idle', 'Dance', 'Walk', 'Yes', 'No'].forEach(ad => {
      const clip = clipOf(gltf.animations, ad);
      if (clip) tombi.acts[ad] = tombi.mixer.clipAction(clip);
    });
    setBase(tombi, 'Idle', 0);
  }

  const loader = new GLTFLoader();
  loader.load('assets/models/kedi1.glb', gltf => { try { loadKedi1(gltf); } catch (e){} }, undefined, () => {});
  loader.load('assets/models/kedi2.glb', gltf => { try { loadTombi(gltf); } catch (e){} }, undefined, () => {});

  /* ---------- her kare: yalnız 90 m içindeki kediler ---------- */
  ctx.onUpdate(dt => {
    const hx = ctx.hero.x, hz = ctx.hero.z;
    for (let i = 0; i < all.length; i++){
      const c = all[i];
      const px = c.node ? c.node.position.x : c.x, pz = c.node ? c.node.position.z : c.z;
      const dx = hx - px, dz = hz - pz;
      if (dx * dx + dz * dz > 8100) continue;
      if (c.kind === 'walk' && c.node){
        c.a += c.dir * (0.5 / c.r) * dt;
        const x = c.x + Math.sin(c.a) * c.r, z = c.z + Math.cos(c.a) * c.r;
        c.node.position.set(x, env.Hs(x, z), z);
        c.node.rotation.y = c.a + c.dir * Math.PI / 2;
      }
      if (c.dance > 0){
        c.dance -= dt;
        if (c.dance <= 0){ c.dance = 0; setBase(c, 'Idle', 0.2); }
      }
      if (c.mixer) c.mixer.update(dt);
    }
  });
}

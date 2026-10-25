# Island guide: rules and the `ctx` API

This document explains how to write `src/islands/<island-id>/island.js`. For the contribution process (fork, branch, PR), see [CONTRIBUTING.md](../../CONTRIBUTING.md) in the root directory. The fastest way to start is to copy [`_sablon/island.js`](_sablon/island.js), a working example.

## How the system works

- At startup, `src/islands/index.js` finds the `src/islands/*/island.js` files on its own through Vite. **You don't need to touch the main code (`main.js`, `index.js` and so on).**
- Folders that start with `_` (e.g. `_sablon`) are not loaded.
- When the player reaches the ship **La Belle Étoile** at Lumière's south pier (or Captain Jean-Baptiste) and presses **E**, a list opens and they pick your island from it.
- All contributor islands are built at the centre of the world (0, 0), but **only one island is visible at a time.** Sailing to an island hides the previous one. An island is built on its first visit, so it doesn't slow down the game's startup.
- Exception: **anchored islands** that set `at` stay fixed at their own spot in the world, share Lumière's collision space, are always visible and are reached by flying with Pyra (the ship works too). They preload in idle time a few seconds after the game starts.
- Every island has its own collision space (`ctx.C`), coast, ocean, pier, captain and ship. The pier, captain and ship are added automatically.
- If `build(ctx)` throws an error, the game doesn't crash. The console shows `[ada] <id> kurulamadı` ("could not be built") and the player returns to Lumière. If code that runs every frame throws, the island's updates are stopped.

## The definition object

`island.js` exports a single object with `export default`:

| Field | Required | Description |
|---|---|---|
| `id` | yes | Must be the **same** as the folder name. Lowercase letters, digits and hyphens, 2–31 characters, starting with a letter (e.g. `venedik`, `kyoto-2`). `lumiere` is not allowed. |
| `name` | yes | Display name (e.g. `'Venedik Lagünü'`). |
| `build(ctx)` | yes | The function that builds the island. Described in detail below. |
| `theme` | | Short description shown next to the name in the captain's list. |
| `author` | | Your GitHub username. |
| `description` | | Hint text for the "keşif" (exploration) quest in the journal. |
| `order` | | Position in the ship's list (default 100; lower comes first). |
| `seed` | | Seed (integer). `ctx.rnd` and the kit are seeded with it: the same seed builds the same island every time. |
| `coast` | | Coastline: `{radius, waves, flat, ripple, soft}`. Details below. |
| `terrain` | | `{groundColor, sand, grass, shallow, deep, rocks, seed}`: colours (hex) for the grass, sand, shore grass, shallow and deep water, and the number of rocks. |
| `harbor` | | Angle of the pier on the coast (radians, default 0, i.e. south). |
| `pierLength` | | Length of the pier (m, default 46). |
| `at` | | `{x, z}`: places the island at this point in the world (an **anchored island**). Like Lumière and Yùlóng it is always visible and can be flown to with Pyra the dragon. You still write your code in your own (0, 0)-centred coordinates; the engine offsets collision, interactions and markers. Pick a spot about 1.5 km from Lumière that leaves a ~500 m gap between shores (Istanbul: `{x:-980, z:-980}`, radius 470). |
| `map` | | `{rings:() => [[[x, z], ...]], pins:[{name, x, z}]}`: the real coastline and place pins to draw on the minimap and the **M** map (in island coordinates). If omitted, a coast circle is drawn. |

**Don't** give `cx`, `cz` or `fn` in `coast`: the island is always built at the centre.

## Coordinates and units

- The unit is the metre. **x is east, z is south** (+z points south), y is up.
- Angle `a = atan2(x, z)`: 0 is south, π/2 east, π north, -π/2 west. `harbor` and coast angles follow this convention.
- Rotation (`rotation.y`, `ry`): at 0, the front of an object faces +z (south).
- The default coast radius is 300 m. The beach starts ~18 m inland from the shoreline. Use `ctx.coast.dist(x, z)` to tell whether a point is on land: a **negative value means land**, positive means sea. Place buildings where `dist < -25`.
- The player starts at the end of the pier, facing the land (`ctx.harbor`).
- The ground is flat (y = 0). If you want hills, make your own geometry and report the height through `ctx.C.heightFns` (see below).

### The `coast` shape

```js
coast:{
  radius:260,                        // mean radius (m)
  waves:[[3, 18, 0.4], [5, 8, 1.7]], // [n, amplitude, phase]: large bays and headlands; n must be an integer
  ripple:[[11, 3, 0.2]],             // small ripples
  flat:{angle:0, dist:220},          // optional: a straight beach in that direction
}
```

## `ctx`: what you can use inside `build(ctx)`

| Name | Description |
|---|---|
| `ctx.THREE` | three.js (r147). Don't `import * as THREE` yourself; use this. |
| `ctx.root` | The island's content group. Everything you add goes under it (`kit` already adds things here). |
| `ctx.kit` | The building kit (`src/kit.js`). Details below. |
| `ctx.C` | The island's collision space (`src/game/collision.js`). |
| `ctx.coast` | The coast: `dist(x, z)`, `point(angle, distanceFromShore)` → `[x, z]`, `R(angle)`, `radius`. |
| `ctx.harbor` | `{x, z, angle, yaw}`: the end of the pier and its angle. |
| `ctx.rnd()` | Seeded random number (0–1). Use it instead of `Math.random()` so the island is built the same way every time. |
| `ctx.materials` | The world's shared materials (`stoneMat`, `marbleMat`, `goldMat`, `gravelMat`, `slateMat`, `lawnMat`…). **Don't modify them**; copy them with `.clone()` if you need to. |
| `ctx.W` | The current weather: fields such as `W.night` (0–1), `W.rain` (0–1), `W.clouds` and `W.elev` (sun elevation). |
| `ctx.wind` | Wind strength (~0.2–1.2). |
| `ctx.ui.say(name, text)` | A single line of speech. Returns a Promise. |
| `ctx.ui.dialog(lines)` | `[{name, text, choices?}]`. If `choices` is given, the Promise resolves with the index of the chosen option. |
| `ctx.ui.toast(text, ms)` | A short notification. |
| `ctx.sfx(name)` | Sound effect: `coin`, `quest`, `rune`, `open`, `wrong`, `blip`, `bell`, `gong`, `chime`, `drum`, `wood`, `whoosh`, `whistle`, `roar`. |
| `ctx.store` | An object that belongs to your island and is **written to the save**. Only put JSON-serialisable values in it (numbers, strings, arrays, plain objects). |
| `ctx.save()` | Writes the save immediately (call it after quest steps). |
| `ctx.interact(x, z, label, fn, r = 2.4, show = () => true)` | An interaction triggered with **E**. If `show()` returns false, the interaction is hidden. |
| `ctx.marker({id, label, x, z, color, minor, show})` | A compass marker. It's hidden while `show()` is false. `minor: true` makes it a small marker. |
| `ctx.place({id, name, x, z, r})` | A place to discover. When the player comes within `r` (default 14 m), a "Keşfedildi" (Discovered) notification appears and the place is saved. The nearest two show on the compass. The "<Island>: keşif" quest is added to the journal automatically. |
| `ctx.room(spec)` | A building you can enter. Details below. |
| `ctx.onUpdate(fn)` | Calls `fn(dt, t, hero)` every frame (only while the island is visible). |
| `ctx.hero` | The player's position: `x`, `y`, `z` (read-only). |
| `ctx.callDragon({x, z, yaw})` | Calls Pyra to this point (only meaningful on anchored islands, e.g. a horn at a landing field). The point must be open ground. |
| `ctx.world`, `ctx.audio` | The engine itself. Only use these if you really need to. PRs that use them to change Lumière or global settings won't be accepted. |

`build` can return an object:

- `update(dt, t, hero)`: called every frame (same job as `ctx.onUpdate`).
- `keepUnbaked: true`: turns off the kit's merge step. Only use it while debugging.

## The building kit (`ctx.kit`)

The kit lives in `src/kit.js`. The most used parts:

| Function | Description |
|---|---|
| `add(geo, mat, x, y, z, parent = root, shadow = true)` | Adds a mesh and returns it. |
| `mat(color, options)` | A cached `MeshStandardMaterial`. The same colour returns the same material, which means fewer draw calls. |
| `plane(w, d, mat, x, y, z, rot)` · `disc(r, mat, x, y, z)` | Ground cover (paths, squares). Give y = 0.01–0.03 so it doesn't overlap the ground. |
| `hall({x, z, w, d, h, rot, wall, roof, roofMat, roofH, door, doorW, doorStyle, winRows, collide})` | A rectangular building: windows, roof (`'mansard'`, `'gable'`, `'flat'`), door and collision. The door is on the local +z face. Returns `{G, front}`; `front` is the `[x, z]` point 1.6 m in front of the door. |
| `column(x, z, h, r)` · `statue(x, z, variant 0–5, ry, scale, name, text)` | Column and statue. Give a statue a name and text and the player can talk to it. |
| `signPost(text, x, z, ry)` · `signBoard(text, x, y, z, ry, w)` | Signs. |
| `npc({coat, hat, apron, chef, trim})` · `lady(dressColor, hairColor)` | Returns a figure (Group). |
| `placeNPC(figure, x, z, ry, name, fn)` | Places a figure: it turns towards the player when they come close, and gets a "Konuş: <name>" (Talk) interaction and collision. |
| `canvas(w, h)` · `ctex(canvas, rx, ry)` | A canvas and texture for generating textures in code. |
| `lathe(points)` · `frustum` · `gableGeo` | Geometry helpers. |
| `stone`, `marble`, `gold`, `gravel`, `slate`, `cream`, `plaster`, `wood`, `darkWood`, `grass`, `lampMat` | Ready-made materials. |

**Colours:** write hex colours as they are (sRGB). After `build` finishes, the colours of all materials on the island are converted to linear once. So for materials you create **after** `build` finishes, you have to convert the colour yourself (`color.convertSRGBToLinear()`).

**Merging (bake):** after `build` finishes, the kit merges static meshes that share a material. This brings thousands of parts down to a few draw calls. As a result:

- Mark a group that will **move, rotate or be hidden** later with `group.userData.dyn = true`. Its contents are merged among themselves, but the group stays in place and can be rotated (example: the windmill in the template).
- For a single mesh that will be hidden or changed on its own, use `mesh.userData.keep = true` (example: the lantern in the template).
- `InstancedMesh` is not merged. Use it for things repeated hundreds of times, such as trees, fences and stones.

## Collision (`ctx.C`)

The player only collides with obstacles you define. **Add a collision shape to every visible solid object.**

```js
ctx.C.circle(x, z, r);                 // circle (tree trunk, column, fountain)
ctx.C.box(x, z, halfWidth, halfDepth, ry); // rotated box (wall, building)
ctx.C.rect(x0, z0, x1, z1);            // axis-aligned box
const o = ctx.C.box(...); o.y0 = 2; o.y1 = 5; // obstacle only within this height range (under a bridge, a balcony)
o.low = true;                          // the camera ignores this obstacle (low fence)
```

To add a walkable surface (stairs, terrace, bridge, hill):

```js
ctx.C.heightFns.push((x, z) => (Math.abs(x) < 10 && z > 0 && z < 20) ? 1.2 : null); // null: no surface here
```

The player climbs steps of up to 0.6 m. Higher surfaces are reached by stairs (heights that rise step by step). The barrier that stops the player walking past the shoreline is added automatically.

## Buildings you can enter (`ctx.room`)

```js
const inn = kit.hall({x:0, z:38, w:16, d:10, h:6, roof:'gable'});
ctx.room({
  id:'han', name:'Yolcu hanı',                  // "Travellers' inn"
  door:{x:inn.front[0], z:inn.front[1], ry:0},  // entry point outside; ry: the direction facing out of the door (the building's rot value)
  w:12, d:9, h:4.4,                             // interior size; the entrance is on the room's local +z wall
  floor:'ahsap', walls:'ahsap', ceiling:'kiris', lights:2,
  decor(R){ R.table(0, -1); R.npc(0, -4, 0, 'Hancı', ['Hoş geldin!']); },  // "Innkeeper", "Welcome!"
});
```

- `floor`: `parke` (parquet), `mermer` (marble), `tas` (stone), `ahsap` (wood), `toprak` (earth), `mozaik` (mosaic), `tatami`
- `walls`: `saray` (palace), `alci` (plaster), `tas` (stone), `ahsap` (wood), `tugla` (brick), `mermer` (marble), `shoji`
- `ceiling`: `alci` (plaster), `boyali` (painted), `kiris` (beams), `tonoz` (vault)
- Also: `wallColor`, `curtain`, `windows`, `lamp: 'avize' | 'fener'` (chandelier | lantern), `plain: true`

The room is built the first time the player enters. Coordinates inside `decor(R)` are relative to the centre of the room (+z is the entrance wall). The full furniture kit (`R`) is in the `kit()` function in `src/rooms.js`. The main pieces: `table`, `chair`, `dining`, `bench`, `bookcase`, `cabinet`, `counter`, `barrel`, `crate`, `rug`, `painting`, `mirror`, `chandelier`, `lantern`, `candles`, `fireplace`, `plant`, `bust`, `globe`, `shelf`, `loom`, `vitrine`, `pool`, `stage`, `seats`, `npc(x, z, ry, name, lines)`, `note(x, z, label, name, lines)`, `interact(x, z, label, fn)`, `collide(x, z, hw, hd, ry)`, `anim(fn)`, `light(...)`.

## Save and quests

- The save keeps two things for your island: `found` (the ids of discovered places) and `ctx.store`.
- Keep quest state in `ctx.store` (e.g. `store.lantern = 'kayip' | 'bulundu' | 'teslim'`, i.e. lost, found, delivered). Call `ctx.save()` after changing it.
- `build` runs again every time the game starts. So set up the scene from the `store` values (e.g. if the lantern has already been picked up, it should start hidden).
- Don't touch **Lumière's save** (`runes`, `coins`, `notes`, `china`…).

## Rules (PR checklist)

1. **Only your own folder:** changes must be inside `src/islands/<id>/`. If the engine is missing something, open a separate issue or PR.
2. **No external files:** everything, including models, textures and sounds, must be generated in code (the rest of the project was written this way too). If you really need one, open an issue first; assets that aren't licensed CC0 won't be accepted.
3. **No dependencies:** `package.json` doesn't change. Only `ctx.THREE` and three.js's `examples/jsm` modules may be used.
4. **Performance:** your island should stay close to 60 fps at Medium quality on an ordinary laptop. Rough limits: fewer than 300 draw calls after merging (`renderer.info.render.calls`) and fewer than 1.5 million triangles. Use `InstancedMesh` for repeated objects. Use at most 4 dynamic lights (PointLight). Don't create new objects (`new Vector3`, arrays) in code that runs every frame.
5. **Keep generated textures small:** canvases of at most 512×512, 256 if possible.
6. **Text in Turkish:** dialogue, signs and place names must be in Turkish. Proper names can stay in their original language.
7. **Content:** it must be respectful and suitable for all ages. Content that targets real people or carries brand logos won't be accepted.
8. **Clean console:** no errors or warnings in the console while the island is being built and explored.
9. **`npm run build` must complete without errors.**

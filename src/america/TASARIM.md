# New World Island: design

A separate island built from distinctly American architecture, standing in the open sea south-west of Lumière.
All the code lives under `src/america/`; only hook-up lines are added to the main code (`main.js`, `dragonride.js`, `audio.js`).

## 0. Fitting the project: deviations from the spec

| Spec | State of the project | Decision |
|---|---|---|
| Island centre ≈ (0, 1050) | Yùlóng Island is centred at (520, 1080) with a radius of ~300 m; a 700 m wide island would overlap its western half | Centre at **(-600, 1020)**. At least 450 m from Yùlóng's coast and ~500 m from Lumière's south beach. Visible as a silhouette from Lumière and Yùlóng (fog at 900–1100 m) |
| `SHORE_Z = 300`, pier `{x:24, z0:292, z1:346}` | Lumière's coast is `LUMIERE_COAST` (radius 440, southern flat at z ≈ 290); the pier is `sea.pier` | The ferry docks on the west side of the pier via `sea.pier.toW()` |
| `hero.zone = 'ada'` and a separate `Collision` | In this project `zone` is the camera/interior mode ('ic', 'kule', 'oda'); Yùlóng lives in the same world and shares the same collision space (`C.shores`). Dragon landing, the coast boundary (`C.bound`), saving (`S.player`) and the compass all depend on this pattern | The island is built **on the Yùlóng pattern**: `buildIslandTerrain(world, C, AMERICA_COAST, {ocean:false})`. The dragon can land there, the player can't walk off the coast into the sea, and saving works without extra code. The distance-based `america.near` does the job of a "separate game zone": while the player is on the island, Lumière's heavy roots are hidden and not updated; the island has its own exploration list, journal entry and audio style |
| Poisson spacing of 120 m between monuments, and 1 : 1.618 on the Mall | On a 700 m island, 120 m between Lincoln, Washington and the Capitol would make the Mall 314 m long and cut the island in half | The Mall counts as **a single axial cluster** of three structures: the Poisson rule applies between clusters, and the golden ratio is kept inside the cluster (42 m : 68 m) |
| Add to the `PLACES` list | `PLACES` is Lumière's "you explored every garden" counter | The island has its own list, which uses the same "Keşfedildi (x/N)" (Discovered) notification and is stored in `S.notes.america.found`. The dragon-flight headings read this list too |

## 1. District map (local coordinates; x east, z south; world = (-600 + x, 1020 + z))

```
 z
-260   ________________________________________________________________
      /  SEATTLE coast            Lakes           ___ BOSTON (organic) \
-200 |      .                 CHICAGO ▓▓ ~LAKE~  /    red brick         |
     |  RUSHMORE ▲▲▲          (60×60 + L train)   |  NEW YORK ▒▒▒▒       |
-120 |   rocky hills              |  Mississippi  |  Manhattan grid      |
     |                           |                |  ● Times Square      |
 -40 |SF ≋≋ GOLDEN GATE            |                |  ■ Central Park   ◎ | Liberty Island
  0  |(hills,        ∩ GATEWAY ARCH (St. Louis)     |  DC: Lincoln─Wash─Capitol (Mall)
     | Victorian)                |  ~~ paddle boat |                      |
  80 |  ROUTE 66 desert (mesa, diner, gas pump)   \                     |
     |                                             \  NEW ORLEANS         |
 160 |____________                 Gulf of Mexico   ▼ French Quarter   /
     \___________________________________________________   MIAMI ░░ /
 260                                                         \_____/
     -350        -200        -60        40        150        260   350  x
```

## 2. Coordinate table (`landmarks.json`; local m)

| Id | District | Position (x, z) | Height | Approach (°) | View radius |
|---|---|---|---|---|---|
| liberty | NY harbour islet | (370, -20) | 46 | ferry route (from the south-east) | 160 |
| lincoln | west end of the DC Mall | (150, 40) | 14 | from the east (the Mall) | 90 |
| washington | middle of the DC Mall | (192, 40) | 56 | from the west (the Lincoln steps) | 220 |
| capitol | east end of the DC Mall | (260, 40) | 45 | from the west-south-west | 160 |
| arch | St. Louis | (12, -10) | 60 | from the east (the river) | 240 |
| rushmore | Black Hills | (-150, -150) | 52 (rock) | from the front; the faces look towards the noon sun (dot product 0.85 > 0.6) | 200 |
| goldengate | SF bay mouth | (-336, -30) | 44 (tower) | from the west-south-west | 220 |

The measured values can be read in the game through `window.__game.america.focal` (approach direction, framing separation, occlusion ratio).

District centres: New York (236, -48), Boston (282, -170), Chicago (112, -164) and Lake Michigan (206, -170), Washington (205, 40), St. Louis (-30, -10), San Francisco (-284, 46), Route 66 (-170, 104), New Orleans (154, 142), Miami Beach (248, 220).
The Mississippi flows from the north (18, -246) to the Gulf of Mexico (134, 198); it has two bridges, one at St. Louis (z = -10) and one in the north (z = -160).
Lincoln–Washington–Capitol at local (150, 40) → (192, 40) → (260, 40): spacing of 42 m : 68 m (1 : φ).

## 3. Class diagram

```
index.js  buildAmerica(world, C, hooks) → {root, C, interact, markers, places, focal, update, enter, leave}
 ├─ core/Terrain.js      coast (US outline turned into a Fourier series → makeCoast), heightmap, lake, river
 ├─ core/Rng.js          Rng (mulberry32), hash2, valueNoise
 ├─ core/Materials.js    shared materials, canvas textures, facade atlas (4×4) + night-window shader
 ├─ core/Batcher.js      layer × material key → one merge; repeated items as InstancedMesh
 ├─ core/District.js     grid / organic lots, height function, style mix, LOD groups
 ├─ core/Focal.js        axial plan, vistas, approach direction, 64-ray visibility, Poisson, weighting
 ├─ core/Structure.js    Structure (abstract): id, style, footprint, seed, lod, build(), colliders(), update()
 │    ├─ typologies/  Skyscraper · Rowhouse · Courtyard · Villa · Diner
 │    └─ landmarks/   StatueOfLiberty · MountRushmore · GoldenGate · WashingtonMonument · GatewayArch · LincolnMemorial · CapitolDome
 ├─ styles/*.js          StyleSpec: {id, typology, palette, ornament, floors, setback…}; registered automatically via import.meta.glob
 └─ props/               vehicles (taxi, cable car, L train, paddle steamer, ferry) · neon · flora (palm, moss-draped oak, autumn trees) · street (lamp, road)
```

Adding a new style takes one file: export a StyleSpec from `styles/myStyle.js` and add its name to a district's `mix` table.

## 4. Palette (sRGB hex; converted to linear in code with `lin()`)

| Material | Colour | Settings |
|---|---|---|
| Copper patina (Liberty) | `5fa38f` / shadow `3e7d6c` | metalness 0.35, roughness 0.55, streaked texture |
| Torch flame / gilding | `ffc35a` (emissive) / `d4af37` | |
| Steel (Chicago) | `8a9099` | metalness 0.9, roughness 0.35 |
| Glass curtain wall | `2b3d4f` | roughness 0.08, envMapIntensity 1.4 |
| Stainless steel (Arch) | `d0d4d8` | metalness 1.0, roughness 0.16 |
| International Orange | `c0362c` | roughness 0.6 |
| Yule marble (Lincoln) | `eeeae2` | roughness 0.3, grey veins |
| Washington Monument | lower `e9e3d6`, upper `dcd5c6` | stone changes at 2/3 of the height |
| Granite (Rushmore) | `b9b4ac`, cracks `8f8a83` | flatShading, vertex displacement |
| Red brick (Boston) | `9c4a36`, mortar `d9cfc0`, trim `f2efe8`, shutters `1d1d1f` | Flemish bond texture |
| Brownstone | `6b4a3a`, wrought iron `1b1b1d` | roughness 0.85 |
| New Orleans | stucco `e8c48a` / `e59a7e` / `f3e6c8`, shutters `2f5a3a` | alpha-tested wrought-iron balcony texture |
| SF Victorian | `7fb6c9` `f2c14e` `d96c6c` `8fbf8f` `b79ed6` | white trim bands |
| Miami | `f6c6c9` `a8e0d8` `fff1b8` `fafafa`; neon `ff3fa4` `29e3ff` `9dff5c` | neon toneMapped:false, flicker |
| Art Deco limestone | `d8cfbf` | 8% setback every 4 floors |

Windows: a single atlas (4×4 window variants). The facade shader maps each window bay to an atlas cell with `fract(uv)` (seamless thanks to `textureGrad`). The wall is tinted with the vertex colour; the window glass isn't. At night a seeded 35% of the windows light up.

## 5. Budget and LOD

- Each district has three layers: **near** (massing + ornament), **mid** (massing + window texture) and **far** (one box per building). They switch with the camera–district distance: 0–220 m, 220–480 m, and 480 m and beyond.
- Seen from Lumière, only the far layer is drawn. While the player is on the island, Lumière's heavy roots are hidden.
- Target: at most +150 draw calls and +1.5 M triangles while the island is visible. Measured with `renderer.info` in a headless browser.
- Lighting: no new sun or HDRI; at most 6 neon PointLights (the ones nearest the player are lit).

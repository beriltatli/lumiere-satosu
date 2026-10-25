# Contributing guide: add a new island to Lumière

Lumière Château is becoming an archipelago. The ship **La Belle Étoile** at Lumière's south pier sails to islands added by contributors: the Venetian lagoon, the coasts of Japan, Istanbul, or any place you can imagine. This guide walks you through adding your own island, step by step.

- **Rules and API:** [`src/islands/ADA_TALIMATI.md`](src/islands/ADA_TALIMATI.md)
- **Working example:** [`src/islands/_sablon/island.js`](src/islands/_sablon/island.js) (a stone square, an inn you can enter, a turning windmill, a villager who talks and a small quest that is written to the save)

An island is just **a single folder**: `src/islands/<island-id>/island.js`. You don't need to touch the main code. The game finds the folder on its own, adds it to the ship's list, builds the coast, ocean, pier and captain, and manages the exploration quest and the save.

The game's interface and in-game text are in Turkish, so the labels quoted below are given in Turkish with an English gloss.

## 0. Before you start

- **You need:** Node.js 18 or newer, git, and a browser with WebGL2 (Chrome, Firefox, Safari).
- **You should know:** some JavaScript and the basics of [three.js](https://threejs.org/docs/) (Mesh, Group, BufferGeometry, MeshStandardMaterial). The project uses three.js **r147**.
- **Open an issue first:** title it "New island: <island name>". Describe the island's theme and what it will contain in a few sentences. That way two people don't build the same island and ids don't clash.

## 1. Set up the repository

```bash
# Fork the repository on GitHub, then:
git clone git@github.com:<your-username>/lumiere-satosu.git
cd lumiere-satosu
git remote add upstream git@github.com:beriltatli/lumiere-satosu.git
npm install
git checkout -b ada/<island-id>          # e.g. ada/venedik
```

## 2. Copy the template

```bash
cp -r src/islands/_sablon src/islands/<island-id>
```

Open `src/islands/<island-id>/island.js` and change these fields:

```js
id:'venedik',                 // must be the SAME as the folder name; lowercase letters, digits, hyphens
name:'Venedik Lagünü',        // "Venetian Lagoon"
theme:'Kanallar ve maskeler, 1750\'ler',   // "Canals and masks, 1750s"
author:'<your-github-username>',
description:'Lagünün simgelerini bul.',     // "Find the landmarks of the lagoon."
seed:31,                      // any integer
```

In-game text (`name`, `theme`, `description`, dialogue, signs) is written in Turkish; see rule 6 in the [island guide](src/islands/ADA_TALIMATI.md#rules-pr-checklist).

Id rule: `^[a-z][a-z0-9-]{1,30}$`. Turkish characters, capital letters and spaces are not allowed (`istanbul` works, `İstanbul` doesn't).

## 3. Open it in the game

```bash
npm run dev
```

The browser opens at `http://localhost:5173`. There are two ways to reach your island:

- **From inside the game:** start a new game, walk to the pier south of Lumière, board the ship with **E** at the end of the pier and pick your island from the list.
- **Shortcut (while developing):** after starting the game, in the browser console:

  ```js
  __game.islands.travel('venedik')
  ```

The page reloads every time you save the file. Because the save lives in the browser, the game picks up on the island and at the spot where you left off.

Useful console commands:

```js
__game.hero.teleport(0, 0, 50, 0)            // teleport to (x, y, z, facing) on the island
__game.setWeather('gece')                    // gunesli | bulutlu | yagmurlu | gunbatimi | gece (sunny | cloudy | rainy | sunset | night)
__game.world.renderer.info.render            // draw calls (calls) and triangle count
__game.S.islands.venedik                     // the island's save: found, store
```

To reset the island's save: `delete __game.S.islands.venedik`, then reload the page. To reset the whole save, use the "Yeni oyun" (New game) button on the title screen.

## 4. Build the island

Everything is described in detail in [`ADA_TALIMATI.md`](src/islands/ADA_TALIMATI.md). Suggested order:

1. **Coast and ground:** set the island's shape and colours with `coast` and `terrain`. Choose the pier's direction with `harbor`.
2. **Main buildings:** place the large masses first (`kit.hall`, your own geometry). Add `ctx.C.box` / `ctx.C.circle` for every solid object.
3. **Places to discover:** between 3 and 10 `ctx.place(...)` calls. These make up the island's exploration quest.
4. **People and dialogue:** `kit.npc` with `kit.placeNPC`, or `ctx.interact`.
5. **Interiors (optional):** `ctx.room(...)`.
6. **Quest (optional):** keep its state in `ctx.store` and guide the player with `ctx.marker`.
7. **Life:** movement with `ctx.onUpdate` (boats, flags, birds), reactions to night and rain with `ctx.W`.
8. **Polish:** wind, night lights, sounds (`ctx.sfx`).

Don't add external model, texture or sound files. Like the rest of the project, generate everything in code (details in the guide).

## 5. Test before you submit

Try all of these yourself:

- [ ] `npm run build` completes without errors.
- [ ] No errors or warnings in the console, whether they start with `[ada]` or not.
- [ ] You can sail to your island and back to Lumière, and Lumière is fully intact.
- [ ] If you reload the page while on the island and choose **Devam et** (Continue), the game starts on the same island and the quest state is kept.
- [ ] Every place can be discovered, and the "<Island>: keşif" (exploration) quest completes in the journal (**J**).
- [ ] You can't walk through any building, tree or rock, and you don't bump into invisible walls.
- [ ] If there are rooms, each one can be entered and left, and leaving puts you back in front of the door.
- [ ] The island looks right at night, in rain and at sunset (`__game.setWeather(...)`).
- [ ] With quality set to **Orta** (Medium) in the menu, `renderer.info.render.calls` stays under 300 at the busiest spot on the island and the frame rate is smooth.
- [ ] At phone size (the browser's device view) the interface and touch controls work.
- [ ] Your changes are only inside `src/islands/<island-id>/` (check with `git status`).

## 6. Open a pull request

```bash
git add src/islands/<island-id>
git commit -m "New island: <Island name>"
git fetch upstream && git rebase upstream/main
git push -u origin ada/<island-id>
```

On GitHub, open a pull request against the `main` branch of `beriltatli/lumiere-satosu`. In the PR description, include:

- A short introduction to the island and the list of places to discover
- A summary of the quest, if there is one (how is it completed?)
- At least 2 screenshots (one by day, one at night). Photo mode: **Esc**, then "Fotoğraf modu" (Photo mode), then "PNG"
- The `renderer.info.render` values (calls, triangles) at the busiest spot
- The number of the issue you opened (like `Closes #12`)

## 7. Review

The maintainer explores the island in the game, checks it against the checklist and the [rules](src/islands/ADA_TALIMATI.md#rules-pr-checklist), and asks for changes if needed. If you commit and push changes to the same branch, the PR updates automatically.

## If something is missing from the engine

If the `ctx` API lacks something you need (e.g. island-specific music, archery targets, swimmable water), don't try to change the engine from inside your island. Open a separate issue and explain what you need and why. The engine change is reviewed in its own PR, and your island is then built on top of it.

## Contributions beyond islands

Bug fixes and improvements to Lumière are welcome too. Open an issue first, then send a small PR focused on one thing. For code style, follow the surrounding code: two-space indentation, single quotes, Turkish comments and short variable names.

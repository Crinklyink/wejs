# Highrise & Harvest

A first-person life sim split between a 48th-floor apartment in Eastbank City and Willow Farm. Start with $12,500 in simulated cash. June has left a letter by the bed and a storm-damaged greenhouse at the farm.

**Play online:** [Launch the game](https://raw.githack.com/Crinklyink/wejs/main/index.html). The preview service may ask you to select **Open the page**. For offline play, download `index.html` and open it in a browser. Everything needed to play is embedded in that file.

## Controls

| Action | Control |
| --- | --- |
| Walk, sprint | WASD, hold Shift |
| Look | Click the scene for mouse look, drag, or use arrow keys |
| Use a nearby object | Face it and press E |
| Dashboard | Tab or the Dashboard button |
| Release the mouse or close a dialog | Escape |
| Touch | Left thumb pad to walk, drag the scene to look, tap Use |

The dashboard can guide you to a station automatically. Settings include look sensitivity, field of view, audio and render resolution.

## Two places, one account

- Buy and sell four fictional stocks. Today's wire gives context for sector moves. Limit orders reserve cash or shares and can fill while you're at the farm. The portfolio includes open orders, holdings and cost basis.
- Sleep in the apartment to wake at Willow Farm. Plant, water and sell carrots, tomatoes and corn. The forecast changes growing times and what the co-op pays. Use the barn to return for the next trading day.
- Visit June's potting bench to restore the greenhouse. Repairs draw on your account and require hands-on farm experience. New glazing, working irrigation and heirloom planting each change the model. The irrigation cuts growing times, and the completed stand pays daily income.
- Read June's letters, make a cup of coffee or put on **Blue Sugar Tin**, an original 16-bar record. Walk away from the turntable and its sound fades into the room.
- Progress saves in the current browser, including crops, orders, work on the greenhouse and your position.

## Rendering and development

The apartment, distant towers, street traffic, barn, greenhouse, foliage and hand tools are 3D meshes. The renderer calculates wood grain, metal, fabric, soil, clouds and sunlight in shaders. It uses a separate depth range for the distant city, shadow mapping, and planar reflections in the apartment windows and floor. The game includes no external image files, skybox photographs or network-loaded assets.

Run `node build.mjs` after editing the source. It rebuilds the standalone `index.html` and the static hosting copy in `dist/`. No package installation is required. WebGL supplies the full lighting and effects. A software renderer supports devices with hardware acceleration disabled.


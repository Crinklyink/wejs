# Highrise & Harvest

A playable 3D life sim in a skyscraper penthouse and a working farm. Download **index.html** and open it in a modern browser to play offline. All game code and models are inside the file. Graphics use WebGL with a software renderer for devices without hardware acceleration.

## How to play

- Walk with WASD or the arrow keys, or click a clear spot on the floor. Drag the scene to orbit and scroll to zoom.
- Use the trading desk to buy and sell simulated stocks. Portfolio shows shares, cost basis and account value.
- Interact with your bed to sleep and wake up on the farm. Plant an available seed, water the plot, and harvest the ripe crop for cash.
- Return through the barn to begin another trading day. Your portfolio, farm plots, and journal are saved in your browser.

All prices, companies and in-game currency are fictional. No account or external price feed is required.

## Development

Edit the JavaScript scenes, game logic, CSS or HTML shell, then run `node build.mjs` to rebuild the standalone game. No package installation is needed. The same build also writes the static hosting output to `dist/`.


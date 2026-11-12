# Infinity Player

<p align="center">
  <img src="assets/infinity-player-logo.svg" alt="Infinity Player logo" width="180">
</p>

<h1 align="center">Infinity Player</h1>
<p align="center"><strong>Version 1.0 · Web-based audio & video player</strong></p>
<p align="center">
  <a href="https://avinashnewdev.github.io/Infinity-Player/"><strong>▶ Open Live Demo</strong></a>
  ·
  <a href="https://github.com/avinashnewdev/Infinity-Player"><strong>View Source Code</strong></a>
</p>

Infinity Player is a browser-based media player built as a single-page HTML application. It brings audio and video libraries, playlists, playback controls and a customizable glass-style interface together in one place.

> **Copyright notice:** © 2026 Avinash Jadhav. All rights reserved. This repository is public for viewing and demonstration. No permission is granted to copy, modify, redistribute, rebrand, sublicense, or use the project commercially without the copyright owner's prior written permission, except for rights that GitHub's Terms of Service expressly grant. See [LICENSE](LICENSE).

## Quick start

1. Open the **[Live Demo](https://avinashnewdev.github.io/Infinity-Player/)**.
2. Add or choose media using the player’s library controls.
3. Select a track or video and use the playback bar for play/pause, seeking, volume and track navigation.
4. Open **Settings** to explore appearance and playback options.

For local use, download `index.html` from this repository and open it in a modern browser. Some browser features and media formats may behave differently depending on the browser and operating system.

## What is included in v1.0

The following features are present in the current HTML project:

- **Audio and video library** with separate library views.
- **Search** and media browsing.
- **Playlists** with drag-and-drop ordering and playlist management.
- **Playback controls** including play/pause, previous/next, seeking and volume.
- **Audio options** such as track selection, speed controls and equalizer presets/custom EQ.
- **Video options** including subtitles/captions, audio-track selection, picture-in-picture controls where supported, and fit/fill/stretch modes.
- **Zoom and edge stretch controls** with fine-grained adjustment controls.
- **Now Playing** view, mini-player and fullscreen-oriented playback interface.
- **Appearance settings** including light/dark theme, accent colours, glass effects and background customization.
- **Profiles and favourites**, plus recent media and sleep timer controls.
- **Hindi-first interface strings** and multilingual font support in the page styling.

> **Media compatibility note:** actual codec support is provided by the browser's media engine. Not every codec or container is guaranteed to play in every browser. Try a current version of Chrome, Edge or Firefox for the best compatibility.

## Roadmap — planned improvements

These are ideas for future releases, not promises that they are already available in v1.0:

- Native Windows desktop app (EXE) with OS-level media integration.
- Android APK and iOS app builds.
- Broader codec support through a suitable native playback engine.
- Improved accessibility, keyboard shortcuts and localization coverage.
- More automated playback, device and browser compatibility testing.
- Optional installer, update mechanism and release packages.

## Project structure

```
Infinity-Player/
├── .github/workflows/deploy-pages.yml   # GitHub Pages deployment
├── assets/
│   └── infinity-player-logo.svg         # Project logo
├── index.html                           # Main player application
├── LICENSE                              # Proprietary all-rights-reserved notice
└── README.md                            # Project guide
```

## Technology

- HTML5, CSS and JavaScript
- Browser media playback APIs
- Local browser storage for supported preferences and profile data
- GitHub Pages for the public demo

## Version

**Current documented version: 1.0**

This version label identifies the first public project release. It does not mean that every planned roadmap item is implemented or that every media codec is supported.

## Copyright and permissions

**© 2026 Avinash Jadhav. All rights reserved.**

This is proprietary, closed-permission software. Unless you have prior written permission from the copyright owner, you may not copy, adapt, modify, translate, rebrand, publish, redistribute, sublicense, sell, commercially exploit, or create derivative works from this project or its source code. Do not remove or alter copyright, author, or attribution notices.

The repository being public does **not** place the code in the public domain and does **not** grant an open-source license. Access through GitHub remains subject to [GitHub's Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service); those platform terms may permit viewing and forking public repositories on GitHub. This notice does not override rights expressly granted by those terms or applicable law.

For permission or commercial licensing, contact the copyright owner through the GitHub profile: [avinashnewdev](https://github.com/avinashnewdev). No permission is granted merely by requesting it; wait for written approval.

**Important:** A license notice cannot technically prevent people from viewing or copying code from a public repository. It states the legal permissions you are (and are not) granting. If you need to keep source code confidential, use a private repository and do not publish the source in the public website bundle.

## Author

**Avinash Jadhav**

## Links

- **Live Demo:** https://avinashnewdev.github.io/Infinity-Player/
- **Repository:** https://github.com/avinashnewdev/Infinity-Player
- **Deployment status:** https://github.com/avinashnewdev/Infinity-Player/actions

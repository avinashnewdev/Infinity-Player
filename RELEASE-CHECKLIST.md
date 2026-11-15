# Infinity Player — Release checklist

## Before publishing
- [ ] Confirm the intended version number.
- [ ] Test the live GitHub Pages build in current Chrome and Edge.
- [ ] Test local audio and video import, playback, seek and volume.
- [ ] Test M3U import from file and from a CORS-enabled URL.
- [ ] Test Online → Now Playing → Next/Previous → Recent.
- [ ] Test PWA installation on at least one desktop and one mobile browser.
- [ ] Verify the README preview illustration is clearly labelled as illustrative.
- [ ] Confirm no native EXE/APK/iOS installer is advertised unless separately built and tested.

## Publish
1. Merge the marketing/docs and release workflow changes into \`main\`.
2. Open GitHub → Actions → **Publish Infinity Player Release** → Run workflow.
3. Enter the version (for example \`1.1.0\`) and choose whether it is a pre-release.
4. Wait for the workflow to complete, then open the repository's Releases page.
5. Check that the web ZIP is attached and the release notes are accurate.

## Not yet automated
- Capturing genuine application screenshots requires running the app in a browser and capturing its actual rendered UI. The committed SVG is an explicitly labelled product-preview illustration, not a screenshot.
- Native desktop/mobile builds require separate platform packaging and device testing.

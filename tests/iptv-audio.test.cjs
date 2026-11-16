'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadIptvAudio() {
  const window = {};
  vm.runInNewContext(fs.readFileSync('js/vlc/iptv-audio.js', 'utf8'), { window });
  return window.InfinityIPTVAudio;
}

test('HLS audio tracks are listed and selection is verified', () => {
  const api = loadIptvAudio();
  const hls = { audioTracks: [{ name: 'English' }, { name: 'Hindi' }], audioTrack: 0 };
  api.bind(hls, null);
  assert.equal(api.audioTracks()[1].name, 'Hindi');
  assert.equal(api.selectAudio(null, 1), true);
  assert.equal(hls.audioTrack, 1);
  assert.equal(api.selectAudio(null, 9), false);
  assert.equal(api.selectAudio(null, 'not-a-number'), false);
});

test('native audio tracks enable exactly the selected track', () => {
  const api = loadIptvAudio();
  const element = { audioTracks: [{ enabled: true }, { enabled: false }, { enabled: false }] };
  api.bind(null, element);
  assert.equal(api.nativeAudioTracks().length, 3);
  assert.equal(api.selectNativeAudio(element, 2), true);
  assert.deepEqual(element.audioTracks.map(track => track.enabled), [false, false, true]);
  assert.equal(api.selectNativeAudio(element, 3), false);
});

test('subtitle selection supports off (-1) and rejects invalid indexes', () => {
  const api = loadIptvAudio();
  const hls = { subtitleTracks: [{ name: 'English' }], subtitleTrack: 0 };
  api.bind(hls, null);
  assert.equal(api.selectSubtitle(null, -1), true);
  assert.equal(hls.subtitleTrack, -1);
  assert.equal(api.selectSubtitle(null, 0), true);
  assert.equal(api.selectSubtitle(null, 2), false);
});

test('track binding removes old listeners and clear resets the adapter', () => {
  const api = loadIptvAudio();
  const listeners = new Map();
  const list = {
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type, fn) { if (listeners.get(type) === fn) listeners.delete(type); }
  };
  const element = { audioTracks: list };
  let updates = 0;
  api.bind(null, element, () => updates++);
  assert.equal(listeners.size, 3);
  listeners.get('change')();
  assert.equal(updates, 1);
  api.clear();
  assert.equal(listeners.size, 0);
  assert.deepEqual(api.audioTracks(), []);
});

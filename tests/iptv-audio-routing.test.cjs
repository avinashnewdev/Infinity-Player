'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function makeHarness() {
  const html = fs.readFileSync('index.html', 'utf8');
  const match = html.match(/function setRemoteAudioBypass\(enabled\)\s*\{[\s\S]*?\n\}/);
  assert.ok(match, 'IPTV audio route function exists');
  const calls = [];
  const src = {
    disconnect() { calls.push(['disconnect']); },
    connect(node) { calls.push(['connect', node.name]); }
  };
  const ctx = { destination: { name: 'destination' } };
  const inNorm = { name: 'normalizer' };
  const sandbox = {
    src, ctx, inNorm, remoteAudioBypass: false,
    ensureAudioCtx() { calls.push(['resume']); return Promise.resolve(true); }
  };
  vm.runInNewContext(match[0] + '\nthis.route = setRemoteAudioBypass;', sandbox);
  return { route: sandbox.route, calls, sandbox };
}

test('IPTV bypass reasserts the direct output even when already enabled', () => {
  const h = makeHarness();
  assert.equal(h.route(true), true);
  assert.equal(h.route(true), true);
  const destinations = h.calls.filter(x => x[0] === 'connect').map(x => x[1]);
  assert.deepEqual(destinations, ['destination', 'destination']);
  assert.equal(h.sandbox.remoteAudioBypass, true);
});

test('leaving IPTV bypass reconnects the normal DSP path', () => {
  const h = makeHarness();
  h.route(true);
  assert.equal(h.route(false), true);
  const destinations = h.calls.filter(x => x[0] === 'connect').map(x => x[1]);
  assert.deepEqual(destinations, ['destination', 'normalizer']);
  assert.equal(h.sandbox.remoteAudioBypass, false);
});

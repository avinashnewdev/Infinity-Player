'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('fullscreen overlay releases hidden glass/compositing effects after idle timeout', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /#ov\.hide\{[^}]*visibility:hidden/);
  assert.match(html, /#ov\.hide\{[^}]*transition:opacity \.25s,visibility 0s linear \.25s/);
  assert.match(html, /#art #ov\.hide \*\{[^}]*-webkit-backdrop-filter:none!important/);
  assert.match(html, /#art #ov\.hide \*\{[^}]*animation:none!important/);
  assert.match(html, /#art #ov\.hide \*\{[^}]*transition:none!important/);
  assert.match(html, /#art #ov\.hide \*\{[^}]*backdrop-filter:none!important/);
});

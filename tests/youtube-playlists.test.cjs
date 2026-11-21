const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('js/vlc/youtube-playlists.js','utf8');
function api(){const context={window:{},location:{origin:'https://infinity-player.example'},URL};vm.createContext(context);vm.runInContext(source,context);return context.window.VLCYouTubePlaylist}
test('watch URL with playlist and selected video keeps both IDs and index',()=>{const p=api().parseURL('https://www.youtube.com/watch?v=abcdefghijk&list=PL1234567890&index=4');assert.equal(p.type,'playlist');assert.equal(p.id,'PL1234567890');assert.equal(p.videoId,'abcdefghijk');assert.equal(p.startIndex,3)});
test('playlist-only and YouTube Music playlist URLs parse',()=>{const a=api();assert.equal(a.extractPlaylistId('https://youtube.com/playlist?list=PL1234567890'),'PL1234567890');assert.equal(a.parseURL('https://music.youtube.com/playlist?list=PL1234567890').type,'playlist')});
test('shorts, embed, live and youtu.be video links parse',()=>{const a=api();for(const url of ['https://youtube.com/shorts/abcdefghijk','https://youtube.com/embed/abcdefghijk','https://youtube.com/live/abcdefghijk','https://youtu.be/abcdefghijk']){const p=a.parseURL(url);assert.equal(p.type,'video');assert.equal(p.id,'abcdefghijk')}});
test('invalid hosts, schemes and IDs are rejected',()=>{const a=api();assert.equal(a.parseURL('https://notyoutube.com/watch?v=abcdefghijk'),null);assert.equal(a.parseURL('javascript:alert(1)'),null);assert.equal(a.parseURL('https://youtube.com/watch?v=bad'),null)});
test('embed builder keeps valid playlist and origin',()=>{const url=api().buildEmbedUrl('PL1234567890','nocookie',25);assert.match(url,/youtube-nocookie\.com\/embed\/videoseries/);assert.match(url,/start=25/);assert.match(url,/origin=https%3A%2F%2Finfinity-player\.example/);assert.throws(()=>api().buildEmbedUrl('bad','default',0))});
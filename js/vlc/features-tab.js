/* Infinity Player — isolated Online tab. Keeps network media separate from the core queue. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const KEY='infinity.vlc.network.playlists.v1';
 let entries=[];
 let installPrompt=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))entries=saved.slice(0,10000)}catch(_){}
 const safeUrl=v=>{try{const u=new URL(String(v).trim());return ['http:','https:'].includes(u.protocol)?u.href:null}catch(_){return null}};
 const status=(s,bad=false)=>{const e=$('vlcf-status');if(e){e.textContent=s;e.style.color=bad?'#e58b78':''}};
 function parseM3U(text){
  if(text.length>8*1024*1024)throw Error('Playlist exceeds 8 MB.');
  if(/^#EXT-X-(TARGETDURATION|STREAM-INF|MEDIA-SEQUENCE|ENDLIST)/mi.test(text))throw Error('This is an HLS media manifest, not an M3U channel list.');
  const out=[];let meta={};
  for(const raw of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
   const line=raw.trim();if(!line)continue;
   if(line.startsWith('#EXTINF:')){
    const comma=line.indexOf(',');const attrs=comma<0?line.slice(8):line.slice(8,comma);
    const name=comma<0?'Untitled channel':line.slice(comma+1).trim();
    const get=k=>{const m=attrs.match(new RegExp('(?:^|\\s)'+k+'="([^"]*)"','i'));return m?m[1]:''};
    meta={name:name||'Untitled channel',group:get('group-title'),logo:get('tvg-logo')};
   }else if(line.startsWith('#EXTGRP:'))meta.group=line.slice(8).trim();
   else if(!line.startsWith('#')){const url=safeUrl(line);if(url)out.push({...meta,url});meta={};if(out.length>=10000)break}
  }
  if(!out.length)throw Error('No valid HTTP(S) streams found.');return out;
 }
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(entries))}catch(_){status('Storage is full or unavailable; export a backup.',true)}}
 function render(){
  const q=($('vlcf-search')?.value||'').toLowerCase();
  const list=$('vlcf-list');if(!list)return;
  const filtered=entries.map((x,i)=>({...x,i})).filter(x=>(x.name+' '+(x.group||'')).toLowerCase().includes(q));
  list.innerHTML=filtered.length?filtered.map(x=>'<div class="vlcf-item"><span title="'+esc(x.name)+'">'+esc(x.name)+'</span><small>'+esc(x.group||'Stream')+'</small><button class="vlcf-btn secondary" data-vlcf-play="'+x.i+'">Play</button><button class="vlcf-btn secondary" data-vlcf-download="'+x.i+'">Download</button></div>').join(''):'<p class="vlcf-status">No channels yet. Import an M3U playlist to begin.</p>';
 }
 async function addFile(file){const parsed=parseM3U(await file.text());entries=parsed;persist();render();status('Imported '+entries.length+' channels from '+file.name+'.')}
 async function addUrl(){const url=safeUrl($('vlcf-url').value);if(!url)return status('Enter a valid HTTP(S) URL.',true);const b=$('vlcf-fetch');b.disabled=true;status('Fetching playlist…');try{const r=await fetch(url,{credentials:'omit',redirect:'follow',signal:AbortSignal.timeout?AbortSignal.timeout(15000):undefined});if(!r.ok)throw Error('HTTP '+r.status);entries=parseM3U(await r.text());persist();render();status('Imported '+entries.length+' channels.')}catch(e){status('Import failed: '+e.message+'. The host must allow CORS; download the file and import it instead.',true)}finally{b.disabled=false}}
 function play(index){const item=entries[index],media=$('vlcf-media');if(!item||!media)return;media.onended=()=>{if(index+1<entries.length)play(index+1)};media.src=item.url;media.classList.add('visible');media.load();media.play().catch(()=>status('Stream loaded. Press Play if autoplay is blocked.'));status('Playing '+(index+1)+' of '+entries.length+': '+item.name)}
 function exportM3U(){if(!entries.length)return status('No playlist to export.',true);const lines=['#EXTM3U'];entries.forEach(x=>{lines.push('#EXTINF:-1 group-title="'+String(x.group||'').replace(/["\r\n]/g,'')+'",'+String(x.name||'Channel').replace(/[\r\n]/g,' '));lines.push(x.url)});const a=document.createElement('a'),u=URL.createObjectURL(new Blob([lines.join('\n')],{type:'audio/x-mpegurl'}));a.href=u;a.download='infinity-network-playlist.m3u';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);status('Playlist exported.')}
 function checkCodec(){const state=$('vlcf-codec-state'),title=$('vlcf-codec-title'),detail=$('vlcf-codec-detail');if(!window.VLCCodecCompat){title.textContent='Codec checker unavailable';return}const r=window.VLCCodecCompat.inspect();state.className='vlcf-dot '+(r.supported?'good':'bad');title.textContent=r.supported?'HEVC / H.265 reported supported':'HEVC / H.265 not reported';detail.textContent=window.VLCCodecCompat.explain()+' Probe results: '+r.results.map(x=>x.support).join(', ')+'.'}
 function checkEngine(){const state=$('vlcf-engine-state'),title=$('vlcf-engine-title'),detail=$('vlcf-engine-detail');const r=window.VLCOfflineCodecEngine?.getStatus();if(!r){title.textContent='Adapter unavailable';return}state.className='vlcf-dot '+(r.available?'good':'bad');title.textContent=r.available?'Native engine connected': 'Browser-only playback';detail.textContent=r.available?(r.name+' · '+(r.codecs||[]).join(', ')):r.note}
 function openYT(){const raw=$('vlcf-yt-url').value,id=window.VLCYouTubePlaylist?.extractPlaylistId(raw);if(!id){$('vlcf-yt-status').textContent='Valid YouTube playlist URL nahi mila.';return}const frame=$('vlcf-yt-frame');frame.innerHTML='<iframe title="YouTube playlist" src="'+esc(window.VLCYouTubePlaylist.buildEmbedUrl(id,'youtube',0))+'" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';$('vlcf-yt-status').textContent='Official YouTube playlist embed loaded.'}
 function init(){
  const nav=$('snav');if(nav&&!nav.querySelector('[data-v="vlc"]')){const b=document.createElement('button');b.type='button';b.dataset.v='vlc';b.innerHTML='<span aria-hidden="true">◈</span><span>Online</span>';b.addEventListener('click',()=>window.show?.('vlc'));nav.appendChild(b)}
  $('vlcf-files')?.addEventListener('change',async e=>{for(const f of e.target.files){try{await addFile(f)}catch(err){status(err.message,true)}}e.target.value=''});
  $('vlcf-export')?.addEventListener('click',exportM3U);$('vlcf-play-all')?.addEventListener('click',()=>play(0));$('vlcf-fetch')?.addEventListener('click',addUrl);$('vlcf-search')?.addEventListener('input',render);
  $('vlcf-list')?.addEventListener('click',e=>{const p=e.target.closest('[data-vlcf-play]');if(p)play(Number(p.dataset.vlcfPlay))});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;const s=$('vlcf-install-status');if(s)s.textContent='App is ready to install on this device.'});
  $('vlcf-install-app')?.addEventListener('click',async()=>{const s=$('vlcf-install-status');if(installPrompt){installPrompt.prompt();const choice=await installPrompt.userChoice;s.textContent=choice.outcome==='accepted'?'Infinity Player installation started.':'Installation was dismissed.';installPrompt=null;return}if(window.matchMedia('(display-mode: standalone)').matches){s.textContent='Infinity Player is already installed on this device.';return}s.textContent=/iphone|ipad|ipod/i.test(navigator.userAgent)?'Safari: tap Share, then Add to Home Screen.':'Chrome / Edge: open the browser menu (⋮) and choose Install app or Install this site as an app. If the option is missing, this browser/device does not currently offer PWA installation.'});
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){navigator.serviceWorker.register('./service-worker.js').catch(()=>{});}
  $('vlcf-yt-open')?.addEventListener('click',openYT);$('vlcf-codec-refresh')?.addEventListener('click',checkCodec);
  render();checkCodec();checkEngine();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

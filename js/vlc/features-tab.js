/* Infinity Player — Online playlists with automatic media detection. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const KEY='infinity.vlc.network.playlists.v1';
 let entries=[],installPrompt=null;
 try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(saved))entries=saved.slice(0,10000)}catch(_){}
 const safeUrl=(v,base)=>{try{const u=new URL(String(v).trim(),base||location.href);return ['http:','https:'].includes(u.protocol)?u.href:null}catch(_){return null}};
 const status=(s,bad=false)=>{const e=$('vlcf-status');if(e){e.textContent=s;e.style.color=bad?'#e58b78':''}};
 const isHls=s=>/^#EXTM3U[\s\S]*#EXT-X-(?:STREAM-INF|TARGETDURATION|MEDIA-SEQUENCE|PLAYLIST-TYPE|ENDLIST)/mi.test(s);
 function parseM3U(text,baseUrl,localName){
  if(text.length>8*1024*1024)throw Error('Playlist exceeds 8 MB.');
  text=text.replace(/^\uFEFF/,'');
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(isHls(text)){
   const variants=[];let pending=null;
   for(const line of lines){
    if(line.startsWith('#EXT-X-STREAM-INF:')){pending=line.slice(18);continue}
    if(pending&&!line.startsWith('#')){if(!baseUrl&&!/^https?:\\/\\//i.test(line))throw Error('Local HLS master playlist uses relative variants. Import its hosted .m3u8 URL instead.');const url=safeUrl(line,baseUrl);if(url){const bw=+(pending.match(/BANDWIDTH=(\d+)/i)||[])[1]||0;variants.push({name:'HLS Video'+(bw?' · '+Math.round(bw/1000)+' kbps':''),group:'HLS video',url,video:true,hls:true,kind:'video',bandwidth:bw})}pending=null}
   }
   if(variants.length)return variants.sort((a,b)=>b.bandwidth-a.bandwidth);
   const media=/#EXTINF:/i.test(text)||/#EXT-X-TARGETDURATION:/i.test(text);
   if(media){const url=baseUrl||null;if(!url)throw Error('Local HLS file uses relative segments. Import its hosted .m3u8 URL instead.');return [{name:localName||'HLS stream',group:'HLS video',url,video:true,hls:true,kind:'video'}]}
   throw Error('HLS manifest mein playable stream nahi mila.');
  }
  const out=[];let meta={};
  for(const line of lines){
   if(line.startsWith('#EXTINF:')){
    const comma=line.indexOf(',');const attrs=comma<0?line.slice(8):line.slice(8,comma);
    const name=comma<0?'Untitled channel':line.slice(comma+1).trim();
    const get=k=>{const m=attrs.match(new RegExp('(?:^|[ ,])'+k+'="([^"]*)"','i'));return m?m[1]:''};
    meta={name:name||'Untitled channel',group:get('group-title'),logo:get('tvg-logo')};
   }else if(line.startsWith('#EXTGRP:'))meta.group=line.slice(8).trim();
   else if(!line.startsWith('#')){const url=safeUrl(line,baseUrl);if(url)out.push({...meta,url});meta={};if(out.length>=10000)break}
  }
  if(!out.length)throw Error('No valid HTTP(S) media links found.');return out;
 }
 async function detectMedia(item){
  if(item.hls||/\.m3u8(?:$|[?#])/i.test(item.url))return {...item,video:true,hls:true,kind:'video'};
  const ext=(item.url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)||[])[1]?.toLowerCase();
  const audioExt=/^(mp3|m4a|aac|ogg|oga|opus|flac|wav|wma|aiff)$/i.test(ext||'');
  const videoExt=/^(mp4|m4v|webm|mkv|mov|avi|ts|mpeg|mpg|3gp)$/i.test(ext||'');
  if(audioExt||videoExt)return {...item,video:videoExt,kind:videoExt?'video':'audio'};
  try{
   const ctl=AbortSignal.timeout?AbortSignal.timeout(7000):undefined;
   let r=await fetch(item.url,{method:'HEAD',mode:'cors',credentials:'omit',redirect:'follow',signal:ctl});
   let type=(r.headers.get('content-type')||'').toLowerCase();
   if(!type||type==='application/octet-stream'){
    r=await fetch(item.url,{method:'GET',mode:'cors',credentials:'omit',headers:{Range:'bytes=0-0'},redirect:'follow',signal:ctl});
    type=(r.headers.get('content-type')||'').toLowerCase();
   }
   if(type.startsWith('audio/'))return {...item,video:false,kind:'audio'};
   if(type.startsWith('video/')||/mpegurl|x-mpegurl/.test(type))return {...item,video:true,hls:/mpegurl/.test(type),kind:'video'};
   if(/json|html|text\//.test(type))return {...item,video:true,kind:'video'};
  }catch(_){}
  // Last-resort automatic mode: the core player checks videoWidth after metadata loads.
  return {...item,video:!!item.video,kind:item.kind||'auto'};
 }
 async function classify(list){let at=0;const out=new Array(list.length);await Promise.all(Array.from({length:Math.min(5,list.length)},async()=>{while(at<list.length){const n=at++;out[n]=await detectMedia(list[n])}}));return out}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(entries))}catch(_){status('Storage is full or unavailable; export a backup.',true)}}
 function render(){const q=($('vlcf-search')?.value||'').toLowerCase(),list=$('vlcf-list');if(!list)return;const filtered=entries.map((x,i)=>({...x,i})).filter(x=>(x.name+' '+(x.group||'')).toLowerCase().includes(q));list.innerHTML=filtered.length?filtered.map(x=>'<div class="vlcf-item"><span title="'+esc(x.name)+'">'+esc(x.name)+'</span><small>'+esc(x.group||(x.kind==='video'?'Video':x.kind==='audio'?'Audio':'Auto detect'))+'</small><button class="vlcf-btn secondary" data-vlcf-play="'+x.i+'">Play</button></div>').join(''):'<p class="vlcf-status">No channels yet. Import an M3U / M3U8 playlist to begin.</p>'}
 async function addFile(file){const raw=await file.text(),base=/^#EXT-X-/mi.test(raw)?null:null;const parsed=parseM3U(raw,base,file.name.replace(/\.(m3u8?|txt)$/i,''));entries=await classify(parsed);persist();render();status('Imported '+entries.length+' entries from '+file.name+'. Media type will be checked automatically when played.')}
 async function addUrl(){const url=safeUrl($('vlcf-url').value);if(!url)return status('Enter a valid HTTP(S) URL.',true);const b=$('vlcf-fetch');b.disabled=true;status('Fetching playlist / HLS manifest…');try{const r=await fetch(url,{credentials:'omit',redirect:'follow',signal:AbortSignal.timeout?AbortSignal.timeout(15000):undefined});if(!r.ok)throw Error('HTTP '+r.status);const raw=await r.text();entries=await classify(parseM3U(raw,r.url||url));persist();render();status('Imported '+entries.length+' media entries. Video/audio type detected automatically.')}catch(e){status('Import failed: '+e.message+'. Cross-origin host must allow CORS; download the playlist file and import it instead.',true)}finally{b.disabled=false}}
 function play(index){const item=entries[index];if(!item)return;const bridge=window.InfinityOnlineBridge;if(!bridge){status('Core player is still loading. Try again.',true);return}try{bridge.playPlaylist(entries.map(x=>({url:x.url,title:x.name,artist:x.group||'Online playlist',video:x.video,hls:!!x.hls,kind:x.kind})),index);status('Playing '+(index+1)+' of '+entries.length+' in the main player. Use Now Playing controls.');window.show?.('player')}catch(e){status(e.message||'Unable to start playlist.',true)}}
 function exportM3U(){if(!entries.length)return status('No playlist to export.',true);const lines=['#EXTM3U'];entries.forEach(x=>{lines.push('#EXTINF:-1 group-title="'+String(x.group||'').replace(/["\r\n]/g,'')+'",'+String(x.name||'Channel').replace(/[\r\n]/g,' '));lines.push(x.url)});const a=document.createElement('a'),u=URL.createObjectURL(new Blob([lines.join('\n')],{type:'audio/x-mpegurl'}));a.href=u;a.download='infinity-network-playlist.m3u';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);status('Playlist exported.')}
 function checkCodec(){const state=$('vlcf-codec-state'),title=$('vlcf-codec-title'),detail=$('vlcf-codec-detail');if(!window.VLCCodecCompat){title.textContent='Codec checker unavailable';return}const r=window.VLCCodecCompat.inspect();state.className='vlcf-dot '+(r.supported?'good':'bad');title.textContent=r.supported?'HEVC / H.265 reported supported':'HEVC / H.265 not reported';detail.textContent=window.VLCCodecCompat.explain()+' Probe results: '+r.results.map(x=>x.support).join(', ')+'.'}
 function checkEngine(){const state=$('vlcf-engine-state'),title=$('vlcf-engine-title'),detail=$('vlcf-engine-detail');const r=window.VLCOfflineCodecEngine?.getStatus();if(!r){title.textContent='Adapter unavailable';return}state.className='vlcf-dot '+(r.available?'good':'bad');title.textContent=r.available?'Native engine connected':'Browser-only playback';detail.textContent=r.available?(r.name+' · '+(r.codecs||[]).join(', ')):r.note}
 function openYT(){const raw=$('vlcf-yt-url').value,id=window.VLCYouTubePlaylist?.extractPlaylistId(raw);if(!id){$('vlcf-yt-status').textContent='Valid YouTube playlist URL nahi mila.';return}const bridge=window.InfinityOnlineBridge;if(!bridge?.playYouTubePlaylist){$('vlcf-yt-status').textContent='Main player integration is unavailable. Reload the app and try again.';return}try{bridge.playYouTubePlaylist(id);window.show?.('player');$('vlcf-yt-status').textContent='YouTube playlist main player mein load ho rahi hai. Main controls use karein.'}catch(e){$('vlcf-yt-status').textContent=e.message||'YouTube playlist load nahi hui.'}}
 function init(){const nav=$('snav');if(nav&&!nav.querySelector('[data-v="vlc"]')){const b=document.createElement('button');b.type='button';b.dataset.v='vlc';b.innerHTML='<span aria-hidden="true">◈</span><span>Online</span>';b.addEventListener('click',()=>window.show?.('vlc'));nav.appendChild(b)}
  $('vlcf-files')?.addEventListener('change',async e=>{for(const f of e.target.files){try{await addFile(f)}catch(err){status(err.message,true)}}e.target.value=''});
  $('vlcf-export')?.addEventListener('click',exportM3U);$('vlcf-play-all')?.addEventListener('click',()=>play(0));$('vlcf-fetch')?.addEventListener('click',addUrl);$('vlcf-search')?.addEventListener('input',render);$('vlcf-list')?.addEventListener('click',e=>{const p=e.target.closest('[data-vlcf-play]');if(p)play(Number(p.dataset.vlcfPlay))});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;const s=$('vlcf-install-status');if(s)s.textContent='App is ready to install on this device.'});
  $('vlcf-install-app')?.addEventListener('click',async()=>{const s=$('vlcf-install-status');if(installPrompt){installPrompt.prompt();const choice=await installPrompt.userChoice;s.textContent=choice.outcome==='accepted'?'Infinity Player installation started.':'Installation was dismissed.';installPrompt=null;return}if(window.matchMedia('(display-mode: standalone)').matches){s.textContent='Infinity Player is already installed on this device.';return}s.textContent=/iphone|ipad|ipod/i.test(navigator.userAgent)?'Safari: tap Share, then Add to Home Screen.':'Chrome / Edge: open the browser menu (⋮) and choose Install app or Install this site as an app.'});
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  $('vlcf-yt-open')?.addEventListener('click',openYT);$('vlcf-codec-refresh')?.addEventListener('click',checkCodec);render();checkCodec();checkEngine()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
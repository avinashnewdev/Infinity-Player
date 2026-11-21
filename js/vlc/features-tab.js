/* Infinity Player — separate IPTV and Online Video tabs. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const KEY='infinity.iptv.playlists.v2',YTKEY='infinity.youtube.saved.v1';
 let playlists=[],ytItems=[],selectedPlaylist=0,installPrompt=null;
 try{const old=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(old))playlists=old}catch(_){}
 try{if(!playlists.length){const legacy=JSON.parse(localStorage.getItem('infinity.vlc.network.playlists.v1')||'[]');if(Array.isArray(legacy)&&legacy.length)playlists=[{id:'iptv_legacy',name:'Imported M3U Playlist',entries:legacy}]}}catch(_){}
 try{const old=JSON.parse(localStorage.getItem(YTKEY)||'[]');if(Array.isArray(old))ytItems=old}catch(_){}
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=(v,base)=>{try{const u=new URL(String(v).trim(),base||location.href);return ['http:','https:'].includes(u.protocol)?u.href:null}catch(_){return null}};
 const status=(s,bad=false)=>{const e=$('vlcf-status');if(e){e.textContent=s;e.style.color=bad?'#e58b78':''}};
 const isHls=s=>/^#EXTM3U[\s\S]*#EXT-X-(?:STREAM-INF|TARGETDURATION|MEDIA-SEQUENCE|PLAYLIST-TYPE|ENDLIST)/mi.test(s);
 function parseM3U(text,baseUrl,localName){
  if(text.length>8*1024*1024)throw Error('Playlist exceeds 8 MB.');
  text=text.replace(/^\uFEFF/,'');
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(isHls(text)){
   // Keep the original master manifest so HLS.js can discover alternate audio/subtitle renditions.
   if(baseUrl)return [{name:localName||'HLS Live TV',group:'HLS video',url:baseUrl,video:true,hls:true,kind:'video'}];
   const variants=[];let pending=null;
   for(const line of lines){if(line.startsWith('#EXT-X-STREAM-INF:')){pending=line.slice(18);continue}
    if(pending&&!line.startsWith('#')){if(!baseUrl&&!/^https?:\/\//i.test(line))throw Error('Local HLS master uses relative variants. Import its hosted .m3u8 URL.');const url=safeUrl(line,baseUrl);if(url){const bw=+(pending.match(/BANDWIDTH=(\d+)/i)||[])[1]||0;variants.push({name:'HLS Video'+(bw?' · '+Math.round(bw/1000)+' kbps':''),group:'HLS video',url,video:true,hls:true,kind:'video',bandwidth:bw})}pending=null}}
   if(variants.length)return variants.sort((a,b)=>b.bandwidth-a.bandwidth);
   if(/#EXTINF:/i.test(text)||/#EXT-X-TARGETDURATION:/i.test(text)){if(!baseUrl)throw Error('Local HLS media playlist needs a hosted manifest URL.');return [{name:localName||'HLS stream',group:'HLS video',url:baseUrl,video:true,hls:true,kind:'video'}]}
   throw Error('HLS manifest mein playable stream nahi mila.');
  }
  const out=[];let meta={};
  for(const line of lines){if(line.startsWith('#EXTINF:')){const comma=line.indexOf(','),attrs=comma<0?line.slice(8):line.slice(8,comma);meta={name:(comma<0?'Untitled channel':line.slice(comma+1).trim())||'Untitled channel',group:(attrs.match(/group-title="([^"]*)"/i)||[])[1]||'',logo:(attrs.match(/tvg-logo="([^"]*)"/i)||[])[1]||''}}
   else if(line.startsWith('#EXTGRP:'))meta.group=line.slice(8).trim();
   else if(!line.startsWith('#')){const url=safeUrl(line,baseUrl);if(url)out.push({...meta,url,kind:/\.(mp3|m4a|aac|ogg|opus|flac|wav)(?:$|[?#])/i.test(url)?'audio':'auto'});meta={};if(out.length>=10000)break}}
  if(!out.length)throw Error('No valid HTTP(S) media links found.');return out;
 }
 async function detectMedia(item){
  if(item.hls||/\.m3u8(?:$|[?#])/i.test(item.url))return {...item,video:true,hls:true,kind:'video'};
  const ext=(item.url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)||[])[1]?.toLowerCase();
  if(/^(mp3|m4a|aac|ogg|oga|opus|flac|wav|wma|aiff)$/i.test(ext||''))return {...item,video:false,kind:'audio'};
  if(/^(mp4|m4v|webm|mkv|mov|avi|ts|mpeg|mpg|3gp)$/i.test(ext||''))return {...item,video:true,kind:'video'};
  try{const ctl=AbortSignal.timeout?AbortSignal.timeout(6500):undefined;const r=await fetch(item.url,{method:'HEAD',mode:'cors',credentials:'omit',redirect:'follow',signal:ctl});const type=(r.headers.get('content-type')||'').toLowerCase();if(type.startsWith('audio/'))return {...item,video:false,kind:'audio'};if(type.startsWith('video/'))return {...item,video:true,kind:'video'}}catch(_){}
  return {...item,video:!!item.video,kind:item.kind||'auto'};
 }
 async function classify(list){let at=0;const out=new Array(list.length);await Promise.all(Array.from({length:Math.min(5,list.length)},async()=>{while(at<list.length){const n=at++;out[n]=await detectMedia(list[n])}}));return out}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(playlists))}catch(_){status('Storage full. Remove a playlist or export a backup.',true)}}
 function persistYT(){try{localStorage.setItem(YTKEY,JSON.stringify(ytItems))}catch(_){$('vlcf-yt-status').textContent='Browser storage is full.'}}
 function render(){
  const q=($('vlcf-search')?.value||'').toLowerCase(),list=$('vlcf-list');if(!list)return;
  list.innerHTML=playlists.length?playlists.map((pl,pi)=>{
   const channels=(pl.entries||[]).map((x,ci)=>({...x,ci})).filter(x=>(x.name+' '+(x.group||'')).toLowerCase().includes(q));
   return '<div class="vlcf-playlist"><div class="vlcf-playlist-head"><b>'+esc(pl.name)+'</b><span class="vlcf-playlist-actions"><button class="vlcf-btn secondary" data-vlcf-playall="'+pi+'">Play all</button><button class="vlcf-btn danger" data-vlcf-remove="'+pi+'">Remove playlist</button></span></div>'+
    (channels.length?channels.map(x=>'<div class="vlcf-item">'+(x.logo?'<img class="vlcf-thumb" src="'+esc(x.logo)+'" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'<span class="vlcf-thumb vlcf-thumb-fallback">▣</span>')+'<span title="'+esc(x.name)+'">'+esc(x.name)+'</span><small>'+esc(x.group||(x.kind==='video'?'Video':x.kind==='audio'?'Audio':'Auto'))+'</small><button class="vlcf-btn secondary" data-vlcf-play="'+pi+':'+x.ci+'">Play</button></div>').join(''):'<p class="vlcf-status">No matching channels.</p>')+'</div>';
  }).join(''):'<p class="vlcf-status">No IPTV playlists saved. Import an M3U / M3U8 file to begin.</p>';
 }
 async function addFile(file){const parsed=parseM3U(await file.text(),null,file.name.replace(/\.(m3u8?|txt)$/i,''));const items=await classify(parsed);playlists.push({id:'iptv_'+Date.now().toString(36),name:file.name.replace(/\.(m3u8?|txt)$/i,''),entries:items});selectedPlaylist=playlists.length-1;persist();render();status('Imported '+items.length+' channels from '+file.name+'.')}
 async function addUrl(){
  const url=safeUrl($('vlcf-url').value);if(!url)return status('Valid HTTP(S) playlist / stream URL paste karein.',true);
  const b=$('vlcf-fetch');if(b.disabled)return;b.disabled=true;status('Checking IPTV URL…');
  try{
   const u=new URL(url),path=u.pathname.toLowerCase(),directHls=/\.m3u8$/i.test(path),directMedia=/\.(mp3|m4a|aac|ogg|opus|flac|wav|mp4|m4v|webm|ts|mpeg|mpg)$/i.test(path);
   let items,directFallback=false;
   if(directHls)items=[{name:decodeURIComponent(path.split('/').pop()||'IPTV Live Channel'),group:'Live HLS',url,video:true,hls:true,kind:'video'}];
   else if(directMedia)items=[await detectMedia({name:decodeURIComponent(path.split('/').pop()||'IPTV Stream'),group:'Direct stream',url,kind:'auto'})];
   else{
    const ctl=AbortSignal.timeout?AbortSignal.timeout(20000):undefined;
    try{
     const r=await fetch(url,{mode:'cors',credentials:'omit',redirect:'follow',cache:'no-store',signal:ctl});
     if(!r.ok)throw Error('HTTP '+r.status);
     const body=await r.text();if(!body.trim())throw Error('Playlist response is empty.');
     items=await classify(parseM3U(body,r.url||url,'IPTV Playlist'));
    }catch(fetchError){
     // Cross-origin media URLs may play in <video> even when fetch/HEAD is blocked by CORS.
     if(/\.(m3u8?|txt)$/i.test(path))throw fetchError;
     directFallback=true;
     items=[await detectMedia({name:decodeURIComponent(path.split('/').pop()||'Online IPTV Stream'),group:'Direct stream',url,kind:'auto'})];
    }
   }
   if(!items.length)throw Error('No channels found in this URL.');
   const name=decodeURIComponent(u.pathname.split('/').pop()||'IPTV URL Playlist').replace(/\.(m3u8?|txt)$/i,'')||'IPTV URL Playlist';
   playlists.push({id:'iptv_'+Date.now().toString(36),name,entries:items});selectedPlaylist=playlists.length-1;persist();render();
   $('vlcf-url').value='';status(directFallback?'URL direct stream ke roop mein add hua. Agar yeh M3U playlist hai, host CORS block kar raha hai—file download karke import karein.':'Imported '+items.length+' IPTV item(s). Select a channel to play.');
  }catch(e){
   const cors=/failed to fetch|networkerror|load failed|cors/i.test(String(e&&e.message));
   status('Import failed: '+(cors?'Playlist host CORS access block kar raha hai. Direct .m3u8 stream URL use karein, ya M3U file download karke import karein.':e.message),true);
  }finally{b.disabled=false}
 }
 function play(pi,ci){const pl=playlists[pi],item=pl&&pl.entries&&pl.entries[ci];if(!item)return;const bridge=window.InfinityOnlineBridge;if(!bridge){status('Player integration unavailable. Reload and try again.',true);return}try{bridge.playPlaylist(pl.entries.map(x=>({url:x.url,title:x.name,artist:x.group||pl.name,video:x.video,hls:!!x.hls,kind:x.kind,art:x.logo||null})),ci);status('Playing '+item.name+' in Now Playing.')}catch(e){status(e.message||'Unable to start IPTV channel.',true)}}
 function removePlaylist(pi){const pl=playlists[pi];if(!pl)return;if(!confirm('Remove IPTV playlist "'+pl.name+'"?'))return;playlists.splice(pi,1);selectedPlaylist=Math.max(0,Math.min(selectedPlaylist,playlists.length-1));persist();render();status('Playlist removed.')}
 function exportM3U(){const pl=playlists[selectedPlaylist];if(!pl)return status('No playlist selected to export.',true);const lines=['#EXTM3U'];(pl.entries||[]).forEach(x=>{lines.push('#EXTINF:-1 group-title="'+String(x.group||'').replace(/["\r\n]/g,'')+'",'+String(x.name||'Channel').replace(/[\r\n]/g,' '));lines.push(x.url)});const a=document.createElement('a'),u=URL.createObjectURL(new Blob([lines.join('\n')],{type:'audio/x-mpegurl'}));a.href=u;a.download=(pl.name||'iptv-playlist')+'.m3u';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);status('Playlist exported.')}
 function parseYouTube(raw){const helper=window.VLCYouTubePlaylist;if(helper&&typeof helper.parseURL==='function')return helper.parseURL(raw);let u;try{u=new URL(String(raw||'').trim())}catch(_){return null}const host=u.hostname.replace(/^www\./,'').toLowerCase();if(!['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)||!['https:','http:'].includes(u.protocol))return null;let video=u.searchParams.get('v');if(host==='youtu.be')video=u.pathname.split('/').filter(Boolean)[0]||video;if(!video){const m=u.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})(?:\/|$)/i);if(m)video=m[1]}if(video&&!/^[A-Za-z0-9_-]{11}$/.test(video))video=null;const list=u.searchParams.get('list');if(list&&/^[A-Za-z0-9_-]{10,80}$/.test(list)){const item={type:'playlist',id:list,url:'https://www.youtube.com/playlist?list='+encodeURIComponent(list)};if(video)item.videoId=video;const index=Number(u.searchParams.get('index'));if(Number.isFinite(index)&&index>=1&&index<=10000)item.startIndex=Math.floor(index)-1;return item}return video?{type:'video',id:video,url:'https://www.youtube.com/watch?v='+encodeURIComponent(video)}:null} function renderYT(){const list=$('vlcf-yt-list');if(!list)return;list.innerHTML=ytItems.length?ytItems.map((x,i)=>{const thumbId=x.videoId||(x.type==='video'?x.id:'');return '<div class="vlcf-item">'+(thumbId?'<img class="vlcf-thumb vlcf-thumb-wide" src="https://i.ytimg.com/vi/'+encodeURIComponent(thumbId)+'/hqdefault.jpg" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'<span class="vlcf-thumb vlcf-thumb-fallback">▶</span>')+'<span title="'+esc(x.url)+'">'+esc(x.title)+'</span><small>'+esc(x.type==='playlist'?'Playlist'+(Number.isInteger(x.startIndex)&&x.startIndex>0?' · Start '+(x.startIndex+1):''):'Video')+'</small><button class="vlcf-btn secondary" data-yt-play="'+i+'">Play</button><button class="vlcf-btn danger" data-yt-remove="'+i+'">Remove</button></div>'}).join(''):'<p class="vlcf-status">No YouTube videos or playlists saved yet.</p>'} function playYT(item,target){const b=window.InfinityOnlineBridge;if(!b)return $('vlcf-yt-status').textContent='Main player integration is unavailable.';const pick=target||item;try{if(item.type==='playlist')b.playYouTubePlaylist(item.id,pick.videoId||item.videoId,Number.isInteger(pick.startIndex)?pick.startIndex:item.startIndex);else b.playYouTubeVideo(item.id);window.show?.('player');$('vlcf-yt-status').textContent='Playing in Now Playing. Use the YouTube player controls for captions and video quality.'}catch(e){$('vlcf-yt-status').textContent=e.message||'Could not play YouTube item.'}} function addYT(){const target=parseYouTube($('vlcf-yt-url').value);if(!target){$('vlcf-yt-status').textContent='Valid YouTube video / playlist URL paste karein.';return}let item=ytItems.find(x=>x.type===target.type&&x.id===target.id);if(!item){item={...target,title:target.type==='playlist'?'YouTube Playlist':'YouTube Video'};ytItems.unshift(item)}else{if(target.videoId)item.videoId=target.videoId;if(Number.isInteger(target.startIndex))item.startIndex=target.startIndex}persistYT();renderYT();$('vlcf-yt-url').value='';playYT(item,target)} function init(){
  const nav=$('snav');
  if(nav){
   nav.querySelector('[data-v="vlc"]')?.remove();
   [['iptv','IPTV','▤'],['online-video','Online Video','▶']].forEach(([v,label,icon])=>{if(nav.querySelector('[data-v="'+v+'"]'))return;const b=document.createElement('button');b.type='button';b.dataset.v=v;b.innerHTML='<span aria-hidden="true">'+icon+'</span><span>'+label+'</span>';b.addEventListener('click',()=>window.show?.(v));nav.appendChild(b)});
  }
  $('vlcf-files')?.addEventListener('change',async e=>{for(const f of e.target.files){try{await addFile(f)}catch(err){status(err.message,true)}}e.target.value=''});
  $('vlcf-export')?.addEventListener('click',exportM3U);$('vlcf-fetch')?.addEventListener('click',addUrl);$('vlcf-search')?.addEventListener('input',render);
  $('vlcf-list')?.addEventListener('click',e=>{const p=e.target.closest('[data-vlcf-play]'),all=e.target.closest('[data-vlcf-playall]'),rm=e.target.closest('[data-vlcf-remove]');if(p){const [pi,ci]=p.dataset.vlcfPlay.split(':').map(Number);selectedPlaylist=pi;play(pi,ci)}else if(all){selectedPlaylist=+all.dataset.vlcfPlay;play(selectedPlaylist,0)}else if(rm)removePlaylist(+rm.dataset.vlcfRemove)});
  $('vlcf-yt-open')?.addEventListener('click',addYT);$('vlcf-yt-url')?.addEventListener('keydown',e=>{if(e.key==='Enter')addYT()});
  $('vlcf-yt-list')?.addEventListener('click',e=>{const p=e.target.closest('[data-yt-play]'),rm=e.target.closest('[data-yt-remove]');if(p)playYT(ytItems[+p.dataset.ytPlay]);else if(rm){ytItems.splice(+rm.dataset.ytRemove,1);persistYT();renderYT();$('vlcf-yt-status').textContent='YouTube item removed.'}});
  render();renderYT();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
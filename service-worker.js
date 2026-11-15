const CACHE='infinity-player-shell-v1';
const CORE=['./','./index.html','./css/vlc-features.css','./js/vlc/features-tab.js','./js/vlc/youtube-playlists.js','./js/vlc/video-codec-compat.js','./js/vlc/offline-codec-engine.js','./assets/infinity-player-logo.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith(fetch(request).then(response=>{
  if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}
  return response;
 }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));
});
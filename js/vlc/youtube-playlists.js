/* YouTube URL parser and official playlist embed URL builder. */
(() => {
  'use strict';
  const VIDEO_ID=/^[A-Za-z0-9_-]{11}$/;
  const PLAYLIST_ID=/^[A-Za-z0-9_-]{10,80}$/;
  const HOSTS=new Set(['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','youtu.be']);
  function parseURL(raw) {
    try {
      const u=new URL(String(raw||'').trim());
      if(!['https:','http:'].includes(u.protocol)||u.username||u.password)return null;
      const host=u.hostname.toLowerCase().replace(/^www\./,'');
      if(!HOSTS.has(host))return null;
      let video=u.searchParams.get('v');
      if(host==='youtu.be')video=u.pathname.split('/').filter(Boolean)[0]||video;
      if(!video){const m=u.pathname.match(/^\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})(?:\/|$)/i);if(m)video=m[1]}
      if(video&&!VIDEO_ID.test(video))video=null;
      const list=u.searchParams.get('list');
      if(list&&PLAYLIST_ID.test(list)){
        const out={type:'playlist',id:list,url:'https://www.youtube.com/playlist?list='+encodeURIComponent(list)};
        if(video)out.videoId=video;
        const index=Number(u.searchParams.get('index'));
        if(Number.isFinite(index)&&index>=1&&index<=10000)out.startIndex=Math.floor(index)-1;
        return out;
      }
      if(video)return {type:'video',id:video,url:'https://www.youtube.com/watch?v='+encodeURIComponent(video)};
      return null;
    } catch (_) { return null; }
  }
  function extractPlaylistId(raw){const parsed=parseURL(raw);return parsed&&parsed.type==='playlist'?parsed.id:null}
  function buildEmbedUrl(id,mode,startSec){
    if(!PLAYLIST_ID.test(String(id||'')))throw new Error('Invalid YouTube playlist ID.');
    const host=mode==='nocookie'?'https://www.youtube-nocookie.com':'https://www.youtube.com';
    const origin=location.origin&&/^https?:/.test(location.origin)?'&origin='+encodeURIComponent(location.origin):'';
    const start=Math.max(0,Math.floor(Number(startSec)||0));
    return host+'/embed/videoseries?list='+encodeURIComponent(id)+'&autoplay=1&enablejsapi=1&rel=0&playsinline=1'+(start?'&start='+start:'')+origin;
  }
  window.VLCYouTubePlaylist={parseURL,extractPlaylistId,buildEmbedUrl};
})();
/* Infinity Player IPTV HLS audio/subtitle adapter. */
(function(){
 'use strict';
 const api={
  bind(hls,media){this.hls=hls||null;this.media=media||null;return this},
  audioTracks(hls){const x=hls||this.hls;return x&&Array.isArray(x.audioTracks)?x.audioTracks:[]},
  selectAudio(hls,index){const x=hls||this.hls,tracks=this.audioTracks(x);if(!x||!tracks[index])return false;try{x.audioTrack=Number(index);return x.audioTrack===Number(index)}catch(_){return false}},
  subtitleTracks(hls){const x=hls||this.hls;return x&&Array.isArray(x.subtitleTracks)?x.subtitleTracks:[]},
  selectSubtitle(hls,index){const x=hls||this.hls,tracks=this.subtitleTracks(x);if(!x)return false;const n=Number(index);if(n < -1 || n>=tracks.length)return false;try{x.subtitleTrack=n;return x.subtitleTrack===n}catch(_){return false}},
  clear(){this.hls=null;this.media=null}
 };
 window.InfinityIPTVAudio=api;
})();
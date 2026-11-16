/* Infinity Player IPTV HLS and native audio/subtitle adapter. */
(function(){
 'use strict';
 let media=null, audioList=null, onTracks=null;
 function detach(){
  if(audioList&&onTracks){
   ['addtrack','removetrack','change'].forEach(type=>audioList.removeEventListener(type,onTracks));
  }
  audioList=null;onTracks=null;
 }
 const api={
  bind(hls,element,callback){
   detach();this.hls=hls||null;media=element||null;
   if(typeof callback==='function'&&media){
    audioList=media.audioTracks||null;onTracks=()=>callback();
    if(audioList)['addtrack','removetrack','change'].forEach(type=>audioList.addEventListener(type,onTracks));
   }
   return this;
  },
  audioTracks(hls){const x=hls||this.hls;return x&&Array.isArray(x.audioTracks)?x.audioTracks:[]},
  selectAudio(hls,index){const x=hls||this.hls,tracks=this.audioTracks(x),n=Number(index);if(!x||!Number.isInteger(n)||!tracks[n])return false;try{x.audioTrack=n;return Number(x.audioTrack)===n}catch(_){return false}},
  nativeAudioTracks(element){const x=element||media;try{return x&&x.audioTracks?Array.from(x.audioTracks):[]}catch(_){return []}},
  selectNativeAudio(element,index){
   const x=element||media,n=Number(index);if(!x||!Number.isInteger(n))return false;
   const tracks=this.nativeAudioTracks(x);if(n<0||n>=tracks.length)return false;
   try{tracks.forEach((track,k)=>{track.enabled=k===n});return tracks[n].enabled===true}catch(_){return false}
  },
  subtitleTracks(hls){const x=hls||this.hls;return x&&Array.isArray(x.subtitleTracks)?x.subtitleTracks:[]},
  selectSubtitle(hls,index){const x=hls||this.hls,tracks=this.subtitleTracks(x);if(!x)return false;const n=Number(index);if(!Number.isInteger(n)||n < -1 || n>=tracks.length)return false;try{x.subtitleTrack=n;return x.subtitleTrack===n}catch(_){return false}},
  clear(){detach();this.hls=null;media=null}
 };
 window.InfinityIPTVAudio=api;
})();
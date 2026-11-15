/* Offline codec integration adapter.
 * Browser mode: HTMLMediaElement track APIs only.
 * Desktop mode: delegates to a trusted native host exposed as window.vlcNative.
 * This adapter is not itself a software codec and never claims unsupported HEVC.
 */
(() => {
  'use strict';
  const video = () => document.querySelector('#real-video-el, #net-video-el');
  const native = () => window.vlcNative || null;
  const engine = {
    getStatus() {
      const host = native();
      return host ? { mode:'native', available:true, name:host.name||'Native VLC host', codecs:host.codecs||[] }
        : { mode:'browser', available:false, name:'Browser media engine', codecs:['browser-supported codecs only'], note:'No bundled offline HEVC software decoder is present.' };
    },
    async open(file) {
      if (!(file instanceof Blob)) throw new TypeError('Choose a local media File or Blob.');
      const host=native();
      if(host && typeof host.openMedia==='function') return host.openMedia(file);
      const el=video(); if(!el) throw new Error('Video element not found.');
      const url=URL.createObjectURL(file);
      if(window.__vlcOfflineMediaUrl) URL.revokeObjectURL(window.__vlcOfflineMediaUrl);
      window.__vlcOfflineMediaUrl=url; el.src=url; await el.play();
      return {mode:'browser',url,codecSupport:'Browser/OS dependent; HEVC is not guaranteed.'};
    },
    listAudioTracks() {
      const host=native(); if(host&&typeof host.listAudioTracks==='function') return host.listAudioTracks();
      const tracks=video()?.audioTracks; if(!tracks) return [];
      return Array.from(tracks,(t,index)=>({id:t.id||String(index),index,label:t.label||'Audio '+(index+1),language:t.language||''}));
    },
    async selectAudioTrack(id) {
      const host=native(); if(host&&typeof host.selectAudioTrack==='function') return host.selectAudioTrack(id);
      const tracks=video()?.audioTracks;
      if(!tracks) throw new Error('This browser does not expose audioTracks. Use a native libVLC desktop host for multi-audio switching.');
      Array.from(tracks).forEach((t,i)=>{t.enabled=String(t.id||i)===String(id)||String(i)===String(id);});
      return true;
    },
    listSubtitleTracks() {
      const host=native(); if(host&&typeof host.listSubtitleTracks==='function') return host.listSubtitleTracks();
      const el=video(); return el?Array.from(el.textTracks,(t,index)=>({id:String(index),index,label:t.label||'Subtitle '+(index+1),language:t.language||'',mode:t.mode})):[];
    },
    async loadSubtitle(file,label='External subtitle',language='en') {
      if(!(file instanceof Blob)) throw new TypeError('Choose an SRT or VTT subtitle File.');
      const host=native(); if(host&&typeof host.loadSubtitle==='function') return host.loadSubtitle(file,{label,language});
      const el=video(); if(!el) throw new Error('Video element not found.');
      const text=await file.text();
      const vtt=/\bWEBVTT\b/.test(text.slice(0,100))?text:'WEBVTT\n\n'+text.replace(/\r/g,'').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2');
      const url=URL.createObjectURL(new Blob([vtt],{type:'text/vtt'}));
      const track=document.createElement('track'); track.kind='subtitles';track.label=label;track.srclang=language;track.src=url;track.default=true;el.appendChild(track);
      track.addEventListener('load',()=>{if(track.track)track.track.mode='showing';},{once:true});
      return {mode:'browser',track,url};
    }
  };
  window.VLCOfflineCodecEngine=engine;
})();

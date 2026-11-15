/* Browser codec capability checks. This module does not claim to software-decode unsupported codecs. */
(() => {
  'use strict';
  const probes = [
    'video/mp4; codecs="hvc1.1.6.L93.B0"',
    'video/mp4; codecs="hev1.1.6.L93.B0"',
    'video/mp4; codecs="hvc1"',
    'video/mp4; codecs="hev1"'
  ];
  const video = document.createElement('video');
  function inspect() {
    const results = probes.map(mime => ({ mime, support: video.canPlayType(mime) || 'no' }));
    const supported = results.some(x => x.support === 'probably' || x.support === 'maybe');
    return { codec: 'HEVC / H.265', supported, results, method: 'browser-native' };
  }
  async function detailed() {
    const base = inspect();
    if (!navigator.mediaCapabilities || !navigator.mediaCapabilities.decodingInfo) return base;
    try {
      const info = await navigator.mediaCapabilities.decodingInfo({
        type: 'file',
        video: { contentType: 'video/mp4; codecs="hvc1.1.6.L93.B0"', width: 1920, height: 1080, bitrate: 8000000, framerate: 30 }
      });
      return { ...base, mediaCapabilities: { supported: info.supported, smooth: info.smooth, powerEfficient: info.powerEfficient } };
    } catch (_) { return base; }
  }
  function explain() {
    const result = inspect();
    return result.supported
      ? 'This browser reports native HEVC/H.265 support. Actual playback still depends on the file profile, operating-system codecs and hardware.'
      : 'This browser does not report native HEVC/H.265 support. A JavaScript wrapper cannot add a decoder; use a browser/OS with HEVC support or a separately licensed FFmpeg/WebAssembly decoder build.';
  }
  window.VLCCodecCompat = { inspect, detailed, explain };
  window.addEventListener('DOMContentLoaded', () => {
    const videoEls = ['real-video-el', 'net-video-el'];
    videoEls.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('error', () => {
        if (window.VLCCodecCompat && window.VLCCodecCompat.inspect().supported === false && window.showToast) {
          window.showToast('HEVC/H.265 may be unsupported by this browser. Try an HEVC-enabled browser/OS codec.');
        }
      });
    });
  });
})();
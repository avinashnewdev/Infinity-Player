/* YouTube playlist URL parsing and official playlist embed URL builder. */
(() => {
  'use strict';
  function extractPlaylistId(raw) {
    try {
      const u = new URL(String(raw || '').trim());
      const host = u.hostname.toLowerCase().replace(/^www\./, '');
      if (!['youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','youtu.be'].includes(host)) return null;
      const id = u.searchParams.get('list');
      return id && /^[A-Za-z0-9_-]{10,80}$/.test(id) ? id : null;
    } catch (_) { return null; }
  }
  function buildEmbedUrl(id, mode, startSec) {
    if (!/^[A-Za-z0-9_-]{10,80}$/.test(String(id || ''))) throw new Error('Invalid YouTube playlist ID.');
    const host = mode === 'nocookie' ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com';
    const origin = location.origin && /^https?:/.test(location.origin) ? '&origin=' + encodeURIComponent(location.origin) : '';
    const start = Math.max(0, Math.floor(Number(startSec) || 0));
    return host + '/embed/videoseries?list=' + encodeURIComponent(id) + '&autoplay=1&enablejsapi=1&rel=0&playsinline=1' + (start ? '&start=' + start : '') + origin;
  }
  window.VLCYouTubePlaylist = { extractPlaylistId, buildEmbedUrl };
})();
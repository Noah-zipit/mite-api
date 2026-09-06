import { Innertube } from 'youtubei.js';

let yt = null;
async function getYT() {
  if (!yt) {
    yt = await Innertube.create({ lang: 'en', location: 'US', retrieve_player: true });
  }
  return yt;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  try {
    const youtube = await getYT();

    // SEARCH: /api/search?q=something
    if (path === '/search' || path === '/') {
      const q = url.searchParams.get('q');
      if (!q) return res.status(400).json({ error: 'Missing q' });

      const results = await youtube.search(q, { type: 'video' });
      const videos = (results.videos || []).filter(v => v.type === 'Video').map(v => ({
        id: v.id,
        title: v.title?.text || 'Untitled',
        channel: v.author?.name || 'Unknown',
        duration: v.duration?.text || '0:00',
        durationSec: v.duration?.seconds || 0,
        views: v.views?.text || '',
        thumbnail: v.thumbnails?.[0]?.url || ''
      }));

      return res.status(200).json({ results: videos });
    }

    // WATCH: /api/watch?id=VIDEO_ID
    if (path === '/watch') {
      const id = url.searchParams.get('id');
      if (!id) return res.status(400).json({ error: 'Missing id' });

      const info = await youtube.getInfo(id);

      const audioFmt = info.chooseFormat({ type: 'audio', quality: 'best' });
      const audioUrl = audioFmt?.decipher(youtube.session.player) || audioFmt?.url || '';

      const videoFmt = info.chooseFormat({ type: 'video+audio', quality: 'best' });
      const videoUrl = videoFmt?.decipher(youtube.session.player) || videoFmt?.url || '';

      const audioDownloads = info.formats
        .filter(f => f.has_audio && !f.has_video)
        .map(f => ({
          quality: `${Math.round((f.average_bitrate || 128000) / 1000)} kbps`,
          url: f.decipher(youtube.session.player) || f.url
        })).slice(0, 3);

      const videoDownloads = info.formats
        .filter(f => f.has_video && f.has_audio)
        .map(f => ({
          quality: f.quality_label || '720p',
          url: f.decipher(youtube.session.player) || f.url
        })).slice(0, 3);

      return res.status(200).json({
        audioUrl,
        videoUrl,
        downloadOptions: { audio: audioDownloads, video: videoDownloads }
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

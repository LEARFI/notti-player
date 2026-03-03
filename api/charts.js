const yts = require('yt-search');

export default async function handler(req, res) {
    try {
        // Ищем популярные музыкальные подборки 2026 года
        const r = await yts('Top Hits 2026');
        const charts = r.videos.slice(0, 8).map(v => ({
            id: v.videoId,
            title: v.title,
            artist: v.author.name,
            img: v.thumbnail
        }));
        res.status(200).json(charts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load charts' });
    }
}

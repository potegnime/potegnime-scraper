const axios = require('axios');

const BASE_URL = 'https://yts.lt';
const SEARCH_URL = '/api/v2/list_movies.json';

/**
 * Search YTS for movies
 * @param {string} query - Search query
 * @param {number} limit - Max results (default 20)
 * @returns {Promise<Array>} Array of torrent results
 */
async function search(query, limit = 100) {
    try {
        const url = `${BASE_URL}${SEARCH_URL}`;
        const response = await axios.get(url, {
            params: {
                query_term: query,
                sort_by: 'seeds',
                order_by: 'desc',
                limit: limit
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const movies = response.data?.data?.movies;

        if (!movies || !Array.isArray(movies)) {
            return [];
        }

        // Flatten movies into individual torrents (each quality is a separate torrent)
        const torrents = [];
        for (const movie of movies) {
            if (movie.torrents && Array.isArray(movie.torrents)) {
                for (const torrent of movie.torrents) {
                    torrents.push({
                        provider: 'yts',
                        title: `${movie.title} (${movie.year}) ${torrent.quality}`,
                        time: torrent.date_uploaded || '?',
                        seeds: torrent.seeds || 0,
                        peers: torrent.peers || 0,
                        size: torrent.size || '?',
                        magnet: buildMagnet(torrent.hash, movie.title),
                        link: torrent.url,
                        imdb: movie.imdb_code || '?',
                        desc: movie.url
                    });
                }
            }
        }

        return torrents;
    } catch (err) {
        console.error('YTS search error:', err.message);
        return [];
    }
}

/**
 * Build magnet link from hash
 * @param {string} hash - Torrent hash
 * @param {string} title - Movie title
 * @returns {string} Magnet link
 */
function buildMagnet(hash, title) {
    if (!hash) return '';
    const encodedTitle = encodeURIComponent(title);
    const trackers = [
        'udp://open.demonii.com:1337/announce',
        'udp://tracker.openbittorrent.com:80',
        'udp://tracker.coppersurfer.tk:6969',
        'udp://glotorrents.pw:6969/announce',
        'udp://tracker.opentrackr.org:1337/announce',
        'udp://torrent.gresille.org:80/announce',
        'udp://p4p.arenabg.com:1337',
        'udp://tracker.leechers-paradise.org:6969'
    ];
    const trackersStr = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    return `magnet:?xt=urn:btih:${hash}&dn=${encodedTitle}${trackersStr}`;
}

module.exports = {
    search,
    buildMagnet,
    BASE_URL
};

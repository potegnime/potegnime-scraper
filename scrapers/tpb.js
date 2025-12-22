const axios = require('axios');

const BASE_URL = 'https://apibay.org';
const SEARCH_URL = '/q.php';

const CATEGORIES = {
    all: '',
    audio: '100',
    video: '200',
    applications: '300',
    games: '400',
    porn: '500',
    other: '600'
};

/**
 * Search ThePirateBay for torrents
 * @param {string} query - Search query
 * @param {string} category - Category (all, audio, video, applications, games, porn, other)
 * @param {number} limit - Max results (default 100)
 * @returns {Promise<Array>} Array of torrent results
 */
async function search(query, category = 'all', limit = 100) {
    try {
        const cat = CATEGORIES[category.toLowerCase()] || '';
        const url = `${BASE_URL}${SEARCH_URL}`;

        const response = await axios.get(url, {
            params: {
                q: query,
                cat: cat
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const results = response.data;

        // API returns array with single object { name: "No results returned" } when no results
        if (!Array.isArray(results) || results.length === 0) {
            return [];
        }

        if (results.length === 1 && results[0].name === 'No results returned') {
            return [];
        }

        // Limit results
        const limited = results.slice(0, limit);

        return limited.map(r => ({
            provider: 'thepiratebay',
            id: r.id,
            title: r.name,
            time: formatTime(r.added),
            seeds: parseInt(r.seeders) || 0,
            peers: parseInt(r.leechers) || 0,
            size: humanizeSize(r.size),
            magnet: formatMagnet(r.info_hash, r.name),
            numFiles: parseInt(r.num_files) || 0,
            status: r.status,
            category: r.category,
            imdb: r.imdb || '?'
        }));
    } catch (err) {
        console.error('TPB search error:', err.message);
        return [];
    }
}

/**
 * Format unix timestamp to readable string
 * @param {string|number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatTime(timestamp) {
    try {
        const ts = parseInt(timestamp);
        if (isNaN(ts)) return '?';
        return new Date(ts * 1000).toUTCString();
    } catch {
        return '?';
    }
}

/**
 * Convert bytes to human readable size
 * @param {string|number} bytes - Size in bytes
 * @returns {string} Human readable size
 */
function humanizeSize(bytes) {
    try {
        const size = parseInt(bytes);
        if (isNaN(size)) return '?';

        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let unitIndex = 0;
        let humanSize = size;

        while (humanSize >= 1024 && unitIndex < units.length - 1) {
            humanSize /= 1024;
            unitIndex++;
        }

        return `${humanSize.toFixed(2)} ${units[unitIndex]}`;
    } catch {
        return '?';
    }
}

/**
 * Build magnet link from info hash
 * @param {string} infoHash - Torrent info hash
 * @param {string} name - Torrent name
 * @returns {string} Magnet link
 */
function formatMagnet(infoHash, name) {
    if (!infoHash) return '';

    const trackers = [
        'udp://tracker.coppersurfer.tk:6969/announce',
        'udp://tracker.opentrackr.org:1337',
        'udp://tracker.internetwarriors.net:1337/announce',
        'udp://tracker.leechers-paradise.org:6969/announce',
        'udp://tracker.pirateparty.gr:6969/announce',
        'udp://tracker.cyberia.is:6969/announce',
        'udp://open.demonii.com:1337/announce',
        'udp://tracker.openbittorrent.com:80'
    ];

    const trackersStr = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    return `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(name)}${trackersStr}`;
}

module.exports = {
    search,
    formatMagnet,
    humanizeSize,
    BASE_URL,
    CATEGORIES
};

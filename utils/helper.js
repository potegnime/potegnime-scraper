const TorrentSearchApi = require("torrent-search-api");

/**
 * Search torrents from a specific provider or all enabled providers
 * @param {string} query - Search query
 * @param {string} category - Torrent category
 * @param {string} source - Provider name
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Array of torrent results
 */
async function searchTorrents(query, category, source, limit) {
    try {
        const foundTorrents = await TorrentSearchApi.search([source], query, category, limit);

        // TPB specific: no results returns result titled "No results returned"
        if (source.toLowerCase() === 'thepiratebay') {
            const noResultsTorrent = foundTorrents.find(torrent => torrent.title === 'No results returned');
            if (noResultsTorrent) {
                return [];
            }
        }

        if (foundTorrents.length === 0) {
            return [];
        }

        return foundTorrents.map(torrent => ({
            source: torrent.provider.toLowerCase(),
            title: torrent.title,
            size: torrent.size,
            time: torrent.time || "?",
            url: getMagnetLink(source, torrent),
            seeds: getSeeds(torrent),
            peers: getPeers(torrent),
            imdb: torrent.imdb || "?"
        }));
    } catch (err) {
        // Handle provider blocks (Cloudflare / 403 pages) and other errors gracefully
        try {
            const status = err && (err.statusCode || err.status) ? (err.statusCode || err.status) : 'unknown';
            const bodyStr = typeof err === 'string' ? err : (err && err.message ? err.message : '');
            const looksLikeHtmlChallenge = bodyStr && (bodyStr.includes('Enable JavaScript and cookies') || bodyStr.includes('<!DOCTYPE html>') || bodyStr.includes('Just a moment'));

            if (looksLikeHtmlChallenge) {
                console.warn(`Provider "${source}" appears blocked by Cloudflare. Returning empty results.`);
                return [];
            }

            console.warn(`Search failed for provider="${source}" query="${query}" status=${status}:`, bodyStr);
        } catch (logErr) {
            console.warn('Error while logging search failure', logErr);
        }

        return [];
    }
}

/**
 * Get magnet link from torrent based on provider
 * @param {string} provider - Provider name
 * @param {object} torrent - Torrent object
 * @returns {string} Magnet link or empty string
 */
function getMagnetLink(provider, torrent) {
    provider = provider.toLowerCase();
    if (provider === "thepiratebay") return torrent.magnet || "";
    if (provider === "yts") return torrent.link || "";
    return "?";
}

/**
 * Get seed count from torrent
 * @param {object} torrent - Torrent object
 * @returns {string} Seed count or "?"
 */
function getSeeds(torrent) {
    return torrent.seeds === "N/A" ? "?" : String(torrent.seeds);
}

/**
 * Get peer count from torrent
 * @param {object} torrent - Torrent object
 * @returns {string} Peer count or "?"
 */
function getPeers(torrent) {
    return torrent.peers === "N/A" ? "?" : String(torrent.peers);
}

module.exports = {
    searchTorrents,
    getMagnetLink,
    getSeeds,
    getPeers
};
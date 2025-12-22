const express = require("express");
const router = express.Router();
const { searchTorrents } = require("../utils/helper");

const providers = ["All", "Yts", "ThePirateBay", "Eztv", "TorrentProject"];

/**
 * GET /search
 * Search torrents across providers
 *
 * Query parameters:
 * - query: search query (required)
 * - category: torrent category (optional, default: all)
 * - source: torrent provider (optional, default: all)
 * - limit: number of results to return (optional, default: 100)
 */
router.get("/search", async (req, res) => {
    try {
        const { query, category = "all", source = "all", limit = 100 } = req.query;

        // Validate query parameters
        if (!query) {
            return res.status(400).json({ error: "Query parameter is required" });
        }

        const sourceLower = String(source).toLowerCase();
        if (!providers.map(p => p.toLowerCase()).includes(sourceLower) && sourceLower !== "all") {
            return res.status(400).json({ error: "Invalid provider" });
        }

        let results = {};

        if (sourceLower === "all") {
            // Search all providers
            for (const provider of providers) {
                if (provider.toLowerCase() === 'all') continue;
                results[provider.toLowerCase()] = await searchTorrents(query, category, provider, limit);
            }
        } else {
            // Search specific provider
            results[sourceLower] = await searchTorrents(query, category, sourceLower, limit);
        }

        // Check if any results were found
        if (Object.values(results).every(providerResults => providerResults.length === 0)) {
            return res.status(404).json({ error: "No results found" });
        }

        return res.json(results);
    } catch (error) {
        console.error("Error searching torrents:", error);
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const TorrentSearchApi = require("torrent-search-api");

const providers = ["All", "Yts", "ThePirateBay", "Eztv", "TorrentProject"];

/**
 * GET /categories
 * Get available categories for enabled providers
 *
 * Query parameters:
 * - lowercase: return categories in lowercase (optional, default: false)
 */
router.get("/categories", (req, res) => {
    const tsaCategories = TorrentSearchApi.getProviders();

    try {
        const returnLowerCase = req.query.lowercase === "true" || false;

        const result = tsaCategories
            .filter(provider => provider.public && providers.includes(provider.name))
            .reduce((acc, { name, categories }) => {
                if (returnLowerCase) {
                    acc[name.toLowerCase()] = categories.map(c => c.toLowerCase());
                } else {
                    acc[name] = categories;
                }
                return acc;
            }, {});

        return res.json(result);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

module.exports = router;
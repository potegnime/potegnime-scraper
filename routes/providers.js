const express = require("express");
const router = express.Router();

/**
 * GET /providers
 * Get list of available torrent providers
 * Query parameters:
 * - lowercase: return providers in lowercase (optional, default: false)
 */
router.get("/providers", (req, res) => {
    try {
        const providers = ["All", "Yts", "ThePirateBay", "Eztv", "TorrentProject"];
        const returnLowerCase = req.query.lowercase === "true" || false;

        if (returnLowerCase) {
            const returnObj = { providers: providers.map(p => p.toLowerCase()) };
            return res.json(returnObj);
        }

        const returnObj = { providers };
        return res.json(returnObj);
    } catch (error) {
        console.error("Error fetching providers:", error);
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

module.exports = router;
const express = require("express");
const router = express.Router();

/**
 * GET /download
 * Download the .torrent file from a magnet link
 *
 * Query parameters:
 * - magnet: magnet link (required)
 *
 * Returns the .torrent file itself (not the content)
 */
router.get("/download", async (req, res) => {
    try {
        const { magnet } = req.query;
        if (!magnet) {
            return res.status(400).json({ error: "Magnet parameter is required" });
        }

        const { default: WebTorrent } = await import('webtorrent');

        const client = new WebTorrent();
        client.add(magnet, torrent => {
            const torrentFile = torrent.torrentFile;
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${torrent.name}.torrent"`
            );
            res.setHeader("Content-Type", "application/x-bittorrent");

            res.end(torrentFile);

            try { client.destroy(); } catch (e) {}
        });

        client.on('error', (err) => {
            console.error("WebTorrent error:", err);
            res.status(500).json({ error: `Failed to download torrent file: ${err}` });
            client.destroy();
        });
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

module.exports = router;
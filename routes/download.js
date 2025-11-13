const express = require("express");
const router = express.Router();

/**
 * GET /download
 * Download torrent file by magnet link
 *
 * Query parameters:
 * - magnet: magnet link (required)
 *
 * NOTE: Currently disabled for Lambda environments
 * WebTorrent requires persistent connections which don't work well with Lambda
 */
router.get("/download", async (req, res) => {
    return res.status(503).json({ error: "Download endpoint is temporarily disabled" });

    // TODO: Re-enable when streaming can be properly implemented for Lambda
    // For now, returning 503 to prevent timeouts
    /*
    try {
        const { magnet } = req.query;
        if (!magnet) {
            return res.status(400).json({ error: "Magnet parameter is required" });
        }

        // Dynamically import WebTorrent
        const { default: WebTorrent } = await import('webtorrent');

        const client = new WebTorrent();
        client.add(magnet, torrent => {
            console.log("Torrent started:", torrent.infoHash);

            const file = torrent.files[0];
            if (!file) {
                console.warn('No files available in torrent', torrent.infoHash);
                try { client.destroy(); } catch (e) { }
                return res.status(500).json({ error: 'No files available in this torrent' });
            }

            res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
            res.setHeader("Content-Type", "application/octet-stream");

            const stream = file.createReadStream();
            stream.pipe(res);

            res.on("close", () => {
                try {
                    torrent.destroy();
                } catch (e) {
                    console.warn('Failed to destroy torrent', e);
                }
            });
        });

        client.on('error', (err) => {
            console.error("WebTorrent error:", err);
            res.status(500).json({ error: `Failed to download torrent file: ${err}` });
            client.destroy();
        });
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error}` });
    }
    */
});

module.exports = router;
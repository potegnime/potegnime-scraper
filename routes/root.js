const express = require("express");
const router = express.Router();

/**
 * GET /
 * Root endpoint
 */
router.get("/", (req, res) => {
    res.send("scraper");
});

module.exports = router;
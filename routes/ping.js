const express = require("express");
const router = express.Router();

/**
 * GET /ping
 * Health check endpoint
 */
router.get("/ping", (req, res) => {
    res.json("pong");
});

module.exports = router;
const express = require("express");
const router = express.Router();

/**
 * GET /
 * Root endpoint
 */
router.get("/", (req, res) => {
    res.send("pong");
});

module.exports = router;
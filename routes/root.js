const express = require("express");
const router = express.Router();

/**
 * GET /
 * Root endpoint - returns HTML or JSON based on Accept header
 */
router.get("/", (req, res) => {
    const acceptHeader = req.headers.accept || '';

    if (acceptHeader.includes('application/json')) {
        return res.json({ message: "pong" });
    }

    const html = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
            <img src="https://i.pinimg.com/474x/b5/15/95/b51595de229aaa7712279a7653c307f0.jpg" alt="Angry cat" width="300">
        </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

module.exports = router;
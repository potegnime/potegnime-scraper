const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const TorrentSearchApi = require("torrent-search-api");  // https://www.npmjs.com/package/torrent-search-api?activeTab=readme

// Import route controllers
const rootRoutes = require("./routes/root");
const providersRoutes = require("./routes/providers");
const categoriesRoutes = require("./routes/categories");
const searchRoutes = require("./routes/search");
const downloadRoutes = require("./routes/download");

/*
Initialize
*/
// API settings
const app = express();
const port = process.env.PORT || 1337;

// Middleware
app.use(express.json());

// CORS
app.use(cors({
    origin: (origin, callback) => {
        // allow non-browser or same-origin requests
        if (!origin) return callback(null, true);
        try {
            const host = new URL(origin).hostname.toLowerCase();
            if (host === "potegni.me") return callback(null, true);
            if (host.endsWith(".potegnime-angular.pages.dev")) return callback(null, true);
            if (host.endsWith(".pages.dev")) return callback(null, true);

            // debug only
            // if (host == "localhost") return callback(null, true);
        } catch (e) {
            // invalid origin => deny
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true
}));

// Handle preflight requests
app.options("*", cors());

// Authentication middleware
app.use((req, res, next) => {
    // Allow OPTIONS requests to pass through
    if (req.method === "OPTIONS") {
        return next();
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!authHeader) {
        return res.status(401).json({ error: 'JWT missing' });
    }

    const appKey = process.env.POTEGNIME_APP_KEY;
    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const details = { algorithms: ["HS512"], issuer: issuer, audience: audience };

    jwt.verify(token, appKey, details, (err, user) => {
        if (err) {
            console.error("JWT_VERIFICATION_FAILED:", err);
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = user;
        next();
    });
});

// Initialize torrent search API
console.log("Initializing torrent search API...");
const providers = ["All", "Yts", "ThePirateBay", "Eztv", "TorrentProject"]; // TODO: support more providers
for (const provider of providers) {
    if (provider === 'All') {
        continue;
    }
    TorrentSearchApi.enableProvider(provider);
}

/*
Register routes
*/
app.use("/", rootRoutes);
app.use("/", providersRoutes);
app.use("/", categoriesRoutes);
app.use("/", searchRoutes);
app.use("/", downloadRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
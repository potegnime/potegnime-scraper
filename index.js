const express = require("express");
const TorrentSearchApi = require("torrent-search-api");  // https://www.npmjs.com/package/torrent-search-api?activeTab=readme
const cors = require("cors");
let WebTorrent;
(async () => {
    WebTorrent = (await import('webtorrent')).default;
})();

/*
Initialize
*/
// API settings
const app = express();
const port = process.env.PORT || 1337;
app.use(express.json()); // Middleware to parse JSON requests

app.use(cors({
    origin: (origin, callback) => {
        // allow non-browser or same-origin requests
        if (!origin) return callback(null, true);
        try {
            const host = new URL(origin).hostname.toLowerCase();
            if (host === "potegni.me") return callback(null, true);
            if (host.endsWith(".potegnime-angular.pages.dev")) return callback(null, true);
            if (host.endsWith(".pages.dev")) return callback(null, true);
            const allowAny = process.env.ALLOW_ANY_CNAME;
            if (allowAny && (allowAny === "1" || allowAny.toLowerCase() === "true")) {
                return callback(null, true);
            }
        } catch (e) {
            // invalid origin => deny
        }
        return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true
}));

// Torrent settings
console.log("Initializing torrent search API...");
const providers = ["All", "Yts", "ThePirateBay", "Eztv", "TorrentProject", "Torrent9"]; // TODO: support more providers
for (const provider of providers) {
    if (provider === 'All') {
        continue;
    }
    TorrentSearchApi.enableProvider(provider);
}
// console.warn = () => { };
// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0"; // Bypass UNABLE_TO_VERIFY_LEAF_SIGNATURE



/*
Api routes
*/
// root
app.get("/", (req, res) => {
    // Check if the client wants HTML (default) or JSON
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
        return res.json({ message: "pong" });
    }

    // Return HTML with an image
    const html = `
    <!DOCTYPE html>
    <html>
        <head>
        </head>
        <body>
            <div >
                <img src="https://i.pinimg.com/474x/b5/15/95/b51595de229aaa7712279a7653c307f0.jpg" alt="angry cat" style="width: 300px;">
            </div>
        </body>
    </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
});

// Ping
app.get("/ping", (req, res) => {
    res.json("pong");
});

// Get available providers
/*
    Query parameters:
    - lowercase: return providers in lowercase (optional, default: false)
*/
app.get("/providers", (req, res) => {
    try {
        const returnLowerCase = req.query.lowercase === "true" || false;
        if (returnLowerCase) {
            // Convert all providers to lowercase and return (parsing consistency)
            let returnObj = { providers: [...providers.map(p => p.toLowerCase())] };
            return res.json(returnObj);
        }
        else {
            // Return providers as is
            let returnObj = { providers: [...providers.map(p => p)] };
            return res.json(returnObj);
        }
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

// Get available categories for enabled providers
/*

    Query parameters:
    - lowercase: return providers in lowercase (optional, default: false)

    Notes:
    torrent-search-api get all providers and their categories: TorrentSearchApi.getProviders()
*/
app.get("/categories", (req, res) => {
    const tsaCategories = TorrentSearchApi.getProviders();
    try {
        const returnLowerCase = req.query.lowercase === "true" || false;
        const result = tsaCategories
            .filter(provider => provider.public && providers.includes(provider.name))  // Filter by public and supported
            .reduce((acc, { name, categories }) => {
                if (returnLowerCase) {
                    acc[name.toLowerCase()] = categories.map(c => c.toLowerCase());
                }
                else {
                    acc[name] = categories;
                }
                return acc;
            }, {});

        return res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

// Search torrents
/*
    Query parameters:
    - query: search query
    - category: torrent category (optional, default: all)
    - source: torrent provider (optional, default: all)
    - limit: number of results to return (optional, default: 20)
*/
app.get("/search", async (req, res) => {
    try {
        const { query, category = "all", source = "all", limit = 10 } = req.query;

        // validate query parameters
        if (!query) return res.status(400).json({ error: "Query parameter is required" });

        // Validate source and set default to "all"
        const sourceLower = source.toLowerCase();
        if (!providers.map(p => p.toLowerCase()).includes(sourceLower) && sourceLower !== "all") {
            return res.status(400).json({ error: "Invalid provider" });
        }

        let results = {};
        if (source === "all") {
            for (const provider of providers) {
                if (provider.toLowerCase() === 'all') continue; // Skip "All" provider
                results[provider.toLowerCase()] = await searchTorrents(query, category, provider, limit);
            }
            if (Object.values(results).every(providerResults => providerResults.length === 0)) {
                return res.status(404).json({ error: "No results found" });
            }
            return res.json(results);
        }
        else {
            results[sourceLower] = await searchTorrents(query, category, sourceLower, limit);
            if (Object.values(results).every(providerResults => providerResults.length === 0)) {
                return res.status(404).json({ error: "No results found" });
            }
            return res.json(results);
        }
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error}` });
    }
});

// Download torrent file by magnet link
/*
    Query parameters:
    - magnet: magnet link
*/
app.get("/download", async (req, res) => {
    // disabled until AWS
    return res.status(503).json({ error: "Download endpoint is temporarily disabled" });
    try {
        const { magnet } = req.query;
        if (!magnet) return res.status(400).json({ error: "Magnet parameter is required" });
        // Dynamically import WebTorrent and get the default export
        const { default: WebTorrent } = await import('webtorrent');

        const client = new WebTorrent();
        client.add(magnet, torrent => {
            console.log("Torrent started:", torrent.infoHash);

            // Stream just the first file
            const file = torrent.files[0];

            res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
            res.setHeader("Content-Type", "application/octet-stream");

            const stream = file.createReadStream();
            stream.pipe(res);

            // When response finishes, destroy torrent
            res.on("close", () => {
                torrent.destroy(() => {
                    console.log("Torrent closed");
                });
            });
        });

        // Handle errors
        client.on('error', (err) => {
            console.error("WebTorrent error:", err);
            res.status(500).json({ error: `Failed to download torrent file: ${err}` });
            client.destroy();
        });
    } catch (error) {
        res.status(500).json({ error: `Server error: ${error}` });
    }
});


/*
Helper functions
*/
async function searchTorrents(query, category, source, limit) {
    const foundTorrents = await TorrentSearchApi.search([source], query, category, limit);

    // TPB specific: no results returns result titled  "No results returned"
    if (source.toLowerCase() === 'thepiratebay') {

        const noResultsTorrent = foundTorrents.find(torrent => torrent.title === 'No results returned');
        if (noResultsTorrent) {
            return [];
        }
    }

    return foundTorrents.map(torrent => ({
        source: torrent.provider.toLowerCase(),
        title: torrent.title,
        size: torrent.size,
        time: torrent.time || "?",
        url: getMagnetLink(source, torrent),
        seeds: getSeeds(torrent),
        peers: getPeers(torrent),
        imdb: torrent.imdb || "?"
    }));
}

function getMagnetLink(provider, torrent) {
    provider = provider.toLowerCase();
    if (provider === "thepiratebay") return torrent.magnet || "";
    if (provider === "yts") return torrent.link || "";
    return "?";
}

function getSeeds(torrent) {
    return torrent.seeds === "N/A" ? "?" : String(torrent.seeds);
}

function getPeers(torrent) {
    return torrent.peers === "N/A" ? "?" : String(torrent.peers);
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
const express = require("express");
const TorrentSearchApi = require("torrent-search-api");  // https://www.npmjs.com/package/torrent-search-api?activeTab=readme



/*
Initialize
*/
// API settings
const app = express();
const port = process.env.PORT || 1337;
app.use(express.json()); // Middleware to parse JSON requests

// Torrent settings
console.log("Initializing torrent search API...");
const providers = ["All", "ThePirateBay", "Yts"]; // TODO: support more providers
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
    torrent-search-api get all providers and their categories: TorrentSearchApi.getProviders()
*/
app.get("/categories", (req, res) => {
    const tsaCategories = TorrentSearchApi.getProviders();
    try {
        const result = tsaCategories
            .filter(provider => provider.public && providers.includes(provider.name))  // Filter by public and supported
            .reduce((acc, { name, categories }) => {
                acc[name.toLowerCase()] = categories;  // Add to object with lowercase name
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
        // Debug
        console.log("kveri: ", query);
        console.log("kategori: ", category);
        console.log("sors: ", source);
        console.log("limit: ", limit);
        if (!query) return res.status(400).json({ error: "Query parameter is required" });
        if (!providers.map(p => p.toLowerCase()).includes(source) && source !== "all") {
            return res.status(400).json({ error: "Invalid provider" });
        }

        let results = {};
        if (source === "all") {
            for (const provider of providers) {
                if (provider.toLowerCase() === 'all') continue; // Skip "All" provider
                results[provider.toLowerCase()] = await searchTorrents(query, category, provider, limit);
            }
            return res.json(results);
        }
        else {
            results[source] = await searchTorrents(query, category, source, limit);
            return res.json(results);
        }
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

# [potegni.me](https://potegni.me) scraper

To learn more about the project, visit [GitHub organization](https://github.com/potegnime)

## Overview
- **Framework:** ExpressJS
- **Torrent scrapper:** [torrent-search-api](https://www.npmjs.com/package/torrent-search-api?activeTab=readme)

## Development
Prerequisites:
- Node.js

Running the app:

```
npm install
npm run dev
```

API runs on http://localhost:1337

If you want to debug potegnime-scraper from Angular frontend you must also update CORS settings to allow localhost. Add this line to CORS settings: `if (host == "localhost") return callback(null, true);`

## Development guidelines
- TODO

## Deployment
For deployment info consult internal [potegnime-wiki](https://github.com/potegnime/potegnime-wiki)

If you want to try out the production build locally run:
```
npm start
```

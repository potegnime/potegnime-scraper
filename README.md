# [potegni.me](https://potegni.me) scraper

To learn more about the project, visit [GitHub organization](https://github.com/potegnime)

## Overview
- **Framework:** ExpressJS
- **Torrent scrapper:** [torrent-search-api](https://www.npmjs.com/package/torrent-search-api?activeTab=readme)

## Development
Prerequisites:
- Node.js
### Running the API
1. Set the `NODE_ENV` variable to "development" in the `.env` file
2. Set RS256 keys<br>
    Enter the public key in `keys/public.pem`. This should be the same public key as the [potegnime-api](https://github.com/potegnime/potegnime-api). For instructions on how to generate a RS256 key pair see potegnime-api [README](https://github.com/potegnime/potegnime-api/blob/main/README.md), Development section.
2. Run the API:<br><br>
    ```
    npm install
    npm run dev
    ```
    API runs on http://localhost:1337

## Development guidelines
- Be cool

## Deployment
For deployment info consult internal [potegnime-wiki](https://github.com/potegnime/potegnime-wiki)

If you want to try out the production build locally run:
```
npm start
```

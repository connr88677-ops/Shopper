# Fitstify prototype

A browser-only prototype for the Fitstify fashion catalog community.

## Run it
Open `index.html` in a modern browser. The `fitstify-icon.svg` file provides the browser tab icon.

## Included in this prototype
- Discover and search sample public catalogs
- Create local catalogs with public, unlisted, or private labels
- Like catalogs and browse your own/liked catalogs
- Dark mode by default, with a light-mode toggle
- Catalog details open in an overlay popup
- Import a legacy Shopper JSON backup (`{ "products": [...] }`) into one of your own catalogs, including embedded product images

## Important limitations
This is a local front-end prototype. It does not have real user accounts, cross-device syncing, server-side privacy enforcement, moderation services, or production-grade storage. Visibility labels are UI-only until a backend with authorization is implemented. Data and imported images are saved in browser local storage, which has size limits.

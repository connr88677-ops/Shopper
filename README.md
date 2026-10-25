# Fitstify prototype

A local, browser-only prototype for fashion catalogs. Open `index.html` in a browser.

## Current prototype features
- Dark mode by default, with a theme toggle.
- Create public, unlisted, and private-labeled catalogs locally.
- Upload catalog cover images and a first clothing item image.
- Click a clothing image to open its product link when one is provided.
- Import catalog JSON backups and export an individual catalog as JSON.
- Trending tags are derived from catalogs in the current browser.
- No seeded example catalogs; the discovery page starts empty until you add catalogs.

## Important limitations
This is a local prototype, not a public multi-user service. Catalogs are stored in this browser's localStorage; uploaded images are embedded in that browser's data and can make storage fill up. Private visibility is not secure access control. Do not use for real private content. A production version needs authenticated users, database/storage, server-side authorization, and moderation.

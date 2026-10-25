# Fitstify — clickable prototype

A responsive, single-file prototype for a fashion catalog discovery platform.

## Run it
- Open `index.html` in a modern browser, or deploy this folder to a static host such as Vercel.
- No build step or package install is required.

## Included in this prototype
- Editorial black/white/neutral design with responsive mobile layout
- Discovery grid, tag filters, text/hashtag search
- Create catalogs with title, description, cover image URL, tags, visibility label, and one optional first item
- Public / unlisted / private visibility labels
- Likes and a liked-catalogs view
- My catalogs view and catalog detail pages
- Browser-local persistence using `localStorage`
- Basic URL scheme validation for submitted URLs

## Important limitations before public launch
This is a front-end prototype, not a production social network. Catalogs and likes are stored only in the current browser and do not sync across devices. There is no real authentication, database, server-side authorization, secure private/unlisted access, image moderation, pornography detection, abuse reporting, admin review queue, or rate limiting. Demo catalogs use externally hosted Unsplash images. Private visibility is only a demo label and must not be treated as secure. Do not use it for sensitive content.

## Recommended production next step
Build a Next.js + TypeScript app backed by Supabase Auth, Postgres, and Storage. Enforce catalog access in server/database policies (RLS), keep private catalogs out of public search, add authenticated likes, server-side image/link screening, reporting and moderation tools, and test policies before publishing.

SHOPPER — personal clothing link collection

FILES
- index.html: the website
- shopper-icon.png: browser tab icon

DEPLOY TO GITHUB + VERCEL
1. Create a new GitHub repository.
2. Upload index.html and shopper-icon.png to the repository root.
3. In Vercel, choose Add New → Project and import that GitHub repository.
4. Keep the default Framework Preset as Other; no build command or output directory is needed for this static site.
5. Deploy.

FIRST ADMIN SETUP
1. Open your deployed website.
2. Enter the 12-digit setup code: 483917260541
3. Choose a password of at least 8 characters.
4. Log in with that password.

To change the one-time setup code before deploying, edit index.html and change SHOPPER_SETUP_CODE near the bottom.

IMPORTANT SECURITY LIMITATION
This is a browser-only personal version. Login and products are stored in that browser's local storage. This is convenient for personal use, but it is NOT strong security: the setup code is visible in the HTML source, and someone with access to the browser profile or source can bypass it. Data is not synced between browsers/devices. Do not rely on this version to protect a public admin account. A publicly accessible deployment that needs real security should use server-side authentication and a database.

Your products stay in the browser where you add them. Use Settings → Export backup to save your collection. Images are embedded into browser storage; use reasonably small images.

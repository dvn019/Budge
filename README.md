# Budge

See what’s left as you spend.

Budge is a simple weekly (or monthly) budget for people whose income changes. You set one budget, split it into pots (treats, food at home, transport…), and log what you buy in two taps. The tank on the home screen drains as you spend, and whatever’s left at the end of the week goes to savings.

**Open it:** https://dvn019.github.io/budge/

## Add it to your phone

- **iPhone (Safari):** tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** tap **Install** in the app, or the browser menu → **Install app**.

Once installed it opens like an app, works offline, and can show notifications.

## Your data

Everything stays on your phone (browser storage). Nothing is sent anywhere. Use **Settings → Save a backup** now and then, and **Restore a backup** to move to a new phone.

## What’s inside

| File | What it is |
|---|---|
| `index.html` | The page, share-card tags and app setup |
| `app.js` | The app (budget logic + screens, built with Preact + htm) |
| `style.css` | Styles |
| `sw.js` | Service worker: offline support and notifications |
| `manifest.webmanifest` | Name, icons and colours for installing |
| `icons/`, `og.png` | App icons and the share image |

No build step: it’s plain files served by GitHub Pages.

## Notifications

Settings → **Allow notifications** signs the phone up with the reminder server in `worker/` (a free Cloudflare Worker with a D1 database). Every 15 minutes it sends "Anything to log today?" to anyone whose reminder time has passed and who hasn't logged anything that day. It only stores the push sign-up, reminder time, time zone, last logged day and streak, never amounts.

The worker deploys automatically from GitHub Actions when `worker/` changes (needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repo secrets).

On iPhone, notifications only work after Budge is added to the Home Screen (iOS 16.4 or later).

## Stats and feedback

- **Stats:** [GoatCounter](https://www.goatcounter.com) counts screen views and a few actions (budget created, purchase logged, badge earned). No cookies, no amounts, nothing personal.
- **Feedback:** Settings → **Send feedback** opens a short Tally form inside the app.

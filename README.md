# My Grocery Smart Shopper

A dependency-free grocery checklist and manual price comparison PWA for GitHub Pages.

## Use

- Your original 28-item checklist becomes **My Grocery List**, with purchased states preserved. Search the master catalog, add an exact brand/variant, create lists and select catalog items for each list. Desired quantities count packs.
- Choose a product and delivery area/PIN. Enter the pack price, size, unit and stock for Canteen, Blinkit, Zepto, BigBasket, JioMart, Amazon Fresh, Flipkart Grocery or Swiggy Instamart.
- Comparisons convert grams to kilograms and millilitres to litres; pieces remain separate. Only fresh, in-stock observations compete for the best saved price **within the same product, area and unit dimension**. Equal prices can tie. Unknown stock, out-of-stock and observations older than 24 hours remain visible but never win.
- Edit an observation to prefill its form, then save after checking the price again. Saving timestamps the observation and replaces that store/product/area observation. Delete removes a quote. There is no price history.
- Download a JSON backup before switching devices or clearing browser data. Restore validates the entire file before asking to replace current data. Version 2 checklist backups are accepted too. Maximum import size: 5 MB.

## Live-data limitations

All current prices and stock are **manual observations**, including those entered for online retailers. There is no configured retailer API, scraping service, verified live quote or automatic stock refresh. Store links open homepages for checking and ordering, not matched product pages. No prices are pre-populated or represented as live.

Use the same exact product/brand/variant for meaningful comparisons. Prices depend on location, offers and eligibility; delivery fees, minimum baskets and account discounts are excluded. A lower unit price does not guarantee a cheaper order or an exact quantity match. The catalog is a user-maintained starter list, not a complete retailer inventory.

A future live adapter requires an authorized reliable source, explicit variant/area matching, source attribution and observation timestamps. It must distinguish live, cached and manual data. Backup validation currently only accepts manual sources so a file cannot spoof a live quote.

## Storage and migration

The app loads version 3 from `my-grocery-app-v3`. On the first upgrade, it reads the original `my-grocery-app-v2` array and migrates names, categories, duplicate entries and purchased states into catalog records and a default list. The original key is left untouched as a recovery copy. Future edits save only version 3. The default seed is used only when neither key exists; an intentionally empty checklist stays empty. Corrupt saved data is never silently replaced with seed data.

Data stays in localStorage on the same browser profile and site origin; there is no account sync or server backup. Private browsing, storage eviction or clearing site data can remove it. Storage failures display a message and reject mutations; backup remains available for the last loaded state. Restore replaces the complete current version 3 dataset after confirmation. Keep backups somewhere safe; they include your lists and manually entered locations/prices.

## Offline and updates

Serve the repository root over HTTPS (or localhost during development). The service worker caches the complete app shell, including JavaScript modules and styles. Once installation succeeds, lists, catalog, manual prices and backups work without the network. Retailer ordering still requires internet. The online indicator describes network connectivity, not live data or cache readiness.

The new worker waits for old app tabs to close before activating, avoiding mixed shell versions. After deployment, open the app online, close all its tabs/windows and reopen to receive the upgrade. Cache deletion is restricted to this app's known cache prefixes. Future shell changes must bump the cache version in `sw.js`.

## Development and validation

No build step or external runtime dependencies. Run `npm test` (Node 20+). Serve the root with any static HTTP server for browser testing. GitHub Pages can serve the root of a chosen branch; no backend or secrets are required.

Automated tests cover seed/store coverage, legacy migration, storage selection/corruption, dimension normalization, comparison metadata, backup round trips, malformed restore rejection and service-worker caching/scope behavior.

Browser smoke checks completed during implementation: create a custom list, add/check a catalog item, save Instamart and Canteen quotes, verify per-kg values and cheapest label, reload to verify persistence, then stop the HTTP server and reload the cached app. No browser console errors were observed during the normal flow. Platform-specific installation prompts and retailer ordering were not exercised.

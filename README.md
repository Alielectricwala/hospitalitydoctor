# The Hospitality Doctor — landing page

A static one-page site for The Hospitality Doctor (SRK Hospitality Solutions). It has no build step and no dependencies.

## Deploy on Vercel
1. Import this repo in Vercel. Framework preset: **Other**. Leave the build command empty. Output directory: `/` (root).
2. Add the custom domain. The site assumes **https://www.srkhospitality.net**. If you use a different domain, find-and-replace `https://www.srkhospitality.net` in `index.html`, `sitemap.xml`, `robots.txt` and `llms.txt`.
3. After the site is live, submit `/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## SEO / GEO
- Title, description, canonical, hreflang, Open Graph and Twitter tags, and geo meta tags for Jaipur.
- JSON-LD `@graph` covering ProfessionalService/LocalBusiness, Person, WebSite, WebPage (speakable), HowTo (the method), an OfferCatalog listing all 14 services, and FAQPage.
- An answer-first summary block and an FAQ, written so AI answer engines can quote them directly.
- `llms.txt` holds a plain-text fact sheet for LLM crawlers. `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others.
- Semantic HTML, a single H1, alt text, lazy-loaded WebP images and a preloaded hero image. Animations respect `prefers-reduced-motion`.
- `vercel.json` sets security headers (CSP, HSTS and others) and long-lived caching for `/assets`.

## Editing
- Copy: `index.html`. Also update the matching JSON-LD and `llms.txt` so they stay in sync.
- Styles: `assets/css/styles.css`. Motion and the diagnostic quiz: `assets/js/main.js`.
- Leads go to WhatsApp (+91 99204 59695) and email. There is no backend.

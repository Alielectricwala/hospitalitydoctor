# The Hospitality Doctor: website

A static site for The Hospitality Doctor (SRK Hospitality Solutions), plus one Vercel serverless function for the booking form. There's no build step.

## Structure
- `index.html`: landing page (SEO, GEO and JSON-LD)
- `privacy.html`, `terms.html`, `404.html`: legal and error pages
- `assets/css/styles.css`: brand design tokens and components following Apple's HIG
- `assets/js/main.js`: interactions, form validation, consent-gated analytics
- `api/contact.js`: booking form endpoint (validation, spam protection, email via Resend)
- `vercel.json`: redirects, security headers (CSP, HSTS), caching
- `sitemap.xml`, `robots.txt`, `llms.txt`, `site.webmanifest`

## Deploy on Vercel
1. Import the repo. Framework preset: **Other**. Leave the build command empty. Output directory: root.
2. Add the domains `www.srkhospitality.net` (primary) and `srkhospitality.net`. The apex domain 308-redirects to www, and HTTP is upgraded to HTTPS automatically.
3. **Environment variables** (Project → Settings → Environment Variables). They are never exposed to the browser:
   - `RESEND_API_KEY`: from resend.com (verify the domain there first)
   - `CONTACT_TO_EMAIL`: e.g. `sanchita@srkhospitality.net`
   - `CONTACT_FROM_EMAIL`: e.g. `The Hospitality Doctor <hello@srkhospitality.net>`
   - `ALLOWED_ORIGINS` (optional): `https://www.srkhospitality.net,https://srkhospitality.net`
4. **Analytics:** enable **Web Analytics** and **Speed Insights** in the Vercel dashboard. The scripts load only after a visitor clicks *Allow* in the consent banner.
5. Submit `https://www.srkhospitality.net/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

Until the email variables are set, the form returns a friendly error that points visitors to WhatsApp and email.

## Spam protection
The booking form uses a hidden honeypot field, a minimum fill time of 3 seconds, a same-origin check, best-effort rate limiting per IP (5 per 10 minutes) and server-side validation. For stronger protection, add Cloudflare Turnstile or Vercel Firewall rate limiting.

## Brand tokens
Brand Black `#141414` · Brand Gold `#D5A855` · Gold Highlight `#ECC369` · Deep Gold `#7D5F2A` (gold used as text on light surfaces, for AA contrast). Light and dark mode follow the visitor's system setting.

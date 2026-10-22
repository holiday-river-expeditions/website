/**
 * Design-import template for Arctic Reservations' guest-facing site.
 *
 * Arctic's "Import Design" analyzer scrapes this URL and uses it as the
 * chrome for checkout/reserve pages, injecting its content where it finds
 * the literal {SITE-TITLE} and {SITE-BODY} placeholders.
 *
 * Served as a route handler (not a page) so the root layout's interactive
 * header/footer never wrap it — a scraped clone can't hydrate, so this
 * document is deliberately self-contained:
 *  - every href/src is ABSOLUTE back to this site (relative URLs would
 *    resolve against Arctic's domain on the clone)
 *  - zero JavaScript, no forms, no client components
 *  - styling is a small hand-written stylesheet mirroring the brand tokens
 *    (globals.css), because the built Tailwind CSS has hashed URLs
 *  - fonts come from the Typekit kit (guz5fen) — the Arctic guest domain
 *    must be on the kit's allowed-domains list
 *
 * Nav and footer links come from the same lists as the site's Header and
 * Footer. The footer leaves out the newsletter signup (it needs a form and
 * JavaScript). Arctic only picks up changes when someone re-runs Import
 * Design in the Arctic admin.
 *
 * Not for humans: noindexed via header and meta.
 */

import {
    footerDefaults,
    followLinks,
    resourceLinks,
} from '@/components/layout/footer-links';
import { navItems } from '@/components/layout/Nav';
import { contactPhone } from '@/lib/contact-defaults';
import { getSiteSettings } from '@/lib/sanity';
import { getSiteUrl } from '@/lib/site-url';

// Absolute on purpose: relative links would break on the clone.
const SITE = getSiteUrl();

const absolute = (href: string) =>
    href.startsWith('/') ? `${SITE}${href}` : href;

// Studio values go into raw HTML, so escape them.
const escapeHtml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const linkItem = (label: string, href: string, external = false) =>
    `<li><a href="${escapeHtml(absolute(href))}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a></li>`;

export async function GET() {
    // A Sanity outage shouldn't take the checkout chrome down with it.
    const settings = await getSiteSettings().catch(() => null);
    const phone = contactPhone(settings);
    const address = settings?.address ?? footerDefaults.address;
    const follow = followLinks(settings?.socialLinks);

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{SITE-TITLE}</title>
<link rel="stylesheet" href="https://use.typekit.net/guz5fen.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap">
<style>
  :root {
    --red: #d00a0b; --white: #fcfcfc; --grey: #b6b6b6;
    --onyx: #2c2b29; --cream: #f3f0eb;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { height: 100%; }
  body {
    background: var(--white); color: var(--onyx);
    font-family: 'PT Sans', Arial, sans-serif; font-size: 16px; line-height: 1.4;
    /* Sticky footer: short Arctic pages otherwise leave the footer floating
       mid-viewport with dead space below. */
    min-height: 100vh; display: flex; flex-direction: column;
  }
  main.hre { flex: 1; }
  .gothic { font-family: alternate-gothic-atf, Oswald, Arial, sans-serif; text-transform: uppercase; }
  a { color: var(--red); }
  :focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }

  header.hre {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
    gap: 16px; padding: 20px 48px; background: var(--white);
  }
  /* Same spacing as the site nav: 20px gaps until 1280px, so the six
     labels fit on one line at 1024px. */
  header.hre nav ul { display: flex; gap: 20px; list-style: none; }
  @media (min-width: 1280px) {
    header.hre nav ul { gap: 32px; }
  }
  header.hre nav a {
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; font-size: 20px; font-weight: 500;
    line-height: 1; color: var(--red); text-decoration: none;
    white-space: nowrap;
  }
  header.hre nav a:hover { opacity: 0.7; }
  header.hre .logo { justify-self: center; display: block; }
  header.hre .logo img { height: 48px; width: auto; display: block; }
  header.hre .cta { justify-self: end; }
  header.hre .cta a {
    display: inline-block; background: var(--red); color: var(--white);
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; font-size: 19px; font-weight: 500;
    line-height: 1; letter-spacing: 0.025em; text-decoration: none;
    padding: 8px 24px; border-radius: 999px;
  }
  header.hre .cta a:hover { background: #b90909; }
  /* The site swaps the nav for a hamburger below 1024px. The template has
     no JavaScript, so the nav just drops out and the logo and Book Now
     spread to the edges. */
  @media (max-width: 1023px) {
    header.hre { display: flex; justify-content: space-between; }
    header.hre nav { display: none; }
  }
  @media (max-width: 767px) {
    header.hre { padding: 16px 24px; }
    header.hre .logo img { height: 32px; }
    header.hre .cta a { font-size: 16px; padding: 6px 16px; }
  }

  .hre-title { padding: 40px 48px 8px; background: var(--white); }
  .hre-title h1 {
    max-width: 1024px; margin: 0 auto;
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; font-weight: 900; color: var(--red);
    font-size: 44px; line-height: 0.95;
  }
  main.hre { padding: 24px 48px 80px; background: var(--white); }
  main.hre .body { max-width: 1024px; margin: 0 auto; }
  @media (max-width: 767px) {
    .hre-title { padding: 28px 24px 8px; }
    .hre-title h1 { font-size: 34px; }
    main.hre { padding: 16px 24px 64px; }
  }

  footer.hre { background: var(--cream); color: var(--onyx); }
  footer.hre .inner { max-width: 1280px; margin: 0 auto; padding: 40px 24px 64px; }
  footer.hre .columns {
    display: grid; gap: 48px; grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 767px) {
    footer.hre .columns { grid-template-columns: 1fr; }
  }
  footer.hre h2 {
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; font-size: 16px; font-weight: 400;
    letter-spacing: 0.05em;
  }
  footer.hre ul, footer.hre .find {
    list-style: none; margin-top: 16px;
    display: flex; flex-direction: column; gap: 8px;
  }
  footer.hre ul a, footer.hre .find a {
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; font-size: 16px; font-weight: 600;
    letter-spacing: 0.05em; color: var(--onyx); text-decoration: none;
    display: inline-block; padding: 4px 0;
  }
  footer.hre ul a:hover, footer.hre .find a:hover { opacity: 0.7; }
  footer.hre .find address, footer.hre .find .phone {
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; font-style: normal; font-weight: 600;
    font-size: 11px; letter-spacing: 0.1em; white-space: pre-line;
  }
  footer.hre .bottom {
    margin-top: 64px; display: flex; align-items: flex-end;
    justify-content: space-between; gap: 32px;
  }
  footer.hre .bottom .logo img { height: 64px; width: auto; display: block; }
  footer.hre .bottom .badge { height: 80px; width: auto; }
  @media (max-width: 767px) {
    footer.hre .bottom .logo img { height: 52px; }
    footer.hre .bottom .badge { height: 64px; }
  }

  /* --- Arctic widget skin: restyle the reservation UI injected into
         {SITE-BODY} (tabs, forms, buttons ship with Arctic's default
         Bootstrap-era look). Selectors target Arctic's guest-site markup. --- */
  main.hre h1, main.hre h2, main.hre h3, main.hre legend {
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; color: var(--onyx);
  }
  main.hre .btn-primary, main.hre .btn.btn-primary,
  main.hre input[type="submit"], main.hre button[type="submit"] {
    background: var(--red) !important; background-image: none !important;
    border: none !important; border-radius: 999px !important;
    color: var(--white) !important; text-shadow: none !important;
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif !important;
    text-transform: uppercase !important; letter-spacing: 0.04em;
    font-size: 17px !important; padding: 10px 24px !important;
    cursor: pointer;
  }
  main.hre .btn-primary:hover, main.hre input[type="submit"]:hover,
  main.hre button[type="submit"]:hover { background: #b90909 !important; }
  main.hre .btn, main.hre button { cursor: pointer; }
  main.hre input[type="text"], main.hre input[type="email"],
  main.hre input[type="tel"], main.hre input[type="number"],
  main.hre input[type="date"], main.hre select, main.hre textarea {
    border: 1px solid rgba(44, 43, 41, 0.3); border-radius: 0;
    background: var(--white); padding: 8px 12px;
    font-family: 'PT Sans', Arial, sans-serif;
  }
  /* Arctic's guest toolbar (injected by toolbar.js as .gfs-toolbar):
     Book Trip / My Activities / Photos / Gift Certificate + Cart / Login */
  main.hre .gfs-toolbar {
    background: transparent !important; border: none !important;
    border-bottom: 2px solid rgba(44, 43, 41, 0.15) !important;
    border-radius: 0 !important; box-shadow: none !important;
    display: flex; flex-wrap: wrap; justify-content: space-between;
    padding: 0 !important; margin-bottom: 24px;
  }
  main.hre .gfs-toolbar ul {
    list-style: none; display: flex; flex-wrap: wrap; gap: 2px;
    margin: 0; padding: 0; background: transparent;
  }
  main.hre .gfs-toolbar li { margin: 0; }
  main.hre .gfs-toolbar a {
    display: inline-block; padding: 10px 14px;
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; letter-spacing: 0.04em; font-size: 15px;
    color: var(--onyx); text-decoration: none;
    background: transparent !important; border: none !important;
  }
  main.hre .gfs-toolbar a:hover { color: var(--red); }
  main.hre .gfs-toolbar li.active a {
    color: var(--red);
    box-shadow: inset 0 -2px 0 var(--red);
  }

  /* Bootstrap-era horizontal forms: stack labels above inputs and
     left-align, replacing the cramped right-aligned label column. */
  main.hre .form-horizontal .control-group {
    display: block; margin: 0 0 20px;
  }
  main.hre .form-horizontal .control-label {
    float: none; width: auto; text-align: left; padding: 0 0 6px;
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;
    color: var(--onyx);
  }
  main.hre .form-horizontal .controls { margin-left: 0 !important; }

  /* Grey wells and action strips become brand panels. */
  main.hre .well, main.hre .book-form {
    background: #f6f4f0 !important; border: none !important;
    border-left: 3px solid var(--red) !important;
    border-radius: 0 !important; box-shadow: none !important;
    padding: 20px 24px !important;
  }
  main.hre .form-actions {
    background: transparent !important; border: none !important;
    padding-left: 0 !important; margin-left: 0 !important;
  }
  main.hre input:focus, main.hre select:focus, main.hre textarea:focus {
    border-color: var(--red) !important; outline: none;
    box-shadow: 0 0 0 2px rgba(208, 10, 11, 0.15) !important;
  }
  main.hre .table th {
    font-family: alternate-gothic-atf, Oswald, Arial, sans-serif;
    text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--onyx);
  }
</style>
</head>
<body>
<header class="hre">
  <nav aria-label="Main">
    <ul>
      ${navItems.map((l) => linkItem(l.label, l.href)).join('\n      ')}
    </ul>
  </nav>
  <a class="logo" href="${SITE}" aria-label="Holiday River Expeditions home">
    <img src="${SITE}/logo-horizontal-red.svg" alt="" width="2000" height="798">
  </a>
  <div class="cta"><a href="${SITE}/book">Book Now</a></div>
</header>

<div class="hre-title"><h1>{SITE-TITLE}</h1></div>

<main class="hre">
  <div class="body">{SITE-BODY}</div>
</main>

<footer class="hre">
  <div class="inner">
    <div class="columns">
      <div>
        <h2>Follow Us</h2>
        <ul>
          ${follow.map((l) => linkItem(l.label, l.href, true)).join('\n          ')}
        </ul>
      </div>
      <div>
        <h2>Resources</h2>
        <ul>
          ${resourceLinks.map((l) => linkItem(l.label, l.href, 'external' in l && l.external)).join('\n          ')}
        </ul>
      </div>
      <div>
        <h2>Find Us</h2>
        <div class="find">
          <a href="${SITE}/contact">Contact</a>
          <address>${escapeHtml(address)}</address>
          <a class="phone" href="tel:+1${phone.replace(/\D/g, '')}">${escapeHtml(phone)}</a>
        </div>
      </div>
    </div>
    <div class="bottom">
      <a class="logo" href="${SITE}" aria-label="Holiday River Expeditions home">
        <img src="${SITE}/logo-horizontal-red.svg" alt="" width="2000" height="798">
      </a>
      <img class="badge" src="${SITE}/nps-authorized-concessioner.png" alt="National Park Service Authorized Concessioner" width="120" height="150">
    </div>
  </div>
</footer>
</body>
</html>`;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
        },
    });
}
